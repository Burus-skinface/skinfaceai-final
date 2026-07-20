import fs from 'fs';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const anon = env.VITE_SUPABASE_ANON_KEY;
const url = `${env.VITE_API_BASE_URL.replace(/\/$/, '')}/analyze`;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${anon}`,
    apikey: anon,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Return JSON {"ok":true} only.',
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean' } },
      required: ['ok'],
    },
  }),
});

const text = await res.text();
console.log('status', res.status);
console.log(text.slice(0, 500));
if (!res.ok) process.exit(1);
