# Passive evidence log

**Date:** 2026-11-02  
**Target:** `https://www.cynbit.in/`  
**Method:** ordinary HTTPS GET requests and inspection of publicly served HTML/JS; no POST, form submission, authentication attempt, fuzzing, enumeration, or load generation.

## Observed

- Response server header: `Vercel`.
- HTML content type: `text/html; charset=utf-8`.
- Next.js static chunks under `/_next/static/`.
- HSTS present: `strict-transport-security: max-age=63072000`.
- Public cache response observed: `public, max-age=0, must-revalidate`.
- Contact form fields: `fullName`, `email`, optional `company`, optional `industry`, required `message`.
- Contact bundle invokes server action `submitInquiry` with `FormData`.
- Contact form has no HTML `action` or `method` attribute.
- `robots.txt` allows `/` and disallows `/api/`, `/admin/`, `/portal/`.
- Privacy page names Resend and Prisma as third-party/service technologies.
- Careers application requests DOB, gender, permanent address, phone/WhatsApp, education, scores, profiles, and statement.

## Not observed in the sampled responses

- `Content-Security-Policy`
- `X-Frame-Options`
- `Permissions-Policy`
- `Referrer-Policy`

Absence in sampled public responses is a hardening finding, not proof of exploitability.

## Explicit limits

The audit did not test server-side validation, rate limits, authentication, authorization, database permissions, queueing, provider configuration, logs, or retention jobs. Those require authorized access and synthetic data.
