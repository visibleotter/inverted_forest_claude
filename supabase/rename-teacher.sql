-- Rename teacher_001 → Вадим Марков / Vadim Markov
--
-- Surgical on purpose. Re-running the whole content seed would do this too,
-- but it would also overwrite every course field with the version that
-- ships in the code — including anything already edited in the admin
-- panel. This touches two columns and nothing else.
--
-- Paste into the Supabase SQL Editor and run. Safe to run twice.

update teachers
set slug = 'vadim-markov'
where id = 'teacher_001';

update teacher_translations
set name = 'Вадим Марков'
where teacher_id = 'teacher_001' and locale = 'ru';

update teacher_translations
set name = 'Vadim Markov'
where teacher_id = 'teacher_001' and locale = 'en';

-- Confirm:
select t.id, t.slug, tr.locale, tr.name
from teachers t
join teacher_translations tr on tr.teacher_id = t.id
where t.id = 'teacher_001'
order by tr.locale;
