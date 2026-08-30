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
                       │  /admin   CRM + copy editor  │
                       │  /portal  student portal (…) │
                       └──────┬───────────────┬───────┘
                              │               │
                    DataProvider          POST /api/webhooks/allpay
                              │               ▲  (SHA256-signed)
              ┌───────────────┴─────┐         │
              │ SeedProvider (demo) │   ┌─────┴──────┐
              │ SupabaseProvider    │   │   Allpay   │
              └─────────┬───────────┘   └────────────┘
                        │
                 ┌──────┴───────┐
                 │  Supabase    │◄──── the source of truth
                 │  PostgreSQL  │
                 └──────┬───────┘
                        │ domain_events
          ┌─────────────┼──────────────┬───────────────┐
          ▼             ▼              ▼               ▼
   ┌────────────┐ ┌──────────┐  ┌───────────┐  ┌─────────────┐
   │ Telegram   │ │  Email   │  │ Make.com  │  │ /api/cron/  │
   │ Bot        │ │ (Resend) │  │ (optional)│  │ tick hourly │
   └────────────┘ └──────────┘  └─────┬─────┘  └─────────────┘
                                      ▼
                              Google Sheets etc.
```

The site **never processes payments**. It asks Allpay to create one, sends
the payer there, and learns the outcome from a signed webhook.

Two properties of this drawing are load-bearing:

**The site is the first receiver, not Make.com.** Signature verification,
idempotency and the ledger belong in code, and Supabase can only be the
source of truth if it is written to before anything else hears about it.
Make subscribes to `domain_events` and can be unplugged without loss —
which is what the long-term goal of replacing it actually requires.

**The hourly sweep is not housekeeping.** Allpay documents webhooks for
successful payments and refunds only. A *failed* monthly charge announces
itself to nobody, so the grace period, the past-due email and the eventual
removal from a channel are all built on polling `subscriptionstatus`.

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

## 5. Registration, payment and access

1. `/{locale}/register/{groupId}` shows the course and group summary and the
   form. For a children's or teens' group it also asks who is attending:
   the `students` row is the paying parent, and the child's name lives on
   the enrollment. Two siblings from one address are two enrollments.
2. The payer chooses **monthly** or **the whole course up front**.
3. Server action `submitRegistration` re-validates, refuses full groups,
   upserts the student and creates (or reuses) a `pending_payment`
   enrollment. Reuse matters: someone who abandoned checkout an hour ago
   and came back used to collide with the uniqueness index and see a bare
   error.
4. `AllpayProvider.createCheckout` mints a payment whose **`order_id` is the
   enrollment's own uuid**, with `add_field_1` carrying the group id. A
   monthly plan sends `subscription: {end_type: 3, end_n: duration_months}`,
   so Allpay stops charging when the course ends without anyone remembering
   to switch it off. The payer is redirected to the returned `payment_url`.
   With no Allpay credentials configured the group's hand-made link is used
   instead — those payments arrive unattached, by design, because a static
   link cannot carry an order id.
5. `POST /api/webhooks/allpay`:
   - verifies the SHA256 signature over the raw body,
   - confirms the payment out of band with `paymentstatus`, so a valid
     signature alone never grants access,
   - resolves the period index from `subscriptionstatus` — the webhook is a
     *trigger*, that call is the *ledger* — and writes the payment with
     `external_id = <order_id>#<period>`, because two monthly deliveries can
     otherwise be byte-identical and month two would look like a retry,
   - moves the enrollment to `active` and sets `paid_through`,
   - appends a `domain_event` and calls `grantAccess`,
   - a payment matching no enrollment goes to `orphan_payments` and alerts
     an admin rather than being guessed at from the payer's email.
6. `grantAccess` mints a single-use Telegram invite (7 days, member limit
   from the group) and emails it. It is idempotent: Allpay retries up to ten
   times over twenty-four hours, so a repeat returns the existing invite and
   sends nothing.
