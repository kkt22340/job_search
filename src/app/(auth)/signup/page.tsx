"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PhoneAuthPlaceholder } from "@/components/auth/phone-auth-placeholder";
import {
  ACCOUNT_KIND_LABELS,
  type AccountKind,
} from "@/domain/account-kind";
import { buildSignupUserMetadata } from "@/lib/auth/signup-metadata";
import { createClient } from "@/lib/supabase";

const KINDS: AccountKind[] = [
  "employer_business",
  "employer_informal",
  "senior",
];

export default function SignupPage() {
  const router = useRouter();
  const [accountKind, setAccountKind] = useState<AccountKind | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("kind");
    if (k === "senior") {
      setAccountKind("senior");
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountKind) {
      setError("가입 유형을 선택해 주세요.");
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (accountKind === "senior") {
        const name = displayName.trim();
        if (!name) {
          setError("이름 또는 닉네임을 입력해 주세요.");
          setLoading(false);
          return;
        }
        const meta = buildSignupUserMetadata({
          displayName: name,
          accountKind: "senior",
          birthYear: birthYear || null,
        });
        const { error: anonError } = await supabase.auth.signInAnonymously({
          options: { data: meta },
        });
        if (anonError) {
          setError(
            anonError.message.includes("Anonymous")
              ? "시니어 가입을 위해 Supabase 대시보드에서 Anonymous 로그인을 켜 주세요. (Authentication → Providers → Anonymous)"
              : anonError.message
          );
          setLoading(false);
          return;
        }
        router.replace("/");
        router.refresh();
        return;
      }

      const meta = buildSignupUserMetadata({
        displayName,
        accountKind,
        birthYear: null,
      });
      const { error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: meta,
        },
      });
      if (signError) {
        setError(signError.message);
        setLoading(false);
        return;
      }
      setInfo("가입이 완료되었어요. 로그인해 주세요.");
      setLoading(false);
      router.refresh();
    } catch {
      setError("가입 중 오류가 났어요. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  const isSenior = accountKind === "senior";
  const isEmployer = accountKind === "employer_business" || accountKind === "employer_informal";

  return (
    <div className="flex flex-1 flex-col pb-12">
      <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900">
        회원가입
      </h1>
      <p className="mt-2 text-[16px] leading-relaxed text-zinc-600">
        <strong>시니어</strong>는 이메일 없이 시작할 수 있어요.{" "}
        <strong>고용주</strong>는 이메일로 가입합니다. 유료 본인인증은 이후
        휴대폰 연동 시, 필요한 화면에서만 받습니다.
      </p>

      <section className="mt-8" aria-labelledby="kind-heading">
        <h2 id="kind-heading" className="text-[18px] font-semibold text-zinc-900">
          어떤 분이신가요?
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {KINDS.map((k) => {
            const active = accountKind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setAccountKind(k)}
                className={`min-h-[56px] rounded-2xl border-2 px-4 py-3 text-left text-[17px] font-medium transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-200"
                    : "border-zinc-200 bg-white text-zinc-900 active:bg-zinc-50"
                }`}
              >
                {ACCOUNT_KIND_LABELS[k]}
                {k === "senior" ? (
                  <span className="mt-1 block text-[14px] font-normal text-zinc-600">
                    이메일 없이 이 기기에서 바로 시작해요. 다른 기기·복구는 이후
                    휴대폰 연결을 권장해요.
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
        <div>
          <label
            htmlFor="su-name"
            className="mb-2 block text-[17px] font-medium text-zinc-800"
          >
            이름 또는 닉네임
          </label>
          <input
            id="su-name"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
        </div>

        {isEmployer ? (
          <>
            <div>
              <label
                htmlFor="su-email"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                이메일
              </label>
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
            </div>
            <div>
              <label
                htmlFor="su-password"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                비밀번호 (6자 이상 권장)
              </label>
              <input
                id="su-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
            </div>
          </>
        ) : null}

        {isSenior ? (
          <div>
            <label
              htmlFor="su-birth"
              className="mb-2 block text-[17px] font-medium text-zinc-800"
            >
              출생연도 (선택)
            </label>
            <input
              id="su-birth"
              type="text"
              inputMode="numeric"
              placeholder="예: 1965"
              maxLength={4}
              value={birthYear}
              onChange={(e) =>
                setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
            />
            <p className="mt-1 text-[14px] text-zinc-500">
              통계·맞춤 안내용이에요. 비워도 가입할 수 있어요.
            </p>
          </div>
        ) : null}

        {isEmployer ? (
          <div className="pt-2">
            <PhoneAuthPlaceholder />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-[15px] text-red-800">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900">
            {info}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !accountKind}
          className="min-h-[60px] w-full rounded-2xl bg-zinc-900 text-[18px] font-semibold text-white active:bg-zinc-800 disabled:opacity-60"
        >
          {loading
            ? "처리 중…"
            : isSenior
              ? "이메일 없이 시작하기"
              : "이메일로 가입하기"}
        </button>
      </form>

      <p className="mt-8 text-center text-[16px] text-zinc-600">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-blue-600 underline">
          로그인
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
