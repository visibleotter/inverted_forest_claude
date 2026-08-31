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

-- A group whose demo seat count exceeded the new cap would show as full
-- and be unbookable. There are no real payments yet, so this is safe;
-- once there are, seats_taken must only ever be moved by the payment
-- webhook.
update study_groups
set seats_taken = 0,
    status = case when status = 'full' then 'enrolling'::group_status
                  else status end
where seats_taken > 7;

-- Confirm:
select id, capacity, seats_taken, status, start_date_confirmed
from study_groups
order by id;