7. The payer is returned to `/{locale}/enroll/{id}/success`, which polls and
   shows the invite **on screen**. Email is the backup copy, not the only
   chance at a link that expires in a week.
8. `chat_member` updates from the bot record who actually joined. Without
   that user id nobody can ever be removed from a channel again, which is
   why `allowed_updates` names `chat_member` explicitly — Telegram does not
   send it by default.

`grantAccess` / `revokeAccess` in `src/lib/access.ts` are the only code that
talks to Telegram. The payment webhook, the admin buttons and the bot's
`/grant` all go through them.

## 6. Admin panel

`/{locale}/admin` — dashboard, courses, **site copy**, study groups,
teachers, enrollments, payments, Telegram status, settings.

**Enrollments, not students.** The unit of work is one person in one group,
and every action applies to an enrollment: grant access, mint a fresh
invite, revoke, cancel the Allpay subscription, refund, move to another
group in the same course, record a manual Bit payment, match an orphaned
payment. All of them route through the same primitives the automation uses.

**Study groups** are editable. Two fields deliberately are not: `seats_taken`
is derived from paid enrollments, and the group id is write-once because it
travels to Allpay and into every log line.

**Site copy** — `/admin/content` lists every visible string on the site in
Russian and English side by side. `src/messages/*.json` remains the source
of *structure*; the `ui_messages` table holds only what has been changed.
Clearing a field deletes the override and restores the shipped wording, and
an edit that drops an ICU placeholder or a rich-text tag is refused by name
rather than taking down the page it appears on at request time.

Access: demo mode is open and read-only; with Supabase configured, sign-in
is an emailed link at `/{locale}/admin-login` and the address must be in
`ADMIN_EMAILS`.

## 7. Roadmap hooks already in place

| Future feature      | What exists today                                       |
| ------------------- | ------------------------------------------------------- |
| Replacing Make.com  | `domain_events` + fan-out; Make is already a subscriber |
| Student portal      | `/portal` route, enrollments carry participant + access |
| Self-serve cancel   | `cancelSubscription` on the provider, admin path proven |
| Receipts / SUMIT    | `invoices` table, `payments.receipt_url` from Allpay    |
| Homework/materials  | course `curriculum` JSONB, per-group channels, meet URL |
| Native emails       | `email_templates` table + Resend transport              |
| More languages      | `locales` table, translation rows, `ui_messages`        |
| Analytics           | `domain_events`, `automation_logs`, timestamped ledger  |

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
the full experience.

Production needs, in rough order of how much stops working without them:

| Group | Variables | Missing means |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` | demo mode: nothing is stored |
| Allpay | `ALLPAY_LOGIN`, `ALLPAY_API_KEY`, `ALLPAY_VAT_RATE` (0 — עוסק פטור), optional `ALLPAY_WEBHOOK_SECRETS` | falls back to each group's static link; payments arrive unattached |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_ADMIN_USER_IDS` | paid students are never admitted to a channel |
| Cron | `CRON_SECRET` | missed charges are never noticed |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | the invite is only on the success page |
| Make | `MAKE_EVENTS_WEBHOOK_URL` | events are recorded but nothing is mirrored |

One credential is worth calling out separately. Allpay has **no
account-wide webhook secret**: a payment created through the API is signed
with `ALLPAY_API_KEY`, and a payment *link* built by hand in the dashboard
carries its own secret. Verification therefore tries the API key and every
value in `ALLPAY_WEBHOOK_SECRETS`, accepting on the first match — each
candidate is a full SHA256 comparison, so trying several is no weaker than
trying one.

That key is what stands between the site and a forged payment. Rotate it
the moment it appears anywhere it should not — a screenshot, a chat, a
support ticket.

Getting it wrong fails *closed*: every real payment is rejected and nobody
is admitted to a channel. Because that failure is silent from the outside,
a rejected signature is written to `automation_logs` and announced in the
admin Telegram chat (at most hourly, so junk traffic cannot drown it).
