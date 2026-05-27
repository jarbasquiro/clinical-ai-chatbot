import { createClient } from '@supabase/supabase-js';

// Se o ambiente do Render falhar, coloque suas strings reais entre as aspas abaixo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "COLE_AQUI_SUA_URL_DO_SUPABASE_REAL";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "COLE_AQUI_SUA_CHAVE_ANON_DO_SUPABASE_REAL";

export const supabase = createClient(supabaseUrl, supabaseKey);
