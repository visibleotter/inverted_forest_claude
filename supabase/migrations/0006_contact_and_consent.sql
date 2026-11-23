-- 0006 — how to reach a student on Telegram, and proof they agreed.
--
-- telegram_contact: a username or the phone number the account is on.
-- It is the fallback when an invite link goes astray — the admin finds
-- the person by it and adds them by hand.
--
-- terms_accepted_at / terms_version: until now the consent checkbox was
-- enforced only in the browser and recorded nowhere. In a refund dispute
-- "they must have ticked it" is not evidence; a timestamp and the version
-- of the terms they saw is.
--
-- Additive and idempotent: safe to run twice, and the site tolerates the
-- columns being absent until this has run.

begin;

alter table students
  add column if not exists telegram_contact text;

alter table enrollments
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

commit;
