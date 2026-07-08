-- Inverted Forest · initial schema
-- Design notes:
--  * Translatable content lives in *_translations tables keyed by locale,
--    so adding Hebrew (or any language) later is INSERTs, not ALTERs.
--  * study_groups.id is an immutable text id (group_101). Slugs are for
--    humans only and never used for internal logic.
--  * Money/Telegram automation stays external (Make.com) for now; the
--    payments/automation_logs tables make the site the system of record
--    so those integrations can be replaced natively later.

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────
create type course_category as enum ('history', 'philosophy', 'literature', 'anthropology');
create type course_difficulty as enum ('intro', 'intermediate', 'deep_dive');
create type course_status as enum ('draft', 'published', 'archived');
create type age_group as enum ('children', 'teens', 'adults');
create type group_status as enum ('enrolling', 'full', 'in_progress', 'completed', 'cancelled');
create type enrollment_status as enum ('pending_payment', 'active', 'past_due', 'completed', 'cancelled');
create type payment_provider as enum ('paypal', 'allpay', 'manual');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

-- ── Locales ──────────────────────────────────────────────────────────
create table locales (
  code text primary key,          -- 'ru', 'en', later 'he' …
  name text not null,
  is_default boolean not null default false
);

insert into locales (code, name, is_default) values
  ('ru', 'Русский', true),
  ('en', 'English', false);

-- ── Teachers ─────────────────────────────────────────────────────────
create table teachers (
  id text primary key,            -- 'teacher_001'
  slug text unique not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table teacher_translations (
  teacher_id text not null references teachers(id) on delete cascade,
  locale text not null references locales(code),
  name text not null,
  title text not null default '',
  bio text not null default '',
  highlights jsonb not null default '[]',   -- string[]
  primary key (teacher_id, locale)
);

-- ── Courses ──────────────────────────────────────────────────────────
create table courses (
  id text primary key,            -- 'course_001'
  slug text unique not null,
  teacher_id text not null references teachers(id),
  category course_category not null,
  difficulty course_difficulty not null default 'intro',
  age_groups age_group[] not null default '{}',
  duration_months int not null check (duration_months > 0),
  monthly_price numeric(10,2) not null,
  currency text not null default 'ILS',
  image_url text,
  public_telegram_url text,
  status course_status not null default 'draft',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table course_translations (
  course_id text not null references courses(id) on delete cascade,
  locale text not null references locales(code),
  title text not null,
  short_description text not null default '',
  description text not null default '',
  outcomes jsonb not null default '[]',      -- string[]
  audience jsonb not null default '[]',      -- string[]
  curriculum jsonb not null default '[]',    -- [{title, items: string[]}]
  faq jsonb not null default '[]',           -- [{question, answer}]
  seo_title text,
  seo_description text,
  primary key (course_id, locale)
);

-- ── Study groups ─────────────────────────────────────────────────────
create table study_groups (
  id text primary key,            -- immutable internal id: 'group_101'
  course_id text not null references courses(id) on delete cascade,
  slug text unique not null,      -- display/admin only
  audience age_group not null,
  weekday int not null check (weekday between 0 and 6),
  start_time text not null,       -- '16:00' local time
  timezone text not null default 'Asia/Jerusalem',
  start_date date not null,
  end_date date,
  capacity int not null default 15 check (capacity > 0),
  seats_taken int not null default 0 check (seats_taken >= 0),
  payment_url text,               -- external checkout (PayPal → Allpay)
  telegram_channel_id text,
  status group_status not null default 'enrolling',
  created_at timestamptz not null default now()
);

create index study_groups_course_idx on study_groups(course_id);

-- ── Students & enrollments ───────────────────────────────────────────
create table students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  locale text not null default 'ru' references locales(code),
  notes text,
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  group_id text not null references study_groups(id),
  course_id text not null references courses(id),
  status enrollment_status not null default 'pending_payment',
  telegram_invited_at timestamptz,
  created_at timestamptz not null default now()
);

create index enrollments_student_idx on enrollments(student_id);
create index enrollments_group_idx on enrollments(group_id);

-- ── Payments & invoices ──────────────────────────────────────────────
create table payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  provider payment_provider not null default 'paypal',
  amount numeric(10,2) not null,
  currency text not null default 'ILS',
  status payment_status not null default 'pending',
  external_id text,               -- provider transaction id
  period_start date,              -- which study month this payment covers
  created_at timestamptz not null default now()
);

create index payments_enrollment_idx on payments(enrollment_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  number text unique not null,
  url text,                       -- EasyCount document link
  issued_at timestamptz not null default now()
);

-- ── Telegram ─────────────────────────────────────────────────────────
create table telegram_channels (
  id uuid primary key default gen_random_uuid(),
  chat_id text unique not null,
  kind text not null default 'private' check (kind in ('public', 'private')),
  group_id text references study_groups(id) on delete set null,
  title text,
  bot_is_admin boolean not null default false,
  members_count int,
  last_invite_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ── Automation, email, misc ──────────────────────────────────────────
create table automation_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,           -- 'site' | 'make' | 'telegram-bot'
  event text not null,
  status text not null default 'ok' check (status in ('ok', 'error')),
  detail text,
  created_at timestamptz not null default now()
);

create index automation_logs_created_idx on automation_logs(created_at desc);

create table email_templates (
  key text not null,              -- 'registration_confirmation', …
  locale text not null references locales(code),
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);

create table newsletter_subscribers (
  email text primary key,
  locale text not null default 'ru' references locales(code),
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Functions ────────────────────────────────────────────────────────
-- One confirmed payment activates one seat (idempotence guarded by the
-- enrollment status transition performed by the webhook before calling).
create or replace function increment_seats_for_enrollment(p_enrollment_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_group_id text;
begin
  select group_id into v_group_id from enrollments where id = p_enrollment_id;
  if v_group_id is null then
    return;
  end if;

  update study_groups
  set seats_taken = least(capacity, seats_taken + 1),
      status = case
        when seats_taken + 1 >= capacity then 'full'::group_status
        else status
      end
  where id = v_group_id;
end;
$$;

-- ── Row Level Security ───────────────────────────────────────────────
-- Public content is readable by anyone; everything personal is
-- service-role only (the app server talks to the DB with the service key).
alter table locales enable row level security;
alter table teachers enable row level security;
alter table teacher_translations enable row level security;
alter table courses enable row level security;
alter table course_translations enable row level security;
alter table study_groups enable row level security;
alter table students enable row level security;
alter table enrollments enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;
alter table telegram_channels enable row level security;
alter table automation_logs enable row level security;
alter table email_templates enable row level security;
alter table newsletter_subscribers enable row level security;
alter table settings enable row level security;

create policy "public read locales" on locales for select using (true);
create policy "public read teachers" on teachers for select using (true);
create policy "public read teacher translations" on teacher_translations for select using (true);
create policy "public read published courses" on courses for select using (status = 'published');
create policy "public read course translations" on course_translations for select using (true);
create policy "public read study groups" on study_groups for select using (true);
-- No anon policies on students/enrollments/payments/etc: service role only.
