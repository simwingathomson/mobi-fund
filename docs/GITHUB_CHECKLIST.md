# GitHub Checklist

1. Create a new GitHub repository named `mobifund`.
2. Commit this project folder.
3. Push to `main`.
4. In Vercel, import the same repository twice:
   - once with root `apps/api`
   - once with root `apps/admin`
5. Add the environment variables from `.env.production.example`.
6. Never commit `.env`.

Suggested first commit:

```bash
git init
git add .
git commit -m "Initial MobiFund MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mobifund.git
git push -u origin main
```
