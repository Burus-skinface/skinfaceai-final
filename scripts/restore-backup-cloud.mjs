/**
 * Docker-free restore: extract app data from pg_dumpall cluster backup
 * and apply it to a NEW Supabase cloud project via Management API.
 *
 * Usage:
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
 *   node scripts/restore-backup-cloud.mjs
 *
 * Optional:
 *   $env:SUPABASE_ORG_ID = "..."
 *   $env:RESTORE_PROJECT_NAME = "Skinface ai"
 *   $env:RESTORE_REGION = "ap-south-1"
 *   $env:SUPABASE_DB_PASSWORD = "..."  (generated if omitted)
 *   $env:EXISTING_PROJECT_REF = "..."  (skip create; restore into this ref)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const backupPath = path.join(root, 'db_cluster.backup');
const token = process.env.SUPABASE_ACCESS_TOKEN;
const orgId = process.env.SUPABASE_ORG_ID || 'sdenqwhtpbdhzmnczakz';
const projectName = process.env.RESTORE_PROJECT_NAME || 'Skinface ai';
const region = process.env.RESTORE_REGION || 'ap-south-1';
const existingRef = process.env.EXISTING_PROJECT_REF || '';

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}
if (!fs.existsSync(backupPath)) {
  console.error('Missing db_cluster.backup in project root');
  process.exit(1);
}

const api = 'https://api.supabase.com/v1';

async function apiFetch(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`${api}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(`API ${method} ${pathname} → ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runSql(ref, sql, label) {
  process.stdout.write(`  SQL ${label} (${sql.length} chars)... `);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  try {
    const res = await fetch(`${api}/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      console.log('FAIL');
      console.error(data);
      throw new Error(`SQL failed: ${label}`);
    }
    console.log('OK');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function parseCopy(lines, table) {
  const start = lines.findIndex(
    (l) => l.startsWith(`COPY ${table} `) || l.startsWith(`COPY ${table}(`),
  );
  if (start < 0) return { cols: [], rows: [] };
  const header = lines[start];
  const m = header.match(/\((.*)\) FROM stdin;/);
  const cols = m ? m[1].split(', ').map((c) => c.trim()) : [];
  const rows = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === '\\.') break;
    rows.push(lines[i]);
  }
  return { cols, rows };
}

const JSON_COLS = new Set([
  'raw_app_meta_data',
  'raw_user_meta_data',
  'identity_data',
  'analysis_data',
  'raw_data',
]);
const BOOL_COLS = new Set([
  'is_super_admin',
  'is_sso_user',
  'is_anonymous',
  'premium',
  'email_change_confirm_status',
]);

function sqlLiteral(col, v) {
  if (v === '\\N' || v === null || v === undefined) return 'NULL';
  let s = String(v)
    .replace(/\\\\/g, '\\')
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r');

  if (BOOL_COLS.has(col) || s === 't' || s === 'f') {
    if (s === 't') return 'true';
    if (s === 'f') return 'false';
    if (/^-?\d+$/.test(s)) return s; // smallint-like
  }
  if (JSON_COLS.has(col)) {
    return `'${s.replace(/'/g, "''")}'::jsonb`;
  }
  if (/^-?\d+(\.\d+)?$/.test(s) && (col.includes('score') || col.endsWith('_status'))) {
    return s;
  }
  return `'${s.replace(/'/g, "''")}'`;
}

function insertSql(table, cols, rowLine) {
  const vals = rowLine.split('\t');
  const pairs = cols.map((c, i) => sqlLiteral(c, vals[i] ?? '\\N'));
  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${pairs.join(', ')}) ON CONFLICT DO NOTHING;`;
}

function buildSchemaSql() {
  return `
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entitlements (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  premium boolean DEFAULT false,
  source text,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT entitlements_source_check CHECK (
    source IS NULL OR source = ANY (ARRAY['google_play','app_store','promo','manual'])
  )
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store text,
  product_id text NOT NULL,
  purchase_token text NOT NULL,
  order_id text,
  status text,
  expires_at timestamptz,
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT purchases_store_check CHECK (
    store IS NULL OR store = ANY (ARRAY['google_play','app_store'])
  )
);

CREATE TABLE IF NOT EXISTS public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  global_score numeric,
  analysis_data jsonb,
  note text,
  summary text,
  version text DEFAULT '1.0'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own scans" ON public.scans;
CREATE POLICY "Users can read own scans" ON public.scans
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can select own scans" ON public.scans;
CREATE POLICY "Users can select own scans" ON public.scans
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own scans" ON public.scans;
CREATE POLICY "Users can insert own scans" ON public.scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own scans" ON public.scans;
CREATE POLICY "Users can delete own scans" ON public.scans
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
CREATE POLICY "Users can view own entitlements" ON public.entitlements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);
`.trim();
}

async function waitActive(ref) {
  for (let i = 0; i < 60; i++) {
    const p = await apiFetch(`/projects/${ref}`);
    console.log(`  status: ${p.status}`);
    if (p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE') return p;
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error('Project did not become ACTIVE in time');
}

async function main() {
  const lines = fs.readFileSync(backupPath, 'utf8').split(/\r?\n/);
  const users = parseCopy(lines, 'auth.users');
  const identities = parseCopy(lines, 'auth.identities');
  const profiles = parseCopy(lines, 'public.profiles');
  const scans = parseCopy(lines, 'public.scans');
  console.log('Backup contents:', {
    users: users.rows.length,
    identities: identities.rows.length,
    profiles: profiles.rows.length,
    scans: scans.rows.length,
  });

  let ref = existingRef;
  let dbPass = process.env.SUPABASE_DB_PASSWORD || '';

  if (!ref) {
    dbPass =
      dbPass ||
      crypto.randomBytes(24).toString('base64url') + 'Aa1!';
    console.log('\nCreating project...');
    const created = await apiFetch('/projects', {
      method: 'POST',
      body: {
        name: projectName,
        organization_id: orgId,
        region,
        db_pass: dbPass,
      },
    });
    ref = created.id || created.ref;
    console.log(`Created ref=${ref}`);
    fs.writeFileSync(
      path.join(root, '.supabase-restore-secrets.json'),
      JSON.stringify(
        {
          ref,
          url: `https://${ref}.supabase.co`,
          db_password: dbPass,
          region,
          created_at: new Date().toISOString(),
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    console.log('Waiting for project to become ACTIVE...');
    await waitActive(ref);
  } else {
    console.log(`Using existing project ${ref}`);
    await waitActive(ref);
  }

  // Disable handle_new_user side effects while seeding auth
  await runSql(
    ref,
    `
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created' AND n.nspname = 'auth'
  ) THEN
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
`,
    'disable auth trigger (best-effort)',
  ).catch(() => console.log('  (trigger disable skipped)'));

  // Prefer inserting users with core columns only if full row fails
  console.log('\nRestoring auth.users...');
  for (let i = 0; i < users.rows.length; i++) {
    await runSql(ref, insertSql('auth.users', users.cols, users.rows[i]), `auth.users #${i + 1}`);
  }

  console.log('\nRestoring auth.identities...');
  for (let i = 0; i < identities.rows.length; i++) {
    await runSql(
      ref,
      insertSql('auth.identities', identities.cols, identities.rows[i]),
      `auth.identities #${i + 1}`,
    );
  }

  console.log('\nCreating public schema...');
  await runSql(ref, buildSchemaSql(), 'public schema + RLS');

  console.log('\nRestoring public.profiles...');
  for (let i = 0; i < profiles.rows.length; i++) {
    await runSql(
      ref,
      insertSql('public.profiles', profiles.cols, profiles.rows[i]),
      `profiles #${i + 1}`,
    );
  }

  console.log('\nRestoring public.scans...');
  for (let i = 0; i < scans.rows.length; i++) {
    await runSql(ref, insertSql('public.scans', scans.cols, scans.rows[i]), `scans #${i + 1}`);
  }

  // Re-enable trigger if we disabled it
  await runSql(
    ref,
    `
DO $$ BEGIN
  ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
`,
    're-enable auth trigger',
  ).catch(() => {});

  // Apply repo migrations
  for (const rel of [
    'supabase/migrations/001_security_hardening.sql',
    'supabase/migrations/002_profile_streak.sql',
  ]) {
    const sql = fs.readFileSync(path.join(root, rel), 'utf8');
    try {
      await runSql(ref, sql, rel);
    } catch (e) {
      console.warn(`Migration ${rel} failed (may need tables from older schema):`, e.message);
    }
  }

  const keys = await apiFetch(`/projects/${ref}/api-keys`);
  const anon = (keys || []).find((k) => k.name === 'anon' || k.tags?.includes('anon'));
  const service = (keys || []).find(
    (k) => k.name === 'service_role' || k.tags?.includes('service_role'),
  );

  const envPath = path.join(root, '.env.local');
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const url = `https://${ref}.supabase.co`;
  const setEnv = (key, val) => {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(env)) env = env.replace(re, `${key}=${val}`);
    else env += `\n${key}=${val}`;
  };
  setEnv('VITE_SUPABASE_URL', url);
  if (anon?.api_key) setEnv('VITE_SUPABASE_ANON_KEY', anon.api_key);
  if (service?.api_key) setEnv('SUPABASE_SERVICE_ROLE_KEY', service.api_key);
  fs.writeFileSync(envPath, env.trim() + '\n');

  console.log('\nDone.');
  console.log(`Project: ${url}`);
  console.log(`Updated ${envPath}`);
  console.log('DB password saved in .supabase-restore-secrets.json (gitignored if possible).');
  console.log('Revoke the access token you pasted in chat after this.');
}

main().catch((e) => {
  console.error(e.message || e);
  if (e.data) console.error(e.data);
  process.exit(1);
});
