#!/usr/bin/env node
/**
 * Build supabase/APPLY-IN-SQL-EDITOR.sql — everything that still has to be
 * applied, in the right order, as one paste.
 *
 *   npm run sql:bundle              migrations 0003 and 0004, plus the seed
 *   npm run sql:bundle -- 0004      only the named migrations, plus the seed
 *   npm run sql:bundle -- --no-seed  migrations only
 *
 * This exists because the Supabase SQL Editor is the path of least
 * resistance — no connection string, no password, no client to install —
 * and three separate pastes in a required order is three chances to do it
 * wrong. `npm run migrate` remains the better tool once the database URL
 * is set up; this is for when it is not.
 *
 * `begin`/`commit` are stripped: the editor already runs a statement batch
 * in one transaction, and a nested `begin` there produces a warning and a
 * commit that ends the wrong transaction.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const withSeed = !args.includes('--no-seed');
const named = args.filter((value) => !value.startsWith('--'));

// Default to what is not yet in the database: 0001 and 0002 were applied by
// hand before the runner existed.
const migrations =
  named.length > 0
    ? named.map((name) => (name.endsWith('.sql') ? name : `${name}.sql`))
    : ['0003_enrollment_engine.sql', '0004_ui_content.sql'];

const stripTransaction = (sql) =>
  sql
    .split('\n')
    .filter((line) => !/^\s*(begin|commit)\s*;\s*$/i.test(line))
    .join('\n')
    .trim();

const parts = [];

for (const name of migrations) {
  const path = join(root, 'supabase', 'migrations', name);
  if (!existsSync(path)) {
    console.error(`Not found: supabase/migrations/${name}`);
    process.exit(1);
  }
  parts.push(
    `-- ═══ migration ${name} ${'═'.repeat(Math.max(0, 52 - name.length))}\n\n` +
      stripTransaction(readFileSync(path, 'utf8'))
  );
}

if (withSeed) {
  const seedPath = join(root, 'supabase', 'seed.sql');
  if (!existsSync(seedPath)) {
    console.error('supabase/seed.sql is missing — run `npm run seed:generate`.');
    process.exit(1);
  }
  parts.push(
    `-- ═══ content seed ${'═'.repeat(45)}\n\n` +
      stripTransaction(readFileSync(seedPath, 'utf8'))
  );
}

const header = `-- Inverted Forest · run this once, in the Supabase SQL Editor
--
-- GENERATED FILE — do not edit. Rebuild with: npm run sql:bundle
--
-- Select all, paste into the SQL Editor, press Run. One go, correct order.
-- Everything here is safe to run twice: the migrations create objects that
-- do not exist yet, and the seed upserts.
--
-- Contains: ${migrations.join(', ')}${withSeed ? ' and the content seed' : ''}
--
-- Afterwards, check it landed by running scripts/inspect-schema.sql.

`;

const out = join(root, 'supabase', 'APPLY-IN-SQL-EDITOR.sql');
writeFileSync(out, header + parts.join('\n\n\n') + '\n', 'utf8');

console.log(
  `supabase/APPLY-IN-SQL-EDITOR.sql written — ${migrations.length} migration(s)` +
    `${withSeed ? ' + seed' : ''}, ${(header + parts.join('')).split('\n').length} lines.`
);
