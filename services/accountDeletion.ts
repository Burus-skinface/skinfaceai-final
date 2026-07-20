import { supabase } from './supabase';

/**
 * Fully deletes the signed-in user via Edge Function (auth.users + related rows).
 * Deploy: supabase functions deploy delete-account
 */
export async function deleteCurrentAccount(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not signed in');
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    throw new Error(error.message || 'Account deletion failed');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
}
