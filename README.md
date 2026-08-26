# Inverted Forest

Bilingual (RU/EN) platform for an online school of history & philosophy:
public site, course catalog, registration → payment flow, and an admin CRM.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind · next-intl ·
Supabase · Framer Motion · React Hook Form + Zod**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /ru
```

No configuration needed — without Supabase env vars the app runs in
**demo mode** on seed content (including the admin panel at `/ru/admin`).

## Production setup

1. Create a Supabase project, run `supabase/migrations/0001_init.sql` and
   `supabase/migrations/0002_hardening.sql`, then `supabase/seed.sql`.
2. Copy `.env.example` → `.env.local` and fill in the keys.
3. Deploy to Vercel (the repo ships a `vercel.json` for Next.js).

## Key routes

| Route                          | What                                  |
| ------------------------------ | ------------------------------------- |
| `/ru`, `/en`                   | localized public site                 |
| `/ru/courses/[slug]`           | course page with schedule & groups    |
| `/ru/register/[groupId]`       | registration → external payment       |
| `/ru/admin`                    | admin dashboard (CRM)                 |
| `POST /api/webhooks/payment`   | payment results from Make.com         |

Full architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Security & data protection: [docs/SECURITY.md](docs/SECURITY.md).
