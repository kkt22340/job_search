"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { resolveAuthEmailForPasswordLogin } from "@/lib/auth/login-id";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setJustRegistered(q.get("registered") === "1");
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const authEmail = resolveAuthEmailForPasswordLogin(loginIdOrEmail);
      if (!authEmail) {
        setError(
          "휴대폰 번호(010…) 또는 예전 영문 아이디·이메일을 입력해 주세요."
        );
        return;
      }
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("로그인 중 오류가 났어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900">
        로그인
      </h1>
      <p className="mt-2 text-[16px] leading-relaxed text-zinc-600">
        <strong>가입 시 적은 휴대폰 번호</strong>와 비밀번호로 로그인해요. (예전
        영문 아이디·이메일 가입 계정은 예전 방식 그대로 입력할 수 있어요.)
      </p>

      {justRegistered ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] leading-relaxed text-emerald-950">
          <p className="font-medium text-emerald-900">가입이 완료되었어요</p>
          <p className="mt-1 text-emerald-900/95">
            아래에서 휴대폰 번호와 비밀번호로 로그인해 주세요.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/90 px-4 py-3 text-[15px] leading-relaxed text-violet-950">
        <p className="font-medium text-violet-900">시니어(이메일 없이 가입)</p>
        <p className="mt-1 text-violet-900/95">
          예전에 익명으로만 쓰던 세션이 있을 수 있어요. 휴대폰으로 가입했다면
          위에서 <strong>번호·비밀번호</strong>로 로그인해 보세요.{" "}
          <Link
            href="/signup?kind=senior"
            className="font-semibold text-violet-700 underline"
          >
            새로 시니어 가입
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <label
            htmlFor="login-id"
            className="mb-2 block text-[17px] font-medium text-zinc-800"
          >
            휴대폰 번호 (또는 예전 아이디·이메일)
          </label>
          <input
            id="login-id"
            type="text"
            autoComplete="username tel"
            required
            value={loginIdOrEmail}
            onChange={(e) => setLoginIdOrEmail(e.target.value)}
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
        </div>
        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-[17px] font-medium text-zinc-800"
          >
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-[15px] text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="min-h-[60px] w-full rounded-2xl bg-zinc-900 text-[18px] font-semibold text-white active:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "처리 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-8 text-center text-[16px] text-zinc-600">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold text-blue-600 underline">
          회원가입
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-[15px] text-zinc-500 underline">
          지도로 돌아가기
        </Link>
      </p>
    </div>
  );
}
