#!/usr/bin/env node
/**
 * Apply the SQL migrations in supabase/migrations, in order, once each.
 *
 *   npm run migrate            apply everything not yet applied
 *   npm run migrate -- --dry   show what would run, touch nothing
 *   npm run migrate -- --baseline 0001_init.sql 0002_hardening.sql
 *                              record those as applied without running them,
 *                              for migrations already pasted into the
 *                              Supabase SQL editor by hand
 *
 * Connection string, in order of preference:
 *   SUPABASE_DB_URL, then DATABASE_URL, read from the environment or from
 *   .env.local. Supabase Dashboard → Project Settings → Database →
 *   Connection string → URI. Use the pooler on port 6543 if the direct
 *   5432 host is unreachable from your network.
 *
 * A record of what has run lives in `schema_migrations`, so this is safe to
 * run repeatedly and safe to run against a database that is already
 * partway there.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, 'supabase', 'migrations');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const baselineIndex = args.indexOf('--baseline');
const baseline =
  baselineIndex === -1
    ? []
    : args.slice(baselineIndex + 1).filter((value) => !value.startsWith('--'));

function connectionString() {
  const fromEnv =
    process.env.SUPABASE_DB_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;

  // Fall back to .env.local so the URL can live beside the other secrets
  // rather than in shell history.
  const envFile = join(root, '.env.local');
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
      const match = /^\s*(SUPABASE_DB_URL|DATABASE_URL)\s*=\s*(.+?)\s*$/.exec(
        line
      );
      if (match) return match[2].replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

const url = connectionString();
if (!url) {
  console.error(
    'No database URL.\n' +
      'Set SUPABASE_DB_URL in .env.local, or export it:\n' +
      '  SUPABASE_DB_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"\n' +
      'Supabase Dashboard → Project Settings → Database → Connection string → URI.'
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

const client = new pg.Client({
  connectionString: url,
  // Supabase terminates plaintext connections; the certificate chain is
  // not verifiable from here, which is fine for a one-off admin task.
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();

  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows } = await client.query('select name from schema_migrations');
  const applied = new Set(rows.map((row) => row.name));

  if (baseline.length > 0) {
    for (const name of baseline) {
      if (!files.includes(name)) {
        console.error(`  ✗ ${name} is not in supabase/migrations`);
        process.exit(1);
      }
      if (applied.has(name)) {
        console.log(`  · ${name} already recorded`);
        continue;
      }
      if (dryRun) {
        console.log(`  ~ would record ${name} as applied`);
        continue;
      }
      await client.query(
        'insert into schema_migrations (name) values ($1) on conflict do nothing',
        [name]
      );
      applied.add(name);
      console.log(`  = ${name} recorded as already applied`);
    }
  }

  const pending = files.filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log('Nothing to apply — the database is up to date.');
    process.exit(0);
  }

  console.log(`${pending.length} migration(s) to apply:\n`);

  for (const name of pending) {
    const sql = readFileSync(join(migrationsDir, name), 'utf8');

    if (dryRun) {
      console.log(`  ~ would apply ${name} (${sql.split('\n').length} lines)`);
      continue;
    }

    process.stdout.write(`  → ${name} … `);
    try {
      // Each file runs as one statement batch. Postgres wraps that in an
      // implicit transaction, so a file either lands whole or not at all.
      await client.query(sql);
      await client.query('insert into schema_migrations (name) values ($1)', [
        name
      ]);
      console.log('ok');
    } catch (error) {
      console.log('failed');
      console.error(`\n${name} did not apply:\n  ${error.message}\n`);
      console.error(
        'Nothing was recorded for this file. Fix the cause and run again;\n' +
          'earlier migrations stay applied.'
      );
      process.exit(1);
    }
  }

  console.log('\nDone.');
} finally {
  await client.end().catch(() => undefined);
}
