
import { createClient } from '@supabase/supabase-js';

// These will be loaded from .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[SUPABASE] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
    console.warn('[SUPABASE] Cloud Sync and Auth will not work until these are set in .env.local.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

export type ScanRecord = {
    id: string; // uuid
    user_id: string; // uuid
    created_at: string; // iso string
    global_score: number;
    analysis_data: any; // The full JSON report
    note?: string;
};
