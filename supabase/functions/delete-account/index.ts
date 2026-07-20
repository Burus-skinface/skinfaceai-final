// Supabase Edge Function: delete-account
// Deploy: supabase functions deploy delete-account --no-verify-jwt (uses user JWT)
// Secrets: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  await admin.from('scans').delete().eq('user_id', user.id);
  await admin.from('referrals').delete().or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`);
  await admin.from('premium_rewards').delete().eq('user_id', user.id);
  await admin.from('profiles').delete().eq('id', user.id);

  const { error: delAuthErr } = await admin.auth.admin.deleteUser(user.id);
  if (delAuthErr) {
    return new Response(JSON.stringify({ error: delAuthErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
