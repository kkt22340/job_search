"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthSession } from "@/hooks/use-auth-session";
import { createClient } from "@/lib/supabase";

function roleLabelKo(role: string | null | undefined): string {
  if (role === "senior") return "시니어";
  if (role === "employer") return "고용주";
  if (role === "admin") return "관리자";
  return "회원";
}

function resolveDisplayName(
  profileName: string | null | undefined,
  user: User
): string {
  const trimmed = profileName?.trim();
  if (trimmed) return trimmed;
  const meta = user.user_metadata as {
    display_name?: string;
    phone?: string;
    login_id?: string;
  } | null;
  if (meta?.display_name?.trim()) return meta.display_name.trim();
  if (meta?.phone?.trim()) return meta.phone.trim();
  if (meta?.login_id?.trim()) return meta.login_id.trim();
  const em = user.email?.trim();
  if (em) return em.split("@")[0] ?? em;
  return "회원";
}

/**
 * 하단 탭 위에 로그인 상태·역할 인사를 표시 (이력서·고용주 기능과 세션 공유).
 */
export function AuthNavStrip() {
  const router = useRouter();
  const { session, loading } = useAuthSession();
  const [greetingReady, setGreetingReady] = useState(false);
  const [greetingName, setGreetingName] = useState("");
  const [greetingRole, setGreetingRole] = useState("회원");

  useEffect(() => {
    if (!session?.user) {
      setGreetingReady(false);
      return;
    }
    let cancelled = false;
    setGreetingReady(false);
    (async () => {
      const supabase = createClient();
      const { data: prof } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setGreetingName(resolveDisplayName(prof?.display_name as string | null, session.user));
      setGreetingRole(roleLabelKo(prof?.role as string | undefined));
      setGreetingReady(true);
    })().catch(() => {
      if (!cancelled && session?.user) {
        setGreetingName(resolveDisplayName(null, session.user));
        setGreetingRole("회원");
        setGreetingReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="border-b border-zinc-100 bg-white/90 px-3 py-2.5 text-center leading-snug text-zinc-600">
      {loading ? (
        <span className="text-[14px] text-zinc-400">세션 확인 중…</span>
      ) : session?.user ? (
        <div className="flex flex-col items-center gap-1.5">
          <p className="w-full max-w-md text-[15px] font-medium leading-snug text-zinc-900">
            {greetingReady ? (
              <>
                <span className="text-blue-700">{greetingName}</span>{" "}
                {greetingRole} 님, 안녕하세요
              </>
            ) : (
              <span className="text-zinc-500">프로필 불러오는 중…</span>
            )}
          </p>
          <div className="flex items-center justify-center gap-2 text-[13px]">
            <span
              className="max-w-[min(100%,14rem)] truncate text-zinc-500"
              title={
                (session.user.user_metadata as { phone?: string })?.phone ??
                (session.user.user_metadata as { login_id?: string })?.login_id ??
                session.user.email ??
                ""
              }
            >
              {(session.user.user_metadata as { phone?: string })?.phone ??
                (session.user.user_metadata as { login_id?: string })?.login_id ??
                session.user.email ??
                "로그인됨"}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="shrink-0 font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
            >
              로그아웃
            </button>
          </div>
        </div>
      ) : (
        <span className="text-[14px]">
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
