import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 전용 — RLS 우회(배치 검수 등). 키가 없으면 null.
 * 절대 클라이언트 번들에 넣지 말 것.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
