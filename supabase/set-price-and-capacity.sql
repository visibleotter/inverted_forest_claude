-- Price 220 ₪/month, groups capped at 7, start dates not yet promised.
--
-- Run this AFTER migration 0005 (it needs study_groups.start_date_confirmed).
-- Surgical on purpose: re-running the whole content seed would also
-- overwrite every course description with the version in the code,
-- including anything already edited in the admin panel.
--
-- Safe to run twice.

update courses
set monthly_price = 220,
    updated_at = now();

update study_groups
set capacity = 7,
    -- The date follows the sign-ups at this size, so the site says
    -- "starts once the group fills" rather than printing a date nobody
    -- intends to honour. Flip individual groups back on in the admin as
    -- their dates firm up.
    start_date_confirmed = false;

-- Clear the seat counts inherited from the demo data.
--
-- They were invented to make a demo look busy: 5 here, 6 there, 7 on one
-- group — which on a live site reads as a class that is full and cannot be
-- booked. An earlier version of this file only reset counts *above* the
-- new cap, so exactly 7 of 7 slipped through.
--
-- The guard is not decoration. This runs only while no student has ever
-- enrolled; after the first real payment it does nothing, because
-- seats_taken is then a real number that only the payment webhook may
-- move.
update study_groups
set seats_taken = 0,
    status = case when status = 'full' then 'enrolling'::group_status
                  else status end
where not exists (select 1 from enrollments);

-- Confirm:
select id, capacity, seats_taken, status, start_date_confirmed
from study_groups
order by id;
