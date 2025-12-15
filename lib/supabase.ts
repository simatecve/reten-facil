import { createClient } from '@supabase/supabase-js';

// NOTE: In a production environment, strict RLS policies are needed.
// The user provided specific credentials for this implementation.
const SUPABASE_URL = 'https://muvzqkmfeptywffhgbjn.supabase.co';
const SUPABASE_KEY = 'sb_secret_ZoToiOpGUgrGxcBLEn3dkw_nq5TSYFe'; // Provided by user

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
