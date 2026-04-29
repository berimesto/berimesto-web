import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BM_CONFIG } from './config.js';

export const supabase = createClient(BM_CONFIG.supabaseUrl, BM_CONFIG.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
