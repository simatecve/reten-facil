import { createClient } from '@supabase/supabase-js';

// NOTE: En un entorno de producción, se necesitan políticas RLS estrictas.
const SUPABASE_URL = 'https://muvzqkmfeptywffhgbjn.supabase.co';

// Clave pública (anon) para conexión desde el cliente
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_JLr7kigocnv-W6ROPLROPQ_eV4D6D8x';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);