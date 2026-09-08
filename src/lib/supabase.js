import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    'Supabase is not configured. Copy .env.example to .env and add your Supabase project credentials.'
  );
}

export const supabase = createClient(url || '', key || '');
