"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase";

/**
 * 브라우저 Supabase 세션 (쿠키 기반, 미들웨어와 연동).
 */
export function useAuthSession(): {
  session: Session | null;
  loading: boolean;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!alive) return;
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
