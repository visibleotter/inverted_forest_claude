-- Inverted Forest · run this once, in the Supabase SQL Editor
--
-- GENERATED FILE — do not edit. Rebuild with: npm run sql:bundle
--
-- Select all, paste into the SQL Editor, press Run. One go, correct order.
-- Everything here is safe to run twice: the migrations create objects that
-- do not exist yet, and the seed upserts.
--
-- Contains: 0003_enrollment_engine.sql, 0004_ui_content.sql and the content seed
--
-- Afterwards, check it landed by running scripts/inspect-schema.sql.

-- ═══ migration 0003_enrollment_engine.sql ══════════════════════════

-- Inverted Forest · enrollment, payment and access engine
--
-- Turns the schema from "a catalogue with a registrations table" into the
-- machine that takes money and hands out Telegram access.
--
-- Design notes worth keeping in view:
--
--  * One enrollment is exactly one subscription. The separate subscriptions
--    table the brief asked for would be a join that never returns a second
--    row, so those fields live on `enrollments`.
--
--  * `order_id` is what we send to Allpay and what comes back in the
--    webhook. It is the enrollment's own uuid rendered as text, so a
--    payment can always be resolved without guessing from the payer's
--    email — which would have failed the moment a parent paid for a child
--    from a spouse's address.
--
--  * A subscription's monthly charges can arrive with an identical payload
--    every month, so `payments.external_id` carries a period suffix
--    (`<order_id>#2`) rather than the bare order id. Without that, month
--    two looks like a retry of month one and the ledger loses it.
--
-- NOTE: `alter type ... add value` may not be used later in the same
-- transaction that adds it, so the new enum value is added first, alone.

-- ── New enum value (must stand apart, see note above) ────────────────
alter type enrollment_status add value if not exists 'refunded';

-- ── New enums ────────────────────────────────────────────────────────
create type telegram_access_status as enum (
  'not_granted', 'invite_created', 'joined', 'removed', 'expired'
);

create type enrollment_plan as enum ('monthly', 'full');

create type subscription_status as enum (
  'none', 'active', 'completed', 'error', 'cancelled'
);

create type invite_status as enum ('active', 'used', 'expired', 'revoked');

create type telegram_chat_type as enum ('channel', 'supergroup');

-- ── Enrollments: the central entity ──────────────────────────────────
alter table enrollments
  -- Who actually attends. For adult groups this stays null and the
  -- student row is the participant; for children's groups the student
  -- row is the paying parent and the child is named here.
  add column participant_name text,
  add column participant_birth_year int
    check (participant_birth_year is null
           or participant_birth_year between 1900 and 2100),

  -- Billing
  add column plan enrollment_plan not null default 'monthly',
  add column order_id text unique,
  add column external_subscription_id text,
  add column subscription_status subscription_status not null default 'none',
  -- Access is owed up to this date. Everything downstream (grace, removal,
  -- completion) is derived from it rather than from a payment count.
  add column paid_through date,
  add column grace_until timestamptz,
  -- An unpaid registration should not hold a seat or a slug forever.
  add column pending_expires_at timestamptz,
  add column cancelled_at timestamptz,
  add column cancel_reason text,

  -- Telegram access
  add column telegram_access_status telegram_access_status
    not null default 'not_granted',
  add column telegram_user_id bigint,
  add column telegram_joined_at timestamptz,
  add column telegram_removed_at timestamptz,

  add column updated_at timestamptz not null default now();

create index enrollments_order_idx on enrollments(order_id);
create index enrollments_status_idx on enrollments(status);
create index enrollments_paid_through_idx on enrollments(paid_through)
  where status = 'active';

-- One person may enrol two children in the same group, and someone whose
-- first attempt never got paid must be able to try again. The old index
-- allowed neither. `coalesce` keeps adult enrollments (participant null)
-- unique per student as before.
drop index if exists enrollments_student_group_key;
create unique index enrollments_student_group_participant_key
  on enrollments (student_id, group_id, coalesce(participant_name, ''))
  where status <> 'cancelled';

-- ── Payments ─────────────────────────────────────────────────────────
alter table payments
  -- 1 = first month, 2 = second … Also disambiguates otherwise identical
  -- recurring webhook deliveries.
  add column period_index int,
  add column receipt_url text,
  -- The verified provider payload, kept for reconciliation and disputes.
  add column raw jsonb;

-- ── Telegram invites ─────────────────────────────────────────────────
-- One row per invite link we mint. The link is single-use and expires, so
-- an enrollment can accumulate several over its life (resend, re-grant).
create table telegram_invites (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  group_id text not null references study_groups(id),
  chat_id text not null,
  invite_link text not null,
  member_limit int not null default 1,
  status invite_status not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index telegram_invites_enrollment_idx on telegram_invites(enrollment_id);
-- The join handler looks an invite up by the link Telegram reports back.
create unique index telegram_invites_link_key on telegram_invites(invite_link);
create index telegram_invites_active_idx on telegram_invites(expires_at)
  where status = 'active';

-- ── Domain events ────────────────────────────────────────────────────
-- Append-only. Everything interesting that happens is written here first,
-- then fanned out. This is what lets Make.com be a subscriber rather than
-- the orchestrator, and what lets it be unplugged later without loss.
create table domain_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,             -- 'payment.succeeded', 'access.granted', …
  enrollment_id uuid references enrollments(id) on delete set null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  delivered_at timestamptz,       -- fan-out to Make succeeded
  delivery_error text
);

