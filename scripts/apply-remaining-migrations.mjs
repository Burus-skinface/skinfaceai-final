import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.EXISTING_PROJECT_REF || 'rgybwdcutguvyjmxdtxq';

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

async function run(label, sql) {
  process.stdout.write(`${label}... `);
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.log('FAIL');
    console.error(text.slice(0, 1200));
    process.exit(1);
  }
  console.log('OK');
  try {
    console.log(JSON.parse(text));
  } catch {
    /* ignore */
  }
}

const files = [
  'supabase/migrations/000_bootstrap_app_schema.sql',
  'supabase/migrations/001_security_hardening.sql',
];

for (const rel of files) {
  await run(rel, fs.readFileSync(path.join(root, rel), 'utf8'));
}

await run(
  'verify',
  `select
    (select count(*) from auth.users) as users,
    (select count(*) from public.profiles) as profiles,
    (select count(*) from public.scans) as scans,
    (select count(*) from public.referrals) as referrals;`,
);
