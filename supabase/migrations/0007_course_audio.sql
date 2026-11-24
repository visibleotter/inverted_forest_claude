-- 0007 — short audio fragments on course pages.
--
-- courses.audio: [{ url, title: {ru, en}, durationSec }]. A list on the
-- course rather than its own table: a course has a handful of clips,
-- they are always read with the course, and the order is the author's.
--
-- The files live in Storage, bucket `course-audio`, public for reading.
-- Uploads come from the admin through signed upload URLs created with the
-- service role, so the bucket needs no write policy and the browser never
-- holds a key that can write.
--
-- Idempotent: safe to run twice. Run 0006 first if it has not run yet.

begin;

alter table courses
  add column if not exists audio jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-audio',
  'course-audio',
  true,
  20971520, -- 20 MB: far above a five-minute MP3, well below anything silly
  array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm']
)
on conflict (id) do nothing;

commit;
