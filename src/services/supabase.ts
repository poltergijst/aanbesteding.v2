import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuratie ontbreekt. Controleer environment variables.');
}

// Row Level Security (RLS) moet worden ingeschakeld op alle Supabase tabellen
// Implementeer proper authentication flows
export const supabase = createClient(supabaseUrl, supabaseAnonKey);