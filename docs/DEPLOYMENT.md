# Deployment Guide

## Neon PostgreSQL

1. Create a Neon project.
2. Create a database named `mobifund`.
3. Copy the pooled connection string.
4. Set `DATABASE_URL` to the Neon URL and keep `sslmode=require`.
5. Run `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed`.

## Backend API on Vercel

1. Import the repository into Vercel.
2. Create a Vercel project with root directory `apps/api`.
3. Add `DATABASE_URL` and `JWT_SECRET`.
4. Use the included `apps/api/vercel.json`.
5. The API is served through `src/vercel.ts`.

## Admin on Vercel

1. Create a second Vercel project with root directory `apps/admin`.
2. Add `NEXT_PUBLIC_API_URL` pointing to the deployed API URL.
3. Use the included `apps/admin/vercel.json`.

## Mobile with Expo

1. Set `EXPO_PUBLIC_API_URL`.
2. Run `npm run dev:mobile`.
3. Use EAS Build for Android APK/AAB when ready.
