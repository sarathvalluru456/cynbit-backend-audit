/** Illustrative reference implementation; adapt to the production framework. */
import { z } from "zod";

const inquirySchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(5000),
}).strict();

export async function submitInquiry(input: unknown, ctx: {
  requestId: string;
  ipHash: string; // Hash or tokenise; do not log raw IP with the payload.
  idempotencyKey?: string;
}) {
  // 1. Apply a distributed, server-side limiter before expensive work.
  await rateLimiter.consume(`inquiry:${ctx.ipHash}`, { points: 3, duration: 3600 });

  // 2. Validate and reject unknown fields at the trust boundary.
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_INPUT", requestId: ctx.requestId };
  }

  // 3. Prevent browser retries/double-clicks from creating duplicates.
  if (ctx.idempotencyKey && await idempotencyStore.exists(ctx.idempotencyKey)) {
    return { ok: true, code: "ALREADY_ACCEPTED", requestId: ctx.requestId };
  }

  // 4. Store the minimum record; do not put message text in logs.
  const inquiry = await db.transaction(async (tx) => {
    const row = await tx.inquiry.create({
      data: {
        ...parsed.data,
        requestId: ctx.requestId,
        status: "accepted",
      },
      select: { id: true },
    });
    if (ctx.idempotencyKey) {
      await tx.idempotency.create({ data: { key: ctx.idempotencyKey, inquiryId: row.id } });
    }
    await tx.outbox.create({ data: { kind: "INQUIRY_NOTIFICATION", aggregateId: row.id } });
    return row;
  });

  metrics.increment("inquiry.accepted");
  return { ok: true, code: "ACCEPTED", inquiryId: inquiry.id, requestId: ctx.requestId };
}

// Worker boundary: retry provider failures with backoff and a dead-letter queue.
export async function notifyInquiry(job: { inquiryId: string; requestId: string }) {
  const inquiry = await db.inquiry.findUniqueOrThrow({ where: { id: job.inquiryId } });
  await emailProvider.send({
    template: "new-inquiry",
    to: process.env.INQUIRY_INBOX!,
    variables: { fullName: inquiry.fullName, email: inquiry.email, message: inquiry.message },
  });
  await db.inquiry.update({ where: { id: inquiry.id }, data: { status: "notified" } });
}
