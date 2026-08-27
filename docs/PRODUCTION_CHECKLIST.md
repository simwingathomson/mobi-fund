# Production Checklist

## Security

- Replace development `JWT_SECRET` with a rotated secret from a secure vault.
- Add refresh tokens and short-lived access tokens.
- Add rate limiting to auth and payment endpoints.
- Enforce HTTPS only.
- Move admin dashboard authentication to a real admin login flow.
- Add structured audit middleware for every admin mutation.

## Neon PostgreSQL

- Use Neon's pooled connection string for serverless deployments.
- Add database backups and branch-based staging environments.
- Keep database credentials server-only in Vercel environment variables.
- Use private object storage for identity documents, profile photos, agreements, and receipts.

## Lending Operations

- Confirm interest, fee, and repayment schedule rules with legal/compliance.
- Add loan agreement generation before disbursement.
- Add delinquency/default rules and late fee policies.
- Add manual payment reconciliation screens.

## Payments

- Keep manual repayment confirmation until a payment provider is selected.
- Require admin reconciliation before confirming customer-submitted payment references.
- Add duplicate-reference detection and accounting export before launch.

## Quality

- Add unit tests for auth, loan calculations, role guards, payment confirmation, and reports.
- Add API integration tests against a Neon test branch.
- Add Playwright checks for the admin dashboard.
- Run Android device testing for registration, login, KYC, loan apply, and payments.