create index domain_events_created_idx on domain_events(created_at desc);
create index domain_events_undelivered_idx on domain_events(created_at)
  where delivered_at is null;

-- ── Orphan payments ──────────────────────────────────────────────────
-- A verified payment we cannot attach to an enrollment: a shared link, a
-- stale one, a manual charge. Never dropped, never auto-guessed — an
-- admin resolves it.
create table orphan_payments (
  id uuid primary key default gen_random_uuid(),
  provider payment_provider not null default 'allpay',
  order_id text,
  amount numeric(10,2),
  currency text,
  payload jsonb not null,
  resolved_enrollment_id uuid references enrollments(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index orphan_payments_unresolved_idx on orphan_payments(created_at desc)
  where resolved_at is null;

-- ── Study groups ─────────────────────────────────────────────────────
alter table study_groups
  add column meeting_url text,
  -- Children's groups may want two seats on one invite so a parent can
  -- come along; adult groups stay strictly one.
  add column invite_member_limit int not null default 1
    check (invite_member_limit between 1 and 5),
  add column telegram_chat_type telegram_chat_type not null default 'channel';

-- ── Settings ─────────────────────────────────────────────────────────
-- Operational numbers the brief insists must not be hardcoded.
insert into settings (key, value) values
  ('grace_period_days', '3'),
  ('invite_ttl_days', '7'),
  ('pending_ttl_minutes', '60')
on conflict (key) do nothing;

-- ── updated_at ───────────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger enrollments_touch_updated_at
  before update on enrollments
  for each row execute function touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────
-- Same rule as the rest of the personal tables: no anon policy at all, so
-- only the service role (the app server) can see any of this.
alter table telegram_invites enable row level security;
alter table domain_events enable row level security;
alter table orphan_payments enable row level security;


-- ═══ migration 0004_ui_content.sql ═════════════════════════════════

-- Inverted Forest · editable site copy
--
-- Every visible string on the site lives in src/messages/{ru,en}.json.
-- Those files stay: they are the defaults, they keep demo mode working
-- with no database, and they are what a new locale is added to. This table
-- holds only the *overrides* an editor has made, so that changing a
-- headline is a save rather than a deploy.
--
-- Storing only overrides has two consequences worth keeping:
--   * clearing a field in the admin deletes the row, which restores the
--     default — "reset" needs no separate mechanism;
--   * a key that has never been edited costs nothing and cannot drift out
--     of sync with the code that reads it.

create table ui_messages (
  -- Dotted path into the message catalogue: 'home.heroTitle',
  -- 'faq.items.0.q'. Numeric segments address array positions.
  key text not null,
  locale text not null references locales(code),
  value text not null,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);

create index ui_messages_locale_idx on ui_messages(locale);

create trigger ui_messages_touch_updated_at
  before update on ui_messages
  for each row execute function touch_updated_at();

-- Read server-side with the service role, like the rest of the operational
-- tables. The site renders on the server, so no anon policy is needed.
alter table ui_messages enable row level security;


-- ═══ content seed ═════════════════════════════════════════════

-- Inverted Forest · content seed
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


insert into teachers (id, slug, photo_url) values
  ('teacher_001', 'vadim-markov', null)
on conflict (id) do update set
  slug = excluded.slug,
  photo_url = excluded.photo_url;

insert into teacher_translations
  (teacher_id, locale, name, title, bio, highlights) values
  ('teacher_001', 'ru', 'Вадим Марков', 'Историк и философ', 'Историк и философ, увлечённый тем, чтобы оживлять прошлое для любознательных умов всех возрастов. Имея образование в области классических исследований и средневековой истории, я разработал каждый курс так, чтобы сочетать академическую строгость с доступностью. Преподаю на английском и русском языках и работаю со взрослыми, подростками и детьми. Я верю, что философия и история — не роскошь, а необходимые инструменты для понимания себя и нашего мира.', '["Двуязычное преподавание (английский и русский)","Индивидуальные и групповые занятия","Курсы для взрослых, подростков и детей","Живые занятия с вопросами и ответами, записи предоставляются","Основаны на первоисточниках и оригинальных текстах"]'::jsonb),
  ('teacher_001', 'en', 'Vadim Markov', 'Historian & Philosopher', 'A historian and philosopher passionate about bringing the past to life for curious minds of all ages. With a background in classical studies and medieval history, I have designed each course to balance scholarly rigour with accessibility. I teach in both English and Russian and work with adults, teenagers, and children. I believe that philosophy and history are not luxuries — they are essential tools for understanding ourselves and our world.', '["Bilingual instruction (English & Russian)","Individual and group sessions available","Courses for adults, teens, and children","Live sessions with Q&A, recordings provided","Rooted in primary sources and original texts"]'::jsonb)
on conflict (teacher_id, locale) do update set
  name = excluded.name,
  title = excluded.title,
  bio = excluded.bio,
  highlights = excluded.highlights;

insert into courses
  (id, slug, teacher_id, category, difficulty, age_groups, duration_months,
   monthly_price, currency, image_url, public_telegram_url, status, featured)
values
  ('course_001', 'medieval-russia', 'teacher_001', 'history', 'intermediate', '{adults,teens}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=1200&q=80', 'https://t.me/invertedforest', 'published', true),
  ('course_002', 'ancient-greece', 'teacher_001', 'history', 'intro', '{adults,children}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80', 'https://t.me/invertedforest', 'published', true),
  ('course_003', 'greek-philosophy', 'teacher_001', 'philosophy', 'intermediate', '{adults,teens}', 3, 380, 'ILS', 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=1200&q=80', 'https://t.me/invertedforest', 'published', true),
  ('course_004', 'prehistoric-mindset', 'teacher_001', 'anthropology', 'deep_dive', '{adults}', 2, 380, 'ILS', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80', 'https://t.me/invertedforest', 'published', false),
  ('course_005', 'american-short-stories', 'teacher_001', 'literature', 'intro', '{adults}', 3, 300, 'ILS', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80', 'https://t.me/invertedforest', 'published', false),
  ('course_006', 'ancient-near-east', 'teacher_001', 'history', 'intermediate', '{adults,teens}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80', 'https://t.me/invertedforest', 'published', true),
  ('course_007', 'russia-early-modern', 'teacher_001', 'history', 'intermediate', '{adults,teens}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=1200&q=80', 'https://t.me/invertedforest', 'published', false),
  ('course_008', 'russia-nineteenth-century', 'teacher_001', 'history', 'intermediate', '{adults,teens}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1547989453-2b26e4c85d2b?w=1200&q=80', 'https://t.me/invertedforest', 'published', false),
  ('course_009', 'russia-twentieth-century', 'teacher_001', 'history', 'deep_dive', '{adults}', 3, 380, 'ILS', 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200&q=80', 'https://t.me/invertedforest', 'published', false)
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
  ('course_001', 'ru', 'Средневековая Россия', 'Путешествие по драматическим векам Киевской Руси и Московского государства — от варяжских основателей до Ивана Грозного.', 'Курс охватывает политическое, культурное и религиозное развитие России с IX по XVI век: основание Руси, крещение славян, монгольское нашествие и его долгая тень, возвышение Москвы, правление Ивана III и Ивана IV. Студенты будут работать с первоисточниками и яркими историческими нарративами.', '["Понимать ключевые этапы русской истории IX–XVI веков","Читать и анализировать первоисточники — летописи и грамоты","Видеть, как средневековая цивилизация сформировала современную идентичность","Уверенно ориентироваться в историографических спорах"]'::jsonb, '["Взрослые, интересующиеся историей Восточной Европы","Подростки, готовящиеся к углублённому изучению истории","Все, кто хочет понять истоки современной России"]'::jsonb, '[{"title":"Рождение Руси","items":["Варяги и путь «из варяг в греки»","Киев, Новгород и первые князья","Крещение Руси и византийское наследие"]},{"title":"Под тенью Орды","items":["Монгольское нашествие 1237–1240 годов","Жизнь под игом: дань, ярлыки, выживание","Александр Невский: святой или прагматик?"]},{"title":"Возвышение Москвы","items":["Собирание земель и Куликовская битва","Иван III и рождение государства","Иван Грозный: реформы и опричнина"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_001', 'en', 'Medieval Russia', 'Journey through the dramatic centuries of Kievan Rus and the Muscovite state — from Viking founders to Ivan the Terrible.', 'This course covers the political, cultural, and religious development of Russia from the 9th to the 16th century: the founding of Rus, the Christianisation of the Slavs, the Mongol invasion and its long shadow, the rise of Moscow, and the reigns of Ivan III and Ivan IV. Students engage with primary sources and vivid historical narratives.', '["Understand the key stages of Russian history from the 9th to the 16th century","Read and analyse primary sources — chronicles and charters","See how a medieval civilisation forged a modern identity","Navigate major historiographical debates with confidence"]'::jsonb, '["Adults interested in Eastern European history","Teens preparing for advanced history study","Anyone who wants to understand the origins of modern Russia"]'::jsonb, '[{"title":"The Birth of Rus","items":["The Varangians and the route “from the Varangians to the Greeks”","Kyiv, Novgorod and the first princes","The Christianisation of Rus and the Byzantine legacy"]},{"title":"Under the Shadow of the Horde","items":["The Mongol invasion of 1237–1240","Life under the yoke: tribute, patents, survival","Alexander Nevsky: saint or pragmatist?"]},{"title":"The Rise of Moscow","items":["The gathering of the lands and the Battle of Kulikovo","Ivan III and the birth of the state","Ivan the Terrible: reforms and the Oprichnina"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_002', 'ru', 'Древняя Греция', 'Мир полисов, демократии и мифов — от минойцев бронзового века до завоеваний Александра Македонского.', 'Широкий обзор истории и культуры Древней Греции: минойский и микенский мир, Тёмные века, архаический и классический периоды, эллинистическая эпоха. Особое внимание уделяется Афинам и Спарте, греко-персидским войнам, Пелопоннесской войне и культурным достижениям, продолжающим вдохновлять человечество.', '["Ориентироваться в трёх тысячелетиях греческой истории","Понимать, как родилась демократия и почему она выжила","Узнавать наследие Греции в театре, спорте и науке","Читать мифы как исторические источники"]'::jsonb, '["Дети от 10 лет — отдельные группы с адаптированной программой","Взрослые, которые хотят систематизировать знания об античности","Родители, желающие учиться вместе с детьми"]'::jsonb, '[{"title":"До полисов","items":["Минойский Крит и микенские дворцы","Тёмные века и Гомер","Архаическая революция: алфавит, колонии, тираны"]},{"title":"Классическая Греция","items":["Афины и Спарта: два мира","Греко-персидские войны","Век Перикла и Пелопоннесская война"]},{"title":"Эллинизм","items":["Филипп II и возвышение Македонии","Александр Великий: от Граника до Индии","Эллинистические царства и наследие Греции"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_002', 'en', 'Ancient Greece', 'The world of city-states, democracy, and myth — from the Bronze Age Minoans to the conquests of Alexander the Great.', 'A broad survey of ancient Greek history and culture covering the Minoan and Mycenaean worlds, the Dark Ages, the Archaic and Classical periods, and the Hellenistic era. Special attention is given to Athens and Sparta, the Persian Wars, the Peloponnesian War, and the cultural achievements that continue to inspire humanity.', '["Navigate three millennia of Greek history","Understand how democracy was born and why it survived","Recognise Greece’s legacy in theatre, sport and science","Read myths as historical sources"]'::jsonb, '["Children from age 10 — separate groups with an adapted programme","Adults who want a structured view of antiquity","Parents who wish to learn alongside their children"]'::jsonb, '[{"title":"Before the Polis","items":["Minoan Crete and the Mycenaean palaces","The Dark Ages and Homer","The Archaic revolution: alphabet, colonies, tyrants"]},{"title":"Classical Greece","items":["Athens and Sparta: two worlds","The Persian Wars","The Age of Pericles and the Peloponnesian War"]},{"title":"The Hellenistic World","items":["Philip II and the rise of Macedon","Alexander the Great: from the Granicus to India","The Hellenistic kingdoms and the Greek legacy"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_003', 'ru', 'Греческая философия', 'От досократиков до пещеры Платона, этики Аристотеля и стоического поиска душевного покоя — философия как живая практика.', 'Курс исследует основные школы и мыслителей древнегреческой философии. Начинаем с досократиков (Гераклит, Парменид, Демокрит), переходим к Сократу, Платону и Аристотелю, и завершаем эллинистическими школами: стоицизм, эпикуреизм и скептицизм. Каждое занятие связывает древние аргументы с современной актуальностью.', '["Понимать главные вопросы и ответы античной философии","Читать Платона и Аристотеля в оригинальной аргументации","Применять стоические практики в повседневной жизни","Строить и разбирать философские аргументы"]'::jsonb, '["Взрослые, ищущие интеллектуального вызова","Подростки с интересом к большим вопросам","Читатели, желающие глубже понять западную мысль"]'::jsonb, '[{"title":"Досократики","items":["«Из чего состоит всё?» — милетцы и Гераклит","Парменид и проблема бытия","Демокрит и рождение атомизма"]},{"title":"Афинская триада","items":["Сократ: метод, суд и смерть","Платон: пещера, идеи, государство","Аристотель: этика добродетели и логика"]},{"title":"Эллинистические школы","items":["Стоицизм: Зенон, Эпиктет, Марк Аврелий","Эпикур и искусство удовольствия","Скептики и конец античной философии"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_003', 'en', 'Greek Philosophy', 'From the pre-Socratics to Plato’s cave, Aristotle’s ethics, and the Stoic quest for peace of mind — philosophy as a living practice.', 'This course explores the major schools and thinkers of ancient Greek philosophy. We begin with the pre-Socratics (Heraclitus, Parmenides, Democritus), move through Socrates, Plato, and Aristotle, and conclude with the Hellenistic schools: Stoicism, Epicureanism, and Skepticism. Each session connects ancient arguments to contemporary relevance.', '["Understand the central questions and answers of ancient philosophy","Read Plato and Aristotle in their original arguments","Apply Stoic practices to everyday life","Construct and dissect philosophical arguments"]'::jsonb, '["Adults looking for an intellectual challenge","Teens drawn to the big questions","Readers who want a deeper grasp of Western thought"]'::jsonb, '[{"title":"The Pre-Socratics","items":["“What is everything made of?” — the Milesians and Heraclitus","Parmenides and the problem of being","Democritus and the birth of atomism"]},{"title":"The Athenian Triad","items":["Socrates: the method, the trial, the death","Plato: the cave, the forms, the Republic","Aristotle: virtue ethics and logic"]},{"title":"The Hellenistic Schools","items":["Stoicism: Zeno, Epictetus, Marcus Aurelius","Epicurus and the art of pleasure","The Skeptics and the end of ancient philosophy"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_004', 'ru', 'Рассвет человечества', 'Когнитивный и духовный мир наших доисторических предков — наскальная живопись, ритуал, шаманизм и рождение символического мышления.', 'Опираясь на археологию, когнитивные науки и антропологию, курс исследует, как Homo sapiens развил сознание, язык, искусство и религию. Изучаем ключевые объекты: Ласко, Гёбекли-Тепе, Стоунхендж — и задаёмся вопросом, что они говорят о происхождении человеческого разума и глубочайших корнях культуры.', '["Понимать современные теории происхождения сознания","«Читать» наскальное искусство и мегалитические памятники","Видеть корни религии и ритуала в глубокой древности","Критически оценивать научные и популярные гипотезы"]'::jsonb, '["Взрослые с интересом к антропологии и археологии","Читатели Харари, желающие копнуть глубже","Все, кого волнует вопрос «откуда мы?»"]'::jsonb, '[{"title":"Рождение разума","items":["Когнитивная революция и символическое мышление","Язык, воображение и совместные мифы","Неандертальцы: другой разум"]},{"title":"Искусство и ритуал","items":["Ласко и Шове: зачем рисовали в темноте?","Шаманизм и изменённые состояния сознания","Погребения и рождение представлений о смерти"]},{"title":"Первые храмы","items":["Гёбекли-Тепе: храм до города","Стоунхендж и археоастрономия","От ритуала к религии и цивилизации"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_004', 'en', 'The Dawn of Humanity', 'The cognitive and spiritual world of our prehistoric ancestors — cave paintings, ritual, shamanism, and the birth of symbolic thought.', 'Drawing on archaeology, cognitive science, and anthropology, this course investigates how Homo sapiens developed consciousness, language, art, and religion. We examine major sites such as Lascaux, Göbekli Tepe, and Stonehenge, and ask what they tell us about the origins of the human mind and the deepest roots of culture.', '["Understand current theories on the origins of consciousness","“Read” cave art and megalithic monuments","Trace the roots of religion and ritual into deep prehistory","Evaluate scholarly and popular hypotheses critically"]'::jsonb, '["Adults interested in anthropology and archaeology","Readers of Harari who want to dig deeper","Anyone moved by the question “where do we come from?”"]'::jsonb, '[{"title":"The Birth of the Mind","items":["The cognitive revolution and symbolic thought","Language, imagination and shared myths","The Neanderthals: a different mind"]},{"title":"Art and Ritual","items":["Lascaux and Chauvet: why paint in the dark?","Shamanism and altered states of consciousness","Burials and the birth of ideas about death"]},{"title":"The First Temples","items":["Göbekli Tepe: the temple before the city","Stonehenge and archaeoastronomy","From ritual to religion and civilisation"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_005', 'ru', 'Чтение американских рассказов', 'Книжный клуб для взрослых: от Хемингуэя и Карвера до Фланнери О’Коннор — внимательное чтение, дискуссия и литературное открытие.', 'Каждое занятие посвящено одному-двум рассказам, выбранным за мастерство, темы и культурное значение. Участники обсуждают характеры, стиль, образы и смысл в непринуждённой и интеллектуально насыщенной атмосфере. Список литературы предоставляется. Предварительное литературоведческое образование не требуется — только любопытство и любовь к историям.', '["Читать прозу медленно и видеть больше","Понимать приёмы великих рассказчиков","Уверенно говорить о литературе","Открыть авторов, которых захочется перечитывать"]'::jsonb, '["Взрослые, любящие читать и обсуждать прочитанное","Изучающие английский через литературу","Все, кто скучает по хорошему разговору о книгах"]'::jsonb, '[{"title":"Мастера краткости","items":["Хемингуэй и теория айсберга","Рэймонд Карвер: грязный реализм","Джон Чивер и пригородная Америка"]},{"title":"Юг и готика","items":["Фланнери О’Коннор: благодать и гротеск","Юдора Уэлти и голос Юга","Уильям Фолкнер в миниатюре"]},{"title":"Современные голоса","items":["Джордж Сондерс и добрая сатира","Джумпа Лахири: между культурами","Итоговая дискуссия: что делает рассказ великим?"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_005', 'en', 'Reading Short American Stories', 'A book club for adults: from Hemingway and Carver to Flannery O’Connor — close reading, discussion, and literary discovery.', 'Each session focuses on one or two short stories chosen for their craft, themes, and cultural significance. Participants discuss character, style, imagery, and meaning in a relaxed and intellectually stimulating environment. A reading list is provided. No prior literary study required — only curiosity and a love of stories.', '["Read fiction slowly and see more","Understand the craft of great storytellers","Talk about literature with confidence","Discover authors you will want to reread"]'::jsonb, '["Adults who love to read and discuss","English learners who study through literature","Anyone missing a good conversation about books"]'::jsonb, '[{"title":"Masters of Brevity","items":["Hemingway and the iceberg theory","Raymond Carver: dirty realism","John Cheever and suburban America"]},{"title":"The South and the Gothic","items":["Flannery O’Connor: grace and the grotesque","Eudora Welty and the voice of the South","William Faulkner in miniature"]},{"title":"Contemporary Voices","items":["George Saunders and kind satire","Jhumpa Lahiri: between cultures","Closing discussion: what makes a story great?"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_006', 'ru', 'Первые цивилизации Древнего Востока', 'Города, письменность и первые законы — от шумерского Урука до Вавилона, Ассирии и Египта фараонов.', 'Курс о том, как впервые в истории возникли город, государство и письменность. Мы проходим путь от первых земледельческих поселений Междуречья до великих империй: Шумер и Аккад, Вавилон Хаммурапи, Ассирия, Египет Древнего и Нового царства, хетты и Персия. Читаем древнейшие тексты — «Эпос о Гильгамеше», законы Хаммурапи, египетские гимны — и разбираемся, как складывались представления о власти, справедливости и загробной жизни, которые пережили сами эти цивилизации.', '["Понимать, почему город и государство возникли именно в Междуречье","Читать древнейшие письменные памятники и видеть в них живых людей","Ориентироваться в трёх тысячелетиях истории Древнего Востока","Узнавать месопотамские и египетские сюжеты в позднейшей культуре"]'::jsonb, '["Взрослые, которым интересно, с чего началась история","Подростки, готовящиеся к углублённому изучению древности","Читатели Библии и античных авторов, желающие увидеть их фон"]'::jsonb, '[{"title":"Рождение города","items":["Междуречье: земля между Тигром и Евфратом","Урук и первые города-государства Шумера","Клинопись: как счёт превратился в литературу"]},{"title":"Империи между реками","items":["Саргон Аккадский и первая империя в истории","Хаммурапи и его законы: справедливость по-вавилонски","Ассирия: армия, библиотека Ашшурбанипала и падение Ниневии"]},{"title":"Египет и соседи","items":["Дар Нила: фараон, пирамиды и Древнее царство","Новое царство: Хатшепсут, Эхнатон, Рамсес","Хетты, финикийцы и Персия: конец древнего мира Востока"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_006', 'en', 'The First Civilizations of the Ancient Near East', 'Cities, writing and the first laws — from Sumerian Uruk to Babylon, Assyria and the Egypt of the pharaohs.', 'A course on the first appearance of the city, the state and writing. We follow the road from the earliest farming settlements of Mesopotamia to the great empires: Sumer and Akkad, the Babylon of Hammurabi, Assyria, the Egypt of the Old and New Kingdoms, the Hittites and Persia. We read the oldest surviving texts — the Epic of Gilgamesh, the laws of Hammurabi, the Egyptian hymns — and trace how ideas of power, justice and the afterlife took shape and outlived the civilizations that made them.', '["Understand why the city and the state first appeared between the rivers","Read the oldest written monuments and find living people in them","Navigate three millennia of Ancient Near Eastern history","Recognise Mesopotamian and Egyptian motifs in later culture"]'::jsonb, '["Adults curious about where history actually begins","Teens preparing for advanced study of antiquity","Readers of the Bible and the classics who want to see the background"]'::jsonb, '[{"title":"The Birth of the City","items":["Mesopotamia: the land between the Tigris and the Euphrates","Uruk and the first city-states of Sumer","Cuneiform: how accountancy turned into literature"]},{"title":"Empires Between the Rivers","items":["Sargon of Akkad and the first empire in history","Hammurabi and his laws: justice, Babylonian style","Assyria: the army, Ashurbanipal’s library and the fall of Nineveh"]},{"title":"Egypt and its Neighbours","items":["The gift of the Nile: pharaoh, pyramids and the Old Kingdom","The New Kingdom: Hatshepsut, Akhenaten, Ramesses","Hittites, Phoenicians and Persia: the end of the ancient East"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_007', 'ru', 'История России Нового времени: от Смуты до 1812 года', 'Два века, за которые Московское царство стало империей: Смута, раскол, Пётр, Екатерина и гроза двенадцатого года.', 'Курс о том, как страна, едва не исчезнувшая в Смуту, за двести лет превратилась в европейскую империю — и чего это стоило. Мы начинаем с пресечения династии и самозванцев, проходим через первых Романовых и церковный раскол, разбираем петровские преобразования не как чудо, а как решение конкретных задач ценой конкретных жертв. Дальше — эпоха дворцовых переворотов, «просвещённый абсолютизм» Екатерины и Пугачёвщина как его тень, короткое царствование Павла и, наконец, 1812 год, когда империя впервые почувствовала себя нацией. Читаем указы, письма и мемуары современников и стараемся понять логику людей, которые не знали, чем всё кончится.', '["Понимать, почему Смута стала возможной и чем она закончилась","Видеть в петровских реформах цену, а не только результат","Разбираться в устройстве империи XVIII века: сословия, армия, двор","Читать источники эпохи и отличать факт от позднейшего мифа"]'::jsonb, '["Взрослые, которым школьный курс оставил больше вопросов, чем ответов","Читатели русской классики, желающие понять её исторический фон","Подростки, готовящиеся к серьёзному изучению истории"]'::jsonb, '[{"title":"Смута и первые Романовы","items":["Пресечение династии, самозванцы и польская интервенция","Земский собор 1613 года: как выбирали царя","Соборное уложение и церковный раскол"]},{"title":"Пётр и рождение империи","items":["Северная война и цена Петербурга","Table of Ranks: новая служилая элита","Церковь без патриарха и государство без границ"]},{"title":"Век Екатерины и гроза 1812 года","items":["Дворцовые перевороты и роль гвардии","Просвещённый абсолютизм и восстание Пугачёва","Александр I, Наполеон и Отечественная война"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_007', 'en', 'Early Modern Russia: from the Time of Troubles to 1812', 'The two centuries in which a Muscovite kingdom became an empire: the Troubles, the schism, Peter, Catherine and the storm of 1812.', 'A course on how a country that nearly ceased to exist during the Time of Troubles became a European empire within two centuries — and what that cost. We begin with a broken dynasty and its pretenders, pass through the first Romanovs and the church schism, and treat the Petrine reforms not as a miracle but as answers to particular problems paid for with particular lives. Then the age of palace coups, Catherine’s enlightened absolutism with the Pugachev revolt as its shadow, the short reign of Paul, and finally 1812, when the empire first felt itself to be a nation. We read decrees, letters and memoirs, and try to recover the reasoning of people who did not know how any of it would end.', '["Understand what made the Time of Troubles possible and how it ended","See the price of the Petrine reforms, not only their results","Navigate the eighteenth-century empire: estates, army, court","Read period sources and tell fact from later myth"]'::jsonb, '["Adults left with more questions than answers by their school course","Readers of the Russian classics who want their historical ground","Teens preparing for serious study of history"]'::jsonb, '[{"title":"The Troubles and the First Romanovs","items":["A broken dynasty, the pretenders and the Polish intervention","The Assembly of 1613: how a tsar was chosen","The Law Code of 1649 and the church schism"]},{"title":"Peter and the Birth of the Empire","items":["The Great Northern War and the cost of Petersburg","The Table of Ranks and a new service elite","A church without a patriarch, a state without limits"]},{"title":"Catherine’s Age and the Storm of 1812","items":["Palace coups and the role of the guards","Enlightened absolutism and the Pugachev revolt","Alexander I, Napoleon and the Patriotic War"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_008', 'ru', 'История России XIX века', 'От декабристов до кануна революции: век великих реформ, великих романов и вопроса, который так и не был решён.', 'Век, в котором Россия непрерывно спорила сама с собой о том, кто она такая. Мы начинаем с декабрьского утра 1825 года и николаевской реакции, проходим через спор западников и славянофилов, поражение в Крыму, отмену крепостного права и остальные Великие реформы. Смотрим, как из разочарования в реформах вырастает народничество, а из него — террор, и как убийство Александра II разворачивает страну назад. Заканчиваем индустриализацией девяностых и обществом, которое уже нельзя вернуть к прежнему порядку. Всё это — рядом с Пушкиным, Достоевским и Толстым, потому что их книги были не отражением этих споров, а их частью.', '["Понимать, почему отмена крепостного права не решила крестьянский вопрос","Разбираться в спорах западников, славянофилов и народников","Видеть связь между русским романом и политикой своего времени","Объяснять, откуда в России взялся революционный терроризм"]'::jsonb, '["Читатели русской классики, которым нужен исторический контекст","Взрослые, интересующиеся историей реформ и их пределами","Подростки и студенты гуманитарных направлений"]'::jsonb, '[{"title":"После 1812: империя и её недовольные","items":["Декабристы: заговор офицеров и его смысл","Николай I: порядок, цензура и «официальная народность»","Западники и славянофилы: спор о пути"]},{"title":"Великие реформы","items":["Крымская война как приговор старому порядку","Отмена крепостного права: что получили крестьяне","Земства, суд присяжных, всеобщая воинская повинность"]},{"title":"От народничества к революции","items":["«Хождение в народ» и рождение террора","1 марта 1881 года и контрреформы Александра III","Индустриализация, город и общество накануне 1905 года"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_008', 'en', 'Russia in the Nineteenth Century', 'From the Decembrists to the eve of revolution: a century of great reforms, great novels and one unanswered question.', 'A century in which Russia argued continuously with itself about what it was. We open on a December morning in 1825 and the reaction that followed, pass through the quarrel of Westernisers and Slavophiles, defeat in the Crimea, the emancipation of the serfs and the other Great Reforms. We watch disappointment in those reforms grow into populism and then into terror, and see the assassination of Alexander II turn the country back. We finish with the industrialisation of the 1890s and a society that could no longer be returned to the old order. All of it alongside Pushkin, Dostoevsky and Tolstoy, whose books were not a reflection of these arguments but a part of them.', '["Understand why emancipation did not settle the peasant question","Follow the arguments of Westernisers, Slavophiles and populists","See how the Russian novel and the politics of its day were connected","Explain where revolutionary terrorism in Russia came from"]'::jsonb, '["Readers of the Russian classics who want the historical context","Adults interested in reform and the limits of reform","Teens and humanities students"]'::jsonb, '[{"title":"After 1812: the Empire and Its Discontents","items":["The Decembrists: an officers’ conspiracy and what it meant","Nicholas I: order, censorship and Official Nationality","Westernisers and Slavophiles: the argument about the road"]},{"title":"The Great Reforms","items":["The Crimean War as a verdict on the old order","Emancipation: what the peasants actually received","Local assemblies, jury trials and universal conscription"]},{"title":"From Populism to Revolution","items":["Going to the People, and the birth of terror","March 1881 and the counter-reforms of Alexander III","Industry, the city and society on the eve of 1905"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb),
  ('course_009', 'ru', 'История России XX века', 'Век, в который уместились две революции, две войны, большой террор и распад страны, где всё это происходило.', 'Самый близкий и самый трудный для разговора век. Мы идём от 1905 года и Первой мировой к семнадцатому году — двум революциям, которые обычно сливают в одну, — через Гражданскую войну, НЭП и сворачивание НЭПа к коллективизации и Большому террору. Отдельно и подробно — война 1941–1945 годов: как её вели, чем за неё заплатили и как о ней потом вспоминали. Затем оттепель и её пределы, застой, Афганистан, перестройка и декабрь 1991 года. Курс опирается на документы, статистику и свидетельства и не заменяет сложность удобной версией — ни одной из тех, что предлагаются сегодня.', '["Различать февраль и октябрь 1917 года и понимать, что стояло за каждым","Разбираться в механике коллективизации и террора, а не только в цифрах","Говорить о войне 1941–1945 годов на основании документов","Понимать, почему СССР распался именно так и именно тогда"]'::jsonb, '["Взрослые, готовые к трудному и подробному разговору","Те, кто вырос на одной версии этого века и хочет проверить её","Читатели документальной прозы и мемуаров эпохи"]'::jsonb, '[{"title":"Революция и Гражданская война","items":["1905 год, Дума и незавершённая реформа","Февраль и Октябрь: две революции одного года","Гражданская война, красный и белый террор, эмиграция"]},{"title":"Сталинский порядок и война","items":["НЭП и его свёртывание; коллективизация и голод","Большой террор: механика, масштаб, документы","Война 1941–1945: ход, цена, память"]},{"title":"От оттепели к 1991 году","items":["XX съезд, оттепель и её границы","Застой, диссиденты, Афганистан","Перестройка, гласность и распад Союза"]}]'::jsonb, '[{"question":"Как проходят занятия?","answer":"Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале."},{"question":"Как устроена оплата?","answer":"Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования."},{"question":"Что, если я пропущу занятие?","answer":"Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток."}]'::jsonb),
  ('course_009', 'en', 'Russia in the Twentieth Century', 'A century holding two revolutions, two wars, the Great Terror and the collapse of the country in which all of it happened.', 'The nearest century, and the hardest to discuss. We move from 1905 and the First World War into 1917 — two revolutions usually merged into one — through the Civil War, the New Economic Policy and its reversal, to collectivisation and the Great Terror. The war of 1941–1945 gets its own extended treatment: how it was fought, what it cost, and how it was afterwards remembered. Then the Thaw and its limits, stagnation, Afghanistan, perestroika and December 1991. The course works from documents, statistics and testimony, and does not trade complexity for a convenient version — of which several are currently on offer.', '["Tell February 1917 from October, and see what stood behind each","Understand the mechanics of collectivisation and terror, not only the figures","Discuss the war of 1941–1945 from documents","Understand why the USSR collapsed in the way it did, when it did"]'::jsonb, '["Adults ready for a difficult and detailed conversation","Anyone raised on one version of this century who wants to test it","Readers of the period’s documentary prose and memoirs"]'::jsonb, '[{"title":"Revolution and Civil War","items":["1905, the Duma and an unfinished reform","February and October: two revolutions in one year","Civil war, red and white terror, emigration"]},{"title":"The Stalinist Order and the War","items":["The NEP and its reversal; collectivisation and famine","The Great Terror: mechanics, scale, documents","The war of 1941–1945: course, cost, memory"]},{"title":"From the Thaw to 1991","items":["The Twentieth Congress, the Thaw and its limits","Stagnation, dissidents, Afghanistan","Perestroika, glasnost and the end of the Union"]}]'::jsonb, '[{"question":"How are the classes held?","answer":"Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel."},{"question":"How does payment work?","answer":"Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions."},{"question":"What if I miss a class?","answer":"All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours."}]'::jsonb)
on conflict (course_id, locale) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  description = excluded.description,
  outcomes = excluded.outcomes,
  audience = excluded.audience,
  curriculum = excluded.curriculum,
  faq = excluded.faq;

insert into study_groups
  (id, course_id, slug, audience, weekday, start_time, timezone,
   start_date, end_date, capacity, status,
   telegram_chat_type, invite_member_limit)
values
  ('group_101', 'course_002', 'greece-tue-16-children', 'children', 2, '16:00', 'Asia/Jerusalem', '2026-10-06', '2026-12-22', 12, 'enrolling', 'channel', 2),
  ('group_102', 'course_002', 'greece-tue-20-adults', 'adults', 2, '20:00', 'Asia/Jerusalem', '2026-10-06', '2026-12-22', 15, 'enrolling', 'channel', 1),
  ('group_103', 'course_002', 'greece-fri-18-adults', 'adults', 5, '18:00', 'Asia/Jerusalem', '2026-10-09', '2026-12-25', 15, 'enrolling', 'channel', 1),
  ('group_104', 'course_001', 'medieval-russia-wed-20-adults', 'adults', 3, '20:00', 'Asia/Jerusalem', '2026-10-07', '2027-01-06', 15, 'enrolling', 'channel', 1),
  ('group_105', 'course_003', 'philosophy-mon-20-adults', 'adults', 1, '20:00', 'Asia/Jerusalem', '2026-10-05', '2027-01-04', 15, 'enrolling', 'channel', 1),
  ('group_106', 'course_003', 'philosophy-thu-18-teens', 'teens', 4, '18:00', 'Asia/Jerusalem', '2026-10-08', '2027-01-07', 12, 'enrolling', 'channel', 2),
  ('group_107', 'course_004', 'prehistoric-sun-20-adults', 'adults', 0, '20:00', 'Asia/Jerusalem', '2026-11-01', '2026-12-27', 15, 'enrolling', 'channel', 1),
  ('group_108', 'course_005', 'stories-thu-20-adults', 'adults', 4, '20:00', 'Asia/Jerusalem', '2026-10-08', '2027-01-07', 10, 'enrolling', 'channel', 1),
  ('group_109', 'course_006', 'near-east-tue-20-adults', 'adults', 2, '20:00', 'Asia/Jerusalem', '2026-10-06', '2027-01-05', 15, 'enrolling', 'channel', 1),
  ('group_110', 'course_006', 'near-east-sun-18-teens', 'teens', 0, '18:00', 'Asia/Jerusalem', '2026-10-11', '2027-01-10', 12, 'enrolling', 'channel', 2),
  ('group_111', 'course_007', 'early-modern-mon-20-adults', 'adults', 1, '20:00', 'Asia/Jerusalem', '2026-10-05', '2027-01-04', 16, 'enrolling', 'channel', 1),
  ('group_112', 'course_007', 'early-modern-thu-18-teens', 'teens', 4, '18:00', 'Asia/Jerusalem', '2026-10-08', '2027-01-07', 12, 'enrolling', 'channel', 2),
  ('group_113', 'course_008', 'nineteenth-wed-20-adults', 'adults', 3, '20:00', 'Asia/Jerusalem', '2026-10-07', '2027-01-06', 16, 'enrolling', 'channel', 1),
  ('group_114', 'course_008', 'nineteenth-sun-19-adults', 'adults', 0, '19:00', 'Asia/Jerusalem', '2026-10-11', '2027-01-10', 16, 'enrolling', 'channel', 1),
  ('group_115', 'course_009', 'twentieth-tue-20-adults', 'adults', 2, '20:00', 'Asia/Jerusalem', '2026-10-06', '2027-01-05', 16, 'enrolling', 'channel', 1),
  ('group_116', 'course_009', 'twentieth-fri-11-adults', 'adults', 5, '11:00', 'Asia/Jerusalem', '2026-10-09', '2027-01-08', 16, 'enrolling', 'channel', 1)
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
  -- rest are set per group in the admin panel.
