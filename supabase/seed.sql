-- Seed data mirroring src/lib/data/seed.ts (courses, groups, teacher).
-- Run after 0001_init.sql: psql "$DATABASE_URL" -f supabase/seed.sql

insert into teachers (id, slug) values ('teacher_001', 'mark-ovadia');

insert into teacher_translations (teacher_id, locale, name, title, bio, highlights) values
('teacher_001', 'ru', 'Марк Овадия', 'Историк и философ',
 'Историк и философ, увлечённый тем, чтобы оживлять прошлое для любознательных умов всех возрастов. Преподаю на английском и русском языках и работаю со взрослыми, подростками и детьми.',
 '["Двуязычное преподавание (английский и русский)","Индивидуальные и групповые занятия","Курсы для взрослых, подростков и детей","Живые занятия с вопросами и ответами, записи предоставляются","Основаны на первоисточниках и оригинальных текстах"]'),
('teacher_001', 'en', 'Mark Ovadia', 'Historian & Philosopher',
 'A historian and philosopher passionate about bringing the past to life for curious minds of all ages. I teach in both English and Russian and work with adults, teenagers, and children.',
 '["Bilingual instruction (English & Russian)","Individual and group sessions available","Courses for adults, teens, and children","Live sessions with Q&A, recordings provided","Rooted in primary sources and original texts"]');

