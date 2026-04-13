"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthSession } from "@/hooks/use-auth-session";
import { createClient } from "@/lib/supabase";

/**
 * 하단 탭 위에 로그인 상태를 짧게 표시 (이력서·고용주 기능과 세션 공유).
 */
export function AuthNavStrip() {
  const router = useRouter();
  const { session, loading } = useAuthSession();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="border-b border-zinc-100 bg-white/90 px-3 py-2 text-center text-[13px] leading-snug text-zinc-600">
      {loading ? (
        <span className="text-zinc-400">세션 확인 중…</span>
      ) : session?.user?.email ? (
        <div className="flex items-center justify-center gap-2">
          <span className="max-w-[min(100%,14rem)] truncate" title={session.user.email}>
            {session.user.email}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="shrink-0 font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <span>
          <Link href="/login" className="font-medium text-blue-600 underline">
            로그인
          </Link>
          <span className="mx-1 text-zinc-300">·</span>
          <Link href="/signup" className="font-medium text-zinc-600 underline">
            회원가입
          </Link>
        </span>
      )}
    </div>
  );
}
