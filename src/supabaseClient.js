import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Error handling wrapper for Supabase operations
export const handleSupabaseError = (error) => {
  console.error('Supabase operation failed:', error);
  if (error.message) {
    return `Database error: ${error.message}`;
  }
  return 'An unexpected database error occurred.';
};
