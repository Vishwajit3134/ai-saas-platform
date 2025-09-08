import { createClient } from '@supabase/supabase-js'

// These variables are pulled from your client/.env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in the client/.env file");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

