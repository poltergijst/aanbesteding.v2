import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuratie ontbreekt. Controleer environment variables.');
}

// Validate Supabase URL format
try {
  const url = new URL(supabaseUrl);
  if (!url.hostname.endsWith('.supabase.co')) {
    throw new Error('Invalid Supabase URL format');
  }
} catch (error) {
  throw new Error('Ongeldige Supabase URL configuratie');
}

// Validate API key format (basic JWT structure check)
if (!supabaseAnonKey.match(/^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*$/)) {
  throw new Error('Ongeldige Supabase API key format');
}

// Row Level Security (RLS) moet worden ingeschakeld op alle Supabase tabellen
// Implementeer proper authentication flows
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false // Prevent session hijacking via URL
  },
  global: {
    headers: {
      'X-Client-Info': 'aanbestedingsmanagement-app'
    }
  }
});