-- What the database actually looks like right now.
--
-- Paste this into the Supabase SQL Editor and run it. It reads nothing but
-- the catalogue — no student data, no payments, no secrets — so the result
-- is safe to paste back into a chat.
--
-- Four result sets, in order:
--   1. tables and their columns
--   2. enum types and their values
--   3. indexes
--   4. which migrations the runner has recorded (empty if it never ran)

-- 1 ── tables and columns ──────────────────────────────────────────────
select
  c.table_name,
  string_agg(
    c.column_name || ' ' || c.data_type,
    ', ' order by c.ordinal_position
  ) as columns
from information_schema.columns c
join information_schema.tables t
  on t.table_schema = c.table_schema
 and t.table_name = c.table_name
 and t.table_type = 'BASE TABLE'
where c.table_schema = 'public'
group by c.table_name
order by c.table_name;

-- 2 ── enum types ──────────────────────────────────────────────────────
select
  t.typname as enum_type,
  string_agg(e.enumlabel, ', ' order by e.enumsortorder) as values
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
group by t.typname
order by t.typname;

-- 3 ── indexes ─────────────────────────────────────────────────────────
select tablename, indexname
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 4 ── migrations recorded by `npm run migrate` ────────────────────────
-- Errors with "relation does not exist" if the runner has never been used,
-- which is itself the answer.
select name, applied_at
from schema_migrations
order by name;
