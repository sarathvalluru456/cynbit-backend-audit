# Cynbit Backend Technical Audit

Passive, publicly observable backend assessment prepared for the Backend Developer Intern challenge.

## Scope

This project analyzes only public Cynbit pages and assets retrieved with ordinary HTTPS `GET` requests. It does **not** submit forms, invoke server actions, enumerate hidden endpoints, attempt authentication, fuzz inputs, bypass controls, or generate load.

Target observed: [https://www.cynbit.in/](https://www.cynbit.in/)
Observation date: 2026-11-02

## Deliverables

- [`REPORT.md`](REPORT.md) — architectural analysis, findings, evidence, and recommendations.
- [`architecture.mmd`](architecture.mmd) — proposed target architecture.
- [`recommendations/contact-route.ts`](recommendations/contact-route.ts) — illustrative validation, abuse controls, and safe error handling.
- [`recommendations/authz-policy.ts`](recommendations/authz-policy.ts) — illustrative authorization policy for future authenticated APIs.
- [`scripts/passive-audit.py`](scripts/passive-audit.py) — repeatable passive collector for the allowlisted public pages.
- [`evidence/observations.md`](evidence/observations.md) — compact evidence log and limitations.

## Running the passive collector

```bash
python3 scripts/passive-audit.py --output evidence/latest.json
```

The collector is intentionally conservative. It performs a small number of ordinary `GET` requests to the public home, contact, services, privacy, terms, cookies, robots, and sitemap URLs. It does not follow hidden links, submit forms, send POST requests, or test disallowed paths.

## Important interpretation note

The report identifies design risks and verification priorities; it does not claim that Cynbit has a confirmed exploitable vulnerability. Server-side behavior, database permissions, rate limits, monitoring, and authentication controls require authorized access or a documented test window to verify.

## Suggested submission

Submit the repository URL together with a short note explaining that the assessment is passive-only and that the code snippets are reference implementations, not changes to Cynbit's production systems.
