import { createClient } from '@supabase/supabase-js'

// These variables are pulled from your client/.env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- DEBUGGING STEP ---
// The logs below will appear in your browser's developer console (F12 or Ctrl+Shift+I).
// They will tell us if the .env file is being loaded correctly by the server.
console.log("VITE_SUPABASE_URL:", supabaseUrl);
console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Key has been loaded." : "ERROR: Key is NOT loaded or is empty.");
// ----------------------

if (!supabaseUrl || !supabaseAnonKey) {
  // This error is what causes the blank white screen.
  throw new Error("CRITICAL ERROR: Supabase keys not found. Please ensure your 'client/.env' file is correct and you have FULLY RESTARTED the server.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)



      

