-- What the database actually looks like right now.
--
-- Paste the whole thing into the Supabase SQL Editor and run it. It reads
-- only the catalogue — no students, no payments, no secrets — so the result
-- is safe to paste back into a chat.
--
-- Written as ONE query on purpose. The editor shows only the last result
-- set when you run several statements, and a missing table in any of them
-- aborts the lot; `to_regclass` returns null instead of raising, so a
-- database that has never seen the migration runner still reports cleanly.

with tables as (
  select
    1 as ord,
    'table' as kind,
    c.table_name as name,
    string_agg(c.column_name, ', ' order by c.ordinal_position) as detail
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema
   and t.table_name = c.table_name
   and t.table_type = 'BASE TABLE'
  where c.table_schema = 'public'
  group by c.table_name
),
enums as (
  select
    2 as ord,
    'enum' as kind,
    t.typname as name,
    string_agg(e.enumlabel, ', ' order by e.enumsortorder) as detail
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
  group by t.typname
),
indexes as (
  select
    3 as ord,
    'indexes' as kind,
    tablename as name,
    string_agg(indexname, ', ' order by indexname) as detail
  from pg_indexes
  where schemaname = 'public'
  group by tablename
),
functions as (
  select
    4 as ord,
    'function' as kind,
    p.proname as name,
    pg_get_function_identity_arguments(p.oid) as detail
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
),
migrations as (
  -- Existence only. A subquery selecting *from* schema_migrations would be
  -- resolved when the statement is parsed, so a missing table would abort
  -- the whole query before any of the above ran — which is the trap this
  -- file exists to avoid. `to_regclass` answers without touching it.
  select
    5 as ord,
    'migrations' as kind,
    'schema_migrations' as name,
    case
      when to_regclass('public.schema_migrations') is null
        then 'does not exist — npm run migrate has never been used'
      else 'exists; run: select * from schema_migrations order by name;'
    end as detail
)
select kind, name, detail
from (
  select * from tables
  union all select * from enums
  union all select * from indexes
  union all select * from functions
  union all select * from migrations
) everything
order by ord, name;