insert into courses (id, slug, teacher_id, category, difficulty, age_groups, duration_months, monthly_price, currency, image_url, public_telegram_url, status, featured) values
('course_001', 'medieval-russia', 'teacher_001', 'history', 'intermediate', '{adults,teens}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=1200&q=80', 'https://t.me/invertedforest', 'published', true),
('course_002', 'ancient-greece', 'teacher_001', 'history', 'intro', '{adults,children}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80', 'https://t.me/invertedforest', 'published', true),
('course_003', 'greek-philosophy', 'teacher_001', 'philosophy', 'intermediate', '{adults,teens}', 3, 380, 'ILS', 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=1200&q=80', 'https://t.me/invertedforest', 'published', true),
('course_004', 'prehistoric-mindset', 'teacher_001', 'anthropology', 'deep_dive', '{adults}', 2, 380, 'ILS', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80', 'https://t.me/invertedforest', 'published', false),
('course_005', 'american-short-stories', 'teacher_001', 'literature', 'intro', '{adults}', 3, 300, 'ILS', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80', 'https://t.me/invertedforest', 'published', false),
('course_006', 'ancient-near-east', 'teacher_001', 'history', 'intermediate', '{adults,teens}', 3, 350, 'ILS', 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80', 'https://t.me/invertedforest', 'published', true);

-- Course translations: titles + short descriptions (full copy lives in the
-- admin panel / seed.ts and can be completed there).
insert into course_translations (course_id, locale, title, short_description, description) values
('course_001', 'ru', 'Средневековая Россия', 'Путешествие по драматическим векам Киевской Руси и Московского государства — от варяжских основателей до Ивана Грозного.', 'Курс охватывает политическое, культурное и религиозное развитие России с IX по XVI век.'),
('course_001', 'en', 'Medieval Russia', 'Journey through the dramatic centuries of Kievan Rus and the Muscovite state — from Viking founders to Ivan the Terrible.', 'This course covers the political, cultural, and religious development of Russia from the 9th to the 16th century.'),
('course_002', 'ru', 'Древняя Греция', 'Мир полисов, демократии и мифов — от минойцев бронзового века до завоеваний Александра Македонского.', 'Широкий обзор истории и культуры Древней Греции от минойского мира до эллинизма.'),
('course_002', 'en', 'Ancient Greece', 'The world of city-states, democracy, and myth — from the Bronze Age Minoans to the conquests of Alexander the Great.', 'A broad survey of ancient Greek history and culture from the Minoan world to the Hellenistic era.'),
('course_003', 'ru', 'Греческая философия', 'От досократиков до пещеры Платона, этики Аристотеля и стоического поиска душевного покоя.', 'Курс исследует основные школы и мыслителей древнегреческой философии.'),
('course_003', 'en', 'Greek Philosophy', 'From the pre-Socratics to Plato''s cave, Aristotle''s ethics, and the Stoic quest for peace of mind.', 'This course explores the major schools and thinkers of ancient Greek philosophy.'),
('course_004', 'ru', 'История первобытности', 'Когнитивный и духовный мир наших доисторических предков — наскальная живопись, ритуал, шаманизм.', 'Опираясь на археологию, когнитивные науки и антропологию, курс исследует, как Homo sapiens развил сознание, язык, искусство и религию.'),
('course_004', 'en', 'Human Prehistory', 'The cognitive and spiritual world of our prehistoric ancestors — cave paintings, ritual, shamanism.', 'Drawing on archaeology, cognitive science, and anthropology, this course investigates how Homo sapiens developed consciousness, language, art, and religion.'),
('course_005', 'ru', 'Чтение американских рассказов', 'Книжный клуб для взрослых: от Хемингуэя и Карвера до Фланнери О''Коннор.', 'Каждое занятие посвящено одному-двум рассказам, выбранным за мастерство, темы и культурное значение.'),
('course_005', 'en', 'Reading Short American Stories', 'A book club for adults: from Hemingway and Carver to Flannery O''Connor.', 'Each session focuses on one or two short stories chosen for their craft, themes, and cultural significance.'),
('course_006', 'ru', 'Первые цивилизации Древнего Востока', 'Города, письменность и первые законы — от шумерского Урука до Вавилона, Ассирии и Египта фараонов.', 'Курс о том, как впервые в истории возникли город, государство и письменность: Шумер и Аккад, Вавилон Хаммурапи, Ассирия, Египет, хетты и Персия.'),
('course_006', 'en', 'The First Civilizations of the Ancient Near East', 'Cities, writing and the first laws — from Sumerian Uruk to Babylon, Assyria and the Egypt of the pharaohs.', 'A course on the first appearance of the city, the state and writing: Sumer and Akkad, the Babylon of Hammurabi, Assyria, Egypt, the Hittites and Persia.');

insert into study_groups (id, course_id, slug, audience, weekday, start_time, timezone, start_date, end_date, capacity, seats_taken, payment_url, telegram_channel_id, status) values
('group_101', 'course_002', 'greece-tue-16-children', 'children', 2, '16:00', 'Asia/Jerusalem', '2026-10-06', '2026-12-22', 12, 5, 'https://www.paypal.com/paypalme/invertedforest/350', '-1001000000101', 'enrolling'),
('group_102', 'course_002', 'greece-tue-20-adults', 'adults', 2, '20:00', 'Asia/Jerusalem', '2026-10-06', '2026-12-22', 15, 4, 'https://www.paypal.com/paypalme/invertedforest/350', '-1001000000102', 'enrolling'),
('group_103', 'course_002', 'greece-fri-18-adults', 'adults', 5, '18:00', 'Asia/Jerusalem', '2026-10-09', '2026-12-25', 15, 11, 'https://www.paypal.com/paypalme/invertedforest/350', '-1001000000103', 'enrolling'),
('group_104', 'course_001', 'medieval-russia-wed-20-adults', 'adults', 3, '20:00', 'Asia/Jerusalem', '2026-10-07', '2027-01-06', 15, 7, 'https://www.paypal.com/paypalme/invertedforest/350', '-1001000000104', 'enrolling'),
('group_105', 'course_003', 'philosophy-mon-20-adults', 'adults', 1, '20:00', 'Asia/Jerusalem', '2026-10-05', '2027-01-04', 15, 9, 'https://www.paypal.com/paypalme/invertedforest/380', '-1001000000105', 'enrolling'),
('group_106', 'course_003', 'philosophy-thu-18-teens', 'teens', 4, '18:00', 'Asia/Jerusalem', '2026-10-08', '2027-01-07', 12, 12, 'https://www.paypal.com/paypalme/invertedforest/380', '-1001000000106', 'full'),
('group_107', 'course_004', 'prehistoric-sun-20-adults', 'adults', 0, '20:00', 'Asia/Jerusalem', '2026-11-01', '2026-12-27', 15, 2, 'https://www.paypal.com/paypalme/invertedforest/380', '-1001000000107', 'enrolling'),
('group_108', 'course_005', 'stories-thu-20-adults', 'adults', 4, '20:00', 'Asia/Jerusalem', '2026-10-08', '2027-01-07', 10, 6, 'https://www.paypal.com/paypalme/invertedforest/300', '-1001000000108', 'enrolling'),
('group_109', 'course_006', 'near-east-tue-20-adults', 'adults', 2, '20:00', 'Asia/Jerusalem', '2026-10-06', '2027-01-05', 15, 3, 'https://www.paypal.com/paypalme/invertedforest/350', '-1001000000109', 'enrolling'),
('group_110', 'course_006', 'near-east-sun-18-teens', 'teens', 0, '18:00', 'Asia/Jerusalem', '2026-10-11', '2027-01-10', 12, 1, 'https://www.paypal.com/paypalme/invertedforest/350', '-1001000000110', 'enrolling');

insert into telegram_channels (chat_id, kind, group_id, title, bot_is_admin) values
('-1001000000101', 'private', 'group_101', 'Греция · дети · вт 16:00', true),
('-1001000000102', 'private', 'group_102', 'Греция · взрослые · вт 20:00', true),
('-1001000000103', 'private', 'group_103', 'Греция · взрослые · пт 18:00', true),
('-1001000000104', 'private', 'group_104', 'Средневековая Русь · ср 20:00', true),
('-1001000000105', 'private', 'group_105', 'Философия · пн 20:00', true),
('-1001000000106', 'private', 'group_106', 'Философия · подростки · чт 18:00', true),
('-1001000000107', 'private', 'group_107', 'Доистория · вс 20:00', true),
('-1001000000108', 'private', 'group_108', 'Рассказы · чт 20:00', true),
('-1001000000109', 'private', 'group_109', 'Древний Восток · вт 20:00', true),
('-1001000000110', 'private', 'group_110', 'Древний Восток · подростки · вс 18:00', true);

insert into email_templates (key, locale, subject, body) values
('registration_confirmation', 'ru', 'Мы получили вашу регистрацию — Inverted Forest', 'Здравствуйте, {{first_name}}! Мы получили вашу регистрацию на курс «{{course_title}}». Следующий шаг — оплата: {{payment_url}}'),
('registration_confirmation', 'en', 'We received your registration — Inverted Forest', 'Hello {{first_name}}! We received your registration for “{{course_title}}”. The next step is payment: {{payment_url}}'),
('payment_confirmation', 'ru', 'Оплата получена — добро пожаловать!', 'Спасибо за оплату, {{first_name}}! Ваше персональное приглашение в Telegram-канал группы: {{telegram_invite}} (действует 7 дней, одноразовое).'),
('payment_confirmation', 'en', 'Payment received — welcome!', 'Thank you for your payment, {{first_name}}! Your personal Telegram invite: {{telegram_invite}} (valid 7 days, one-time).'),
('payment_reminder', 'ru', 'Напоминание об оплате — Inverted Forest', 'Здравствуйте, {{first_name}}! Напоминаем об оплате следующего месяца курса «{{course_title}}»: {{payment_url}}'),
('payment_reminder', 'en', 'Payment reminder — Inverted Forest', 'Hello {{first_name}}! A reminder to pay for the next month of “{{course_title}}”: {{payment_url}}'),
('course_completion', 'ru', 'Курс завершён — спасибо, что были с нами', 'Поздравляем с завершением курса «{{course_title}}», {{first_name}}!'),
('course_completion', 'en', 'Course completed — thank you', 'Congratulations on completing “{{course_title}}”, {{first_name}}!');
