# Vercel Deployment

MobiFund uses two Vercel projects:

1. `mobifund-api`
   - Root directory: `apps/api`
   - Build command: included in `apps/api/vercel.json`
   - Environment variables:
     - `DATABASE_URL`
     - `JWT_SECRET`

2. `mobifund-admin`
   - Root directory: `apps/admin`
   - Build command: included in `apps/admin/vercel.json`
   - Environment variables:
     - `NEXT_PUBLIC_API_URL`

## Deployment Order

1. Push the repository to GitHub.
2. Create the Neon database and copy the pooled connection string.
3. Import `apps/api` into Vercel and add API environment variables.
4. Deploy the API.
5. Copy the API deployment URL.
6. Import `apps/admin` into Vercel and set `NEXT_PUBLIC_API_URL`.
7. Deploy the admin dashboard.
8. Run database migration and seed commands once against Neon.

## Health Check

After deployment:

```bash
curl https://your-mobifund-api.vercel.app/loan-products
```

You should receive the seeded loan products after migrations and seed data are applied.
