-- Inverted Forest · slots without a committed date, and real capacity
--
-- Two changes, both driven by how the school actually runs at this size.
--
-- 1. A slot can exist before its start date is decided. With small groups
--    the date follows the sign-ups, not the other way round, and printing
--    a date nobody intends to honour is worse than saying "starts once the
--    group fills". `start_date` stays non-null so that everything
--    downstream keeps a date to reason about; the flag says whether that
--    date is a promise or a placeholder.
--
-- 2. A place can be held before it is paid for. Seats were only ever
--    consumed by a completed payment, which left a window: seven people
--    could each be on the payment page of a seven-seat group and all
--    succeed. This adds the index the hold query needs; the counting
--    itself lives in the data layer.

alter table study_groups
  add column start_date_confirmed boolean not null default true;

-- Existing rows keep their dates as promises; new slots default to
-- unconfirmed in the admin form, which is the common case now.
comment on column study_groups.start_date_confirmed is
  'false = the date is a placeholder and the site says "starts once the group fills"';

-- Pending enrollments are counted against capacity until they expire, so
-- this lookup happens on every schedule render.
create index enrollments_pending_hold_idx
  on enrollments (group_id, pending_expires_at)
  where status = 'pending_payment';
