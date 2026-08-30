#!/usr/bin/env node
/**
 * Regenerate supabase/seed.sql from src/lib/data/seed.ts.
 *
 *   npm run seed:generate
 *
 * The TypeScript seed is the real content: it is what demo mode renders,
 * it is bilingual and complete, and it is what gets edited when a course
 * is written. The SQL file used to be a hand-kept parallel copy, and it
 * drifted exactly as you would expect — three courses behind, and missing
 * outcomes, audience, curriculum and FAQ entirely, so a freshly seeded
 * database would have served hollow course pages.
 *
 * What this emits is **content only**. Operational wiring is left empty on
 * purpose:
 *
 *   payment_url, telegram_channel_id, meeting_url — the seed values are
 *     placeholders. A fake payment link sends a real student to a dead
 *     page; a fake channel id makes the bot fail on a chat that does not
 *     exist. Empty is honest, and the admin panel is where they get set.
 *
 *   seats_taken — derived from paid enrollments by the payment webhook.
 *     Seeding it would invent students, and re-running the file would
 *     overwrite the real count, so it is set once on insert and never
 *     touched again on conflict.
 *
 * Re-running the generated SQL is safe: every statement upserts, so it
 * refreshes copy without disturbing anything the school has since done.
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courses, studyGroups, teachers } from '../src/lib/data/seed.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['ru', 'en'];

/** A SQL string literal. Postgres escapes a quote by doubling it. */
const q = (value) =>
  value === null || value === undefined
    ? 'null'
    : `'${String(value).replace(/'/g, "''")}'`;

const json = (value) => `${q(JSON.stringify(value))}::jsonb`;

const rows = (list) => list.join(',\n  ');

function teacherStatements() {
  const base = teachers.map(
    (t) => `(${q(t.id)}, ${q(t.slug)}, ${q(t.photoUrl)})`
  );

  const translations = teachers.flatMap((t) =>
    LOCALES.map(
      (l) =>
        `(${q(t.id)}, ${q(l)}, ${q(t.name[l])}, ${q(t.title[l])}, ` +
        `${q(t.bio[l])}, ${json(t.highlights[l])})`
    )
  );

  return `insert into teachers (id, slug, photo_url) values
  ${rows(base)}
on conflict (id) do update set
  slug = excluded.slug,
  photo_url = excluded.photo_url;

insert into teacher_translations
  (teacher_id, locale, name, title, bio, highlights) values
  ${rows(translations)}
on conflict (teacher_id, locale) do update set
  name = excluded.name,
  title = excluded.title,
  bio = excluded.bio,
  highlights = excluded.highlights;`;
}

function courseStatements() {
  const base = courses.map(
    (c) =>
      `(${q(c.id)}, ${q(c.slug)}, ${q(c.teacherId)}, ${q(c.category)}, ` +
      `${q(c.difficulty)}, ${q(`{${c.ageGroups.join(',')}}`)}, ` +
      `${c.durationMonths}, ${c.monthlyPrice}, ${q(c.currency)}, ` +
      `${q(c.imageUrl)}, ${q(c.publicTelegramUrl)}, ${q(c.status)}, ${c.featured})`
  );

  const translations = courses.flatMap((c) =>
    LOCALES.map((l) => {
      // The database stores curriculum modules as {title, items} per
      // locale; the bilingual pairing is rebuilt when the rows are read.
      const curriculum = c.curriculum.map((module) => ({
        title: module.title[l],
        items: module.topics[l]
      }));
      const faq = c.faq.map((item) => ({
        question: item.question[l],
        answer: item.answer[l]
      }));

      return (
        `(${q(c.id)}, ${q(l)}, ${q(c.title[l])}, ${q(c.shortDescription[l])}, ` +
        `${q(c.description[l])}, ${json(c.outcomes[l])}, ${json(c.audience[l])}, ` +
        `${json(curriculum)}, ${json(faq)})`
      );
    })
  );

  return `insert into courses
  (id, slug, teacher_id, category, difficulty, age_groups, duration_months,
   monthly_price, currency, image_url, public_telegram_url, status, featured)
values
  ${rows(base)}
on conflict (id) do update set
  slug = excluded.slug,
  teacher_id = excluded.teacher_id,
  category = excluded.category,
  difficulty = excluded.difficulty,
  age_groups = excluded.age_groups,
  duration_months = excluded.duration_months,
  monthly_price = excluded.monthly_price,
  currency = excluded.currency,
  image_url = excluded.image_url,
  public_telegram_url = excluded.public_telegram_url,
  status = excluded.status,
  featured = excluded.featured,
  updated_at = now();

insert into course_translations
  (course_id, locale, title, short_description, description,
   outcomes, audience, curriculum, faq)
values
  ${rows(translations)}
on conflict (course_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  description = excluded.description,
  outcomes = excluded.outcomes,
  audience = excluded.audience,
  curriculum = excluded.curriculum,
  faq = excluded.faq;`;
}

function groupStatements() {
  const values = studyGroups.map((g) => {
    // Seats start at zero, so a group marked full in the demo data would
    // otherwise be hidden from the catalogue while having every seat free.
    const status = g.status === 'full' ? 'enrolling' : g.status;
    return (
      `(${q(g.id)}, ${q(g.courseId)}, ${q(g.slug)}, ${q(g.audience)}, ` +
      `${g.weekday}, ${q(g.time)}, ${q(g.timezone)}, ${q(g.startDate)}, ` +
      `${q(g.endDate)}, ${g.capacity}, ${q(status)}, ` +
      `${q(g.telegramChatType)}, ${g.inviteMemberLimit})`
    );
  });

  return `insert into study_groups
  (id, course_id, slug, audience, weekday, start_time, timezone,
   start_date, end_date, capacity, status,
   telegram_chat_type, invite_member_limit)
values
  ${rows(values)}
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  audience = excluded.audience,
  weekday = excluded.weekday,
  start_time = excluded.start_time,
  timezone = excluded.timezone,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  capacity = excluded.capacity,
  status = excluded.status,
  telegram_chat_type = excluded.telegram_chat_type,
  invite_member_limit = excluded.invite_member_limit;
  -- seats_taken, payment_url, telegram_channel_id and meeting_url are
  -- deliberately absent: the first is derived from real payments, and the
  -- rest are set per group in the admin panel.`;
}

const sql = `-- Inverted Forest · content seed
--
-- GENERATED FILE — do not edit by hand.
-- Regenerate with: npm run seed:generate
-- Source of truth: src/lib/data/seed.ts
--
-- Content only. Payment links, Telegram channel ids, meeting rooms and
-- seat counts are not seeded: placeholders would send real students to
-- dead links and make the bot address chats that do not exist. Set them
-- per group in the admin panel.
--
-- Safe to run more than once; every statement upserts.

begin;

${teacherStatements()}

${courseStatements()}

${groupStatements()}

commit;
`;

writeFileSync(join(root, 'supabase', 'seed.sql'), sql, 'utf8');

console.log(
  `supabase/seed.sql regenerated — ${teachers.length} teacher(s), ` +
    `${courses.length} courses, ${studyGroups.length} groups, ` +
    `${sql.split('\n').length} lines.`
);
