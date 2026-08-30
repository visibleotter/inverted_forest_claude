-- Inverted Forest · enrollment, payment and access engine
--
-- Turns the schema from "a catalogue with a registrations table" into the
-- machine that takes money and hands out Telegram access.
--
-- Design notes worth keeping in view:
--
--  * One enrollment is exactly one subscription. The separate subscriptions
--    table the brief asked for would be a join that never returns a second
--    row, so those fields live on `enrollments`.
--
--  * `order_id` is what we send to Allpay and what comes back in the
--    webhook. It is the enrollment's own uuid rendered as text, so a
--    payment can always be resolved without guessing from the payer's
--    email — which would have failed the moment a parent paid for a child
--    from a spouse's address.
--
--  * A subscription's monthly charges can arrive with an identical payload
--    every month, so `payments.external_id` carries a period suffix
--    (`<order_id>#2`) rather than the bare order id. Without that, month
--    two looks like a retry of month one and the ledger loses it.
--
-- NOTE: `alter type ... add value` may not be used later in the same
-- transaction that adds it, so the new enum value is added first, alone.

-- ── New enum value (must stand apart, see note above) ────────────────
alter type enrollment_status add value if not exists 'refunded';

-- ── New enums ────────────────────────────────────────────────────────
create type telegram_access_status as enum (
  'not_granted', 'invite_created', 'joined', 'removed', 'expired'
);

create type enrollment_plan as enum ('monthly', 'full');

create type subscription_status as enum (
  'none', 'active', 'completed', 'error', 'cancelled'
);

create type invite_status as enum ('active', 'used', 'expired', 'revoked');

create type telegram_chat_type as enum ('channel', 'supergroup');

-- ── Enrollments: the central entity ──────────────────────────────────
alter table enrollments
  -- Who actually attends. For adult groups this stays null and the
  -- student row is the participant; for children's groups the student
  -- row is the paying parent and the child is named here.
  add column participant_name text,
  add column participant_birth_year int
    check (participant_birth_year is null
           or participant_birth_year between 1900 and 2100),

  -- Billing
  add column plan enrollment_plan not null default 'monthly',
  add column order_id text unique,
  add column external_subscription_id text,
  add column subscription_status subscription_status not null default 'none',
  -- Access is owed up to this date. Everything downstream (grace, removal,
  -- completion) is derived from it rather than from a payment count.
  add column paid_through date,
  add column grace_until timestamptz,
  -- An unpaid registration should not hold a seat or a slug forever.
  add column pending_expires_at timestamptz,
  add column cancelled_at timestamptz,
  add column cancel_reason text,

  -- Telegram access
  add column telegram_access_status telegram_access_status
    not null default 'not_granted',
  add column telegram_user_id bigint,
  add column telegram_joined_at timestamptz,
  add column telegram_removed_at timestamptz,

  add column updated_at timestamptz not null default now();

create index enrollments_order_idx on enrollments(order_id);
create index enrollments_status_idx on enrollments(status);
create index enrollments_paid_through_idx on enrollments(paid_through)
  where status = 'active';

-- One person may enrol two children in the same group, and someone whose
-- first attempt never got paid must be able to try again. The old index
-- allowed neither. `coalesce` keeps adult enrollments (participant null)
-- unique per student as before.
drop index if exists enrollments_student_group_key;
create unique index enrollments_student_group_participant_key
  on enrollments (student_id, group_id, coalesce(participant_name, ''))
  where status <> 'cancelled';

-- ── Payments ─────────────────────────────────────────────────────────
alter table payments
  -- 1 = first month, 2 = second … Also disambiguates otherwise identical
  -- recurring webhook deliveries.
  add column period_index int,
  add column receipt_url text,
  -- The verified provider payload, kept for reconciliation and disputes.
  add column raw jsonb;

-- ── Telegram invites ─────────────────────────────────────────────────
-- One row per invite link we mint. The link is single-use and expires, so
-- an enrollment can accumulate several over its life (resend, re-grant).
create table telegram_invites (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  group_id text not null references study_groups(id),
  chat_id text not null,
  invite_link text not null,
  member_limit int not null default 1,
  status invite_status not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index telegram_invites_enrollment_idx on telegram_invites(enrollment_id);
-- The join handler looks an invite up by the link Telegram reports back.
create unique index telegram_invites_link_key on telegram_invites(invite_link);
create index telegram_invites_active_idx on telegram_invites(expires_at)
  where status = 'active';

-- ── Domain events ────────────────────────────────────────────────────
-- Append-only. Everything interesting that happens is written here first,
-- then fanned out. This is what lets Make.com be a subscriber rather than
-- the orchestrator, and what lets it be unplugged later without loss.
create table domain_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,             -- 'payment.succeeded', 'access.granted', …
  enrollment_id uuid references enrollments(id) on delete set null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  delivered_at timestamptz,       -- fan-out to Make succeeded
  delivery_error text
);

create index domain_events_created_idx on domain_events(created_at desc);
create index domain_events_undelivered_idx on domain_events(created_at)
  where delivered_at is null;

-- ── Orphan payments ──────────────────────────────────────────────────
-- A verified payment we cannot attach to an enrollment: a shared link, a
-- stale one, a manual charge. Never dropped, never auto-guessed — an
-- admin resolves it.
create table orphan_payments (
  id uuid primary key default gen_random_uuid(),
  provider payment_provider not null default 'allpay',
  order_id text,
  amount numeric(10,2),
  currency text,
  payload jsonb not null,
  resolved_enrollment_id uuid references enrollments(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index orphan_payments_unresolved_idx on orphan_payments(created_at desc)
  where resolved_at is null;

-- ── Study groups ─────────────────────────────────────────────────────
alter table study_groups
  add column meeting_url text,
  -- Children's groups may want two seats on one invite so a parent can
  -- come along; adult groups stay strictly one.
  add column invite_member_limit int not null default 1
    check (invite_member_limit between 1 and 5),
  add column telegram_chat_type telegram_chat_type not null default 'channel';

-- ── Settings ─────────────────────────────────────────────────────────
-- Operational numbers the brief insists must not be hardcoded.
insert into settings (key, value) values
  ('grace_period_days', '3'),
  ('invite_ttl_days', '7'),
  ('pending_ttl_minutes', '60'),
  ('vat_rate', '18')
on conflict (key) do nothing;

-- ── updated_at ───────────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger enrollments_touch_updated_at
  before update on enrollments
  for each row execute function touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────
-- Same rule as the rest of the personal tables: no anon policy at all, so
-- only the service role (the app server) can see any of this.
alter table telegram_invites enable row level security;
alter table domain_events enable row level security;
alter table orphan_payments enable row level security;
