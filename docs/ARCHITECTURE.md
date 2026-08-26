# Inverted Forest — Platform Architecture

Inverted Forest is not just a marketing site: it is the operating system of
an online school. This document explains how the pieces fit together and how
the platform evolves from "compatible with Make.com + Google Sheets" to
"replaces them natively".

## 1. High-level picture

```
                       ┌──────────────────────────────┐
   Visitor ──────────► │  Next.js App (Vercel)        │
                       │  /ru /en  public site        │
                       │  /admin   lightweight CRM    │
                       │  /portal  student portal (…) │
                       └──────┬───────────────┬───────┘
                              │               │
                    DataProvider          POST /api/webhooks/payment
                              │               ▲
              ┌───────────────┴─────┐         │
              │ SeedProvider (demo) │   ┌─────┴──────┐    ┌────────────┐
              │ SupabaseProvider    │   │  Make.com  │◄───┤ PayPal /   │
              └─────────┬───────────┘   │  scenarios │    │ Allpay     │
                        │               └─────┬──────┘    └────────────┘
                 ┌──────┴───────┐             │
                 │  Supabase    │       ┌─────┴──────┐   ┌─────────────┐
                 │  PostgreSQL  │       │ Telegram   │   │ Email /     │
                 └──────────────┘       │ Bot        │   │ EasyCount / │
                                        └────────────┘   │ Sheets      │
                                                          └─────────────┘
```

The site **never processes payments**. It redirects to per-group payment
URLs (PayPal links today, Allpay later) and receives the *result* via a
webhook, which makes it the system of record.

## 2. The data layer — one interface, two backends

All UI (public pages and admin) calls `getData()` from `src/lib/data`,
which returns a `DataProvider`:

- **`SeedProvider`** — in-memory content from `src/lib/data/seed.ts`.
  Active when Supabase env vars are absent. The entire site, including the
  admin panel, works with zero configuration ("demo mode", clearly
  bannered in the admin).
- **`SupabaseProvider`** — production implementation over PostgreSQL.
  Activated automatically by setting `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

Because nothing above the provider knows which backend is live, replacing
external automation with native features later (payments, invites, emails)
is additive work behind the same interface.

## 3. Localization model

- **UI strings** live in `src/messages/{ru,en}.json`, served by `next-intl`.
- **Content** (courses, teachers) is localized *in the database*:
  `course_translations` / `teacher_translations` rows keyed by
  `(entity_id, locale)`. Adding Hebrew = `INSERT INTO locales` + new
  translation rows. No schema change, no code change in the data layer.
- **URLs** are locale-prefixed (`/ru/courses/ancient-greece`,
  `/en/courses/ancient-greece`) with `hreflang` alternates, localized
  sitemap entries and per-locale OpenGraph metadata.
- **Language resolution**: next-intl middleware — cookie (explicit user
  choice, never overridden) → `Accept-Language` → `ru` default.

## 4. Identity rules

- `study_groups.id` (`group_101`) is **immutable** and is the only key used
  in registration URLs, webhooks and automation payloads.
- `slug` fields are human-facing and freely editable.
- Each study group owns its own `payment_url` and `telegram_channel_id`,
  so pricing pages, checkout and Telegram access all key off the group.

## 5. Registration & payment flow

1. `/{locale}/register/{groupId}` shows course/group summary + form
   (React Hook Form + Zod, localized validation).
2. Server action `submitRegistration`:
   - re-validates with Zod on the server,
   - rejects full/closed groups,
   - upserts the student, inserts an enrollment (`pending_payment`),
   - fires `MAKE_REGISTRATION_WEBHOOK_URL` (fire-and-forget, 5s timeout),
   - returns the group's `payment_url`.
3. Client shows confirmation and redirects to the external payment page.
4. Make.com (triggered by PayPal/Allpay) calls
   `POST /api/webhooks/payment` with `x-webhook-secret`:
   - records the payment,
   - `payment.succeeded` → enrollment `active`, seat count +1 (via the
     `increment_seats_for_enrollment` SQL function),
   - `payment.failed` → enrollment `past_due`,
   - everything is written to `automation_logs`.
5. Telegram invite (one-time, 7-day expiry) and emails remain Make/bot
   territory for now; the DB stores `telegram_invited_at` and channel
   status so the admin panel can display it.

## 6. Admin panel

`/{locale}/admin` — a lightweight CRM over the same data layer: dashboard
KPIs, courses (RU/EN side-by-side), study groups (internal IDs, payment
URLs, capacity), students, payments, Telegram integration status, and a
settings page showing which integrations are configured.

Access: in demo mode it is open (with banner); with Supabase configured it
requires an authenticated Supabase user whose email is in `ADMIN_EMAILS`.

## 7. Roadmap hooks already in place

| Future feature      | What exists today                                      |
| ------------------- | ------------------------------------------------------ |
| Native payments     | `payments`/`invoices` tables, provider enum, webhook   |
| Student portal      | `/portal` route, students/enrollments relations        |
| Homework/materials  | course `curriculum` JSONB, per-group Telegram channels |
| Native emails       | `email_templates` table (localized, keyed)             |
| Native Telegram     | `telegram_channels` table + admin Telegram panel       |
| More languages      | `locales` table + translation-row model                |
| Analytics           | `automation_logs`, timestamped payments/enrollments    |

## 8. Repository layout

```
src/
  app/                    App Router
    [locale]/(marketing)/ public site (home, courses, register, …)
    [locale]/admin/       admin CRM
    api/webhooks/payment/ inbound automation webhook
    sitemap.ts robots.ts  SEO
  components/  ui/ layout/ marketing/ forms/ admin/
  i18n/        next-intl routing/request/navigation
  lib/
    data/      DataProvider + seed & supabase implementations
    supabase/  server/browser clients
    actions.ts server actions (registration, newsletter)
    types.ts   domain model
  messages/    ru.json en.json (UI strings)
supabase/
  migrations/  0001_init.sql (schema + RLS + functions)
  seed.sql     production seed
```

## 9. Security

Payment instruments never touch the platform; personal data is confined to
service-role-only tables behind RLS; both write paths are rate limited,
Zod-validated server-side and (for the webhook) idempotent and
timing-safe. Full detail, threat model and operator checklist:
[SECURITY.md](SECURITY.md).

## 10. Environment variables

See `.env.example`. Nothing is required to run locally — demo mode covers
the full experience. Production needs Supabase keys, `ADMIN_EMAILS`,
`PAYMENT_WEBHOOK_SECRET` and (optionally) `MAKE_REGISTRATION_WEBHOOK_URL`.
