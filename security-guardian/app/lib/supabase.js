import { createClient } from "@supabase/supabase-js";

// Ensure you have these environment variables set in app/.env.local
const supabaseUrl = "https://vxyeggmiqsiqvnbkrzpe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4eWVnZ21pcXNpcXZuYmtyenBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODMzNTgsImV4cCI6MjA5MDQ1OTM1OH0.-ptneNuhaLRb3aYy8qLbsMkMH2K3EyWG5x0JCepbcHM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
