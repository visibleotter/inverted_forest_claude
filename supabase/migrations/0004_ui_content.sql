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
