import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: SALTA las políticas RLS.
 * Solo se usa en el cron de recordatorios y para firmar URLs de fotos
 * que ya fueron autorizadas por get_public_book. Nunca en el cliente.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
