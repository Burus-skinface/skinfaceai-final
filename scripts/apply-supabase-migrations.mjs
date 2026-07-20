import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = 'bvgrrnsgmxwcqtqiqyjm';

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

async function runSql(sql, label) {
  console.log(`\n→ ${label} (${sql.length} chars)...`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: controller.signal,
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    if (!res.ok) {
      console.error(`FAILED ${label}`, res.status, body);
      return false;
    }
    console.log(`OK ${label}`);
    return true;
  } catch (e) {
    console.error(`ERROR ${label}`, e.message || e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Warmup
if (!(await runSql('select 1 as ok;', 'warmup'))) process.exit(1);

const files = [
  'supabase/migrations/001_security_hardening.sql',
  'supabase/migrations/002_profile_streak.sql',
];

for (const rel of files) {
  const sql = fs.readFileSync(path.join(root, rel), 'utf8');
  // Split on blank-line-separated major sections if whole file times out
  const ok = await runSql(sql, rel);
  if (!ok) {
    console.log('Retrying as statement batches...');
    const parts = sql.split(/;\s*\n(?=\n|CREATE|ALTER|DROP|COMMENT|--)/);
    let buf = '';
    let i = 0;
    for (const part of parts) {
      buf += part + (part.trim().endsWith(';') ? '\n' : ';\n');
      if (buf.length > 4000 || part === parts[parts.length - 1]) {
        i += 1;
        const batchOk = await runSql(buf, `${rel} batch ${i}`);
        if (!batchOk) process.exit(1);
        buf = '';
      }
    }
  }
}

console.log('\nDone.');
