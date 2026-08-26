-- Inverted Forest · security & integrity hardening
--
-- 1. Webhook idempotency: a retried payment delivery must not create a
--    second payment row (and therefore must not consume a second seat).
-- 2. Registration abuse: one student may not hold several enrollments in
--    the same study group.
-- 3. Least privilege for the seat-counting function.

-- ── 1. Idempotent payments ───────────────────────────────────────────
-- Partial index: rows without an external id (manual entries) are exempt.
create unique index if not exists payments_provider_external_id_key
  on payments (provider, external_id)
  where external_id is not null;

-- ── 2. One enrollment per student per group ──────────────────────────
-- Cancelled enrollments are excluded so a student can re-join later.
create unique index if not exists enrollments_student_group_key
  on enrollments (student_id, group_id)
  where status <> 'cancelled';

-- ── 3. Harden the seat-counting function ─────────────────────────────
-- `security definer` without a pinned search_path lets a caller who can
-- create objects shadow the tables the function references. Pin it, and
-- restrict execution to the service role (the app server).
create or replace function increment_seats_for_enrollment(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
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

revoke all on function increment_seats_for_enrollment(uuid) from public;
revoke all on function increment_seats_for_enrollment(uuid) from anon;
revoke all on function increment_seats_for_enrollment(uuid) from authenticated;
grant execute on function increment_seats_for_enrollment(uuid) to service_role;

-- ── 4. Data-retention helper ─────────────────────────────────────────
-- Honours a deletion request: removes the student and everything that
-- cascades from them (enrollments → payments → invoices), while leaving
-- the anonymous automation log trail intact for accounting.
create or replace function delete_student_data(p_email text)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted int;
begin
  delete from students where email = lower(p_email);
  get diagnostics v_deleted = row_count;

  delete from newsletter_subscribers where email = lower(p_email);

  return v_deleted;
end;
$$;

revoke all on function delete_student_data(text) from public;
revoke all on function delete_student_data(text) from anon;
revoke all on function delete_student_data(text) from authenticated;
grant execute on function delete_student_data(text) to service_role;
