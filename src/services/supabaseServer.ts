import { createClient } from '@supabase/supabase-js';

// Этот клиент использует SERVICE_ROLE_KEY — только для сервера!
// Никогда не импортировать в клиентский код.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);
