# Neon PostgreSQL Setup

1. Create a Neon project.
2. Create a database named `mobifund`.
3. Copy the pooled connection string.
4. Add it to `.env` and to both Vercel projects as `DATABASE_URL`.
5. Keep `sslmode=require` in the connection string.
6. Run:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

For staging, create a Neon branch and use that branch connection string in a separate Vercel preview environment.
