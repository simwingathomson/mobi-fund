# MobiFund

MobiFund is a complete digital lending platform scaffold: NestJS REST API, Prisma/Neon PostgreSQL schema, Expo customer app, and Next.js admin dashboard.

## Structure

- `apps/api`: authentication, role-based access, KYC, loan products, applications, manual repayment references, reports, audit logs, and admin-controlled disbursement status.
- `apps/mobile`: Android-first customer loan app built with Expo and TypeScript.
- `apps/admin`: secure admin dashboard built with Next.js and Tailwind CSS.
- `packages/database`: Prisma schema and seed data for Neon PostgreSQL.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill the Neon `DATABASE_URL` and `JWT_SECRET`.
3. Run `npm install`.
4. Run `npm run db:generate`, `npm run db:migrate:dev`, and `npm run db:seed` for local development.
5. Start the API with `npm run dev:api`, admin with `npm run dev:admin`, and mobile with `npm run dev:mobile`.

The admin dashboard and mobile app include demo fallbacks, so their screens still open while the API/database are being configured. Once the API is running, they use `NEXT_PUBLIC_API_URL` and `EXPO_PUBLIC_API_URL`.

## Demo Accounts

- Admin: `admin@mobifund.local` / `Admin123!`
- Customer: `customer@mobifund.local` / `Customer123!`

## Payments

This version uses manual repayment references. Customers submit proof/reference details, and administrators confirm payments after reconciliation.

## MVP Completion Status

This package is an MVP implementation scaffold, not only wireframes. It includes persistent models, API routes, KYC document records, loan approval/rejection, repayment schedules, manual payment confirmation, receipts, audit logs for key actions, API-aware mobile screens, and an API-aware admin dashboard.

Before production launch, complete the production checklist in `docs/PRODUCTION_CHECKLIST.md`.

## Validation

See `docs/VALIDATION.md`. Dependency installation was started in this workspace but timed out before build commands could be completed, so run the listed commands on your machine after install finishes.
