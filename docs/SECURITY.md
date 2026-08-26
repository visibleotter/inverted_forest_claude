# Security & Data Protection

How Inverted Forest protects student data and payment methods, what the
threat model is, and what an operator must do to keep it that way.

## 1. Payment methods are never in scope

The platform **does not collect, transmit, or store any payment
instrument**. Registration ends with a redirect to the provider's own
hosted checkout (PayPal today, Allpay later); those providers carry the
PCI-DSS obligation.

What we keep afterwards is only the *record* of a payment: amount,
currency, status, and the provider's transaction id. A full dump of our
database contains nothing that can charge anyone.

`Permissions-Policy` additionally disables the browser Payment Request API
on every page, so no script on the site can even open a payment sheet.

## 2. Personal data we hold

| Data                        | Why                                    |
| --------------------------- | -------------------------------------- |
| First & last name           | Addressing the student, class rosters   |
| Email                       | Confirmations, Telegram invite, receipts |
| Phone (optional)            | Urgent schedule changes                 |
| Locale                      | Which language to write to them in      |
| Enrollment & payment status | Running the school                      |

Nothing else. No date of birth, no address, no government ID.

## 3. Access control

**Database (Supabase).** Row Level Security is enabled on every table.

- Public/anon key can read *only* published content: courses, teachers,
  study groups, locales.
- `students`, `enrollments`, `payments`, `invoices`,
  `newsletter_subscribers`, `automation_logs`, `settings` have **no anon
  policies at all** — unreachable except with the service-role key.
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix, so Next.js
  cannot bundle it into client JavaScript. It is used only in server-side
  modules (`src/lib/supabase/server.ts`).
- The `security definer` SQL functions pin `search_path` and are executable
  by `service_role` only, so a compromised anon session cannot invoke them
  or shadow the tables they touch.

**Admin panel.** Requires an authenticated Supabase user whose email is on
the `ADMIN_EMAILS` allowlist (`src/lib/auth.ts`). Demo mode (no database
configured) is open but contains only fictional seed data and is banner-marked.

## 4. Input trust boundaries

Two paths write data. Both distrust their input completely.

**Registration server action** (`src/lib/actions.ts`)

- Zod re-validates everything **server-side**; client validation is UX only.
- Honeypot field (`website`), hidden off-screen, `aria-hidden`,
  `tabindex="-1"`. Any value in it means automation — rejected with a
  generic error that does not reveal the trap.
- Rate limit: 5 attempts per IP per 10 minutes.
- Group must be `enrolling` with seats remaining; a full group is refused
  server-side regardless of what the client sends.
- A unique index (`enrollments_student_group_key`) stops one student from
  accumulating duplicate enrollments in a group.

**Payment webhook** (`src/app/api/webhooks/payment/route.ts`)

- Shared secret in `x-webhook-secret`, compared with
  `crypto.timingSafeEqual` — a plain `!==` leaks the matching prefix length
  through response timing.
- Rate limited (60/min per IP) *before* the secret check, so a flood of bad
  secrets stays cheap.
- Zod-validated payload: `enrollment_id` must be a UUID, currency exactly
  three characters, amount finite and non-negative.
- **Idempotent.** Deliveries are deduplicated on `(provider, external_id)`
  via a unique partial index. A retry updates the status if it changed but
  never inserts a second row, and only the delivery that actually created
  the payment — and actually flipped the enrollment out of `active` — may
  consume a seat. A concurrent duplicate that loses the unique-index race
  is treated as success, not an error.

## 5. Logging discipline

Logs are usually the least-protected copy of personal data, so they never
receive contact details:

- `automation_logs` rows reference opaque identifiers (`enrollment <uuid>`,
  `group_101`) instead of emails.
- Server-side `console.error` calls mask addresses via `maskEmail`
  (`anna.kozlova@example.com` → `an***@example.com`).
- `maskPhone` keeps only the last two digits.

## 6. Transport & browser hardening

Set globally in `next.config.mjs`:

| Header                      | Effect                                        |
| --------------------------- | --------------------------------------------- |
| `Strict-Transport-Security` | Forces HTTPS for 2 years, subdomains included |
| `X-Frame-Options: DENY`     | Blocks clickjacking (verified: even same-origin framing fails) |
| `X-Content-Type-Options`    | No MIME sniffing                              |
| `Referrer-Policy`           | No path/query leakage to third parties        |
| `Permissions-Policy`        | Camera, mic, geolocation, payment API off     |
| `X-Powered-By` removed      | Less version fingerprinting                   |

`/admin/*` and `/register/*` additionally send `Cache-Control: no-store`
and `X-Robots-Tag: noindex, nofollow`, so pages rendering personal data are
never held by a proxy or indexed.

## 7. Data subject rights (GDPR / Israeli Privacy Protection Law)

`delete_student_data(email)` (migration 0002) removes a student and
everything cascading from them — enrollments, payments, invoices — plus any
newsletter subscription, while leaving the anonymised automation trail
intact for accounting. Service-role only.

Because personal data is confined to a small set of tables all keyed to
`students.id`, an export or erasure request is a single call, not an audit.

## 8. Known limits — read before launch

1. **Rate limiting is in-process.** It is per serverless instance and
   resets on deploy. It stops naive scripted abuse, which is its purpose.
   It is *not* a defence against a distributed attack — for that, move the
   buckets to Upstash/Redis or put the routes behind Vercel's WAF.
2. **No admin sign-in page yet.** `checkAdminAccess` enforces the rules,
   but a magic-link login screen must exist before switching off demo mode.
3. **Make.com and Google Sheets see registration data** in transit and at
   rest. Every integration is another copy of personal data; the roadmap of
   replacing them with native features is also a privacy roadmap.
4. **No Content-Security-Policy yet.** Framer Motion and Next's inline
   theme script need a nonce-based policy; worth adding, but it must be
   tested carefully to avoid breaking hydration.

## 9. Operator checklist

- [ ] Secrets only in Vercel environment variables — never committed
      (`.env*` is gitignored; `.env.example` holds empty placeholders).
- [ ] Rotate `PAYMENT_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`
      whenever someone with access leaves.
- [ ] Enable Supabase automatic backups and test a restore once.
- [ ] Keep `ADMIN_EMAILS` to the minimum set of people.
- [ ] Keep the Google Sheets mirror minimal, and delete old rows.
- [ ] Honour deletion requests via `delete_student_data`.
