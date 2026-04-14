"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PhoneAuthPlaceholder } from "@/components/auth/phone-auth-placeholder";
import {
  ACCOUNT_KIND_LABELS,
  type AccountKind,
} from "@/domain/account-kind";
import { normalizeKoreanMobileLocalDigits } from "@/lib/auth/phone-normalize";
import { buildSignupUserMetadata } from "@/lib/auth/signup-metadata";

import {
  checkPhoneAvailableForSignup,
  signUpEmployer,
  signUpSenior,
} from "./actions";

const KINDS: AccountKind[] = [
  "employer_business",
  "employer_informal",
  "senior",
];

function defaultBirthDateAge50(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 50);
  return d.toISOString().slice(0, 10);
}

export default function SignupPage() {
  const router = useRouter();
  const [accountKind, setAccountKind] = useState<AccountKind | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [employerPhone, setEmployerPhone] = useState("");
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState(defaultBirthDateAge50);
  const [residence, setResidence] = useState("");
  const [seniorPhone, setSeniorPhone] = useState("");
  const [seniorPassword, setSeniorPassword] = useState("");
  const [seniorPasswordConfirm, setSeniorPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);

    try {
      if (
        (accountKind === "employer_business" ||
          accountKind === "employer_informal") &&
        phoneHint === "이미 가입된 번호예요."
      ) {
        setError("다른 휴대폰 번호를 사용해 주세요.");
        setLoading(false);
        return;
      }

      if (accountKind === "senior") {
        const name = displayName.trim();
        if (!name) {
          setError("이름을 입력해 주세요.");
          setLoading(false);
          return;
        }
        if (!birthDate) {
          setError("생년월일을 선택해 주세요.");
          setLoading(false);
          return;
        }
        const res = residence.trim();
        if (!res) {
          setError("거주지를 입력해 주세요.");
          setLoading(false);
          return;
        }
        if (!normalizeKoreanMobileLocalDigits(seniorPhone)) {
          setError("휴대폰 번호를 확인해 주세요. (예: 01012345678)");
          setLoading(false);
          return;
        }
        if (seniorPassword.length < 6) {
          setError("비밀번호는 6자 이상으로 입력해 주세요.");
          setLoading(false);
          return;
        }
        if (seniorPassword !== seniorPasswordConfirm) {
          setError("비밀번호가 서로 일치하지 않아요.");
          setLoading(false);
          return;
        }

        const result = await signUpSenior({
          phone: seniorPhone,
          password: seniorPassword,
          displayName: name,
          birthDate,
          residence: res,
        });
        if (!result.ok) {
          setError(result.error);
          setLoading(false);
          return;
        }
        router.replace("/");
        router.refresh();
        return;
      }

      const result = await signUpEmployer({
        phone: employerPhone,
        password,
        displayName,
        accountKind,
      });
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.replace("/login?registered=1");
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
        <strong>구직자·고용주 모두</strong> 휴대폰 번호와 비밀번호로 가입해요. (로그인
        시에도 아이디 대신 같은 번호를 입력합니다.){" "}
        <strong>구직자(시니어)</strong>는 만 50세 이상 기준으로 이름·생년월일·거주지도
        받습니다.
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
                    생년월일 기본값은 오늘 기준 만 50세예요.
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
            {isSenior ? "이름" : "이름 또는 닉네임"}
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

        {isSenior ? (
          <>
            <div>
              <label
                htmlFor="su-birth-date"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                생년월일
              </label>
              <input
                id="su-birth-date"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
              <p className="mt-1 text-[14px] text-zinc-500">
                구직자 기준은 만 50세 이상이에요. 기본 선택은 오늘 기준 50세입니다.
              </p>
            </div>
            <div>
              <label
                htmlFor="su-residence"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                거주지
              </label>
              <input
                id="su-residence"
                type="text"
                autoComplete="street-address"
                required
                placeholder="예: 경기 안산시 단원구, 서울 강남구"
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
            </div>
            <div>
              <label
                htmlFor="su-senior-phone"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                휴대폰 번호 (로그인 ID)
              </label>
              <input
                id="su-senior-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                placeholder="01012345678"
                value={seniorPhone}
                onChange={(e) =>
                  setSeniorPhone(e.target.value.replace(/[^\d]/g, ""))
                }
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
              <p className="mt-1 text-[14px] text-zinc-500">
                로그인할 때도 이 번호와 비밀번호를 사용해요.
              </p>
            </div>
            <div>
              <label
                htmlFor="su-senior-password"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                비밀번호
              </label>
              <input
                id="su-senior-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={seniorPassword}
                onChange={(e) => setSeniorPassword(e.target.value)}
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
            </div>
            <div>
              <label
                htmlFor="su-senior-password2"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                비밀번호 확인
              </label>
              <input
                id="su-senior-password2"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={seniorPasswordConfirm}
                onChange={(e) => setSeniorPasswordConfirm(e.target.value)}
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
            </div>
          </>
        ) : null}

        {isEmployer ? (
          <>
            <div>
              <label
                htmlFor="su-employer-phone"
                className="mb-2 block text-[17px] font-medium text-zinc-800"
              >
                휴대폰 번호 (로그인 ID)
              </label>
              <input
                id="su-employer-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                placeholder="01012345678"
                value={employerPhone}
                onChange={(e) => {
                  setEmployerPhone(e.target.value.replace(/[^\d]/g, ""));
                  setPhoneHint(null);
                }}
                onBlur={(e) => {
                  void (async () => {
                    const v = e.target.value;
                    if (!v.trim()) return;
                    const r = await checkPhoneAvailableForSignup(v);
                    if (!r.ok) {
                      setPhoneHint(r.error);
                      return;
                    }
                    setPhoneHint(
                      r.available
                        ? "사용 가능한 번호예요."
                        : "이미 가입된 번호예요."
                    );
                  })();
                }}
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              />
              <p className="mt-1 text-[14px] text-zinc-500">
                아이디 대신 이 번호로 로그인해요. (하이픈 없이 숫자만)
              </p>
              {phoneHint ? (
                <p
                  className={`mt-1 text-[14px] ${
                    phoneHint.startsWith("사용 가능")
                      ? "text-emerald-700"
                      : phoneHint.startsWith("이미 가입")
                        ? "text-red-700"
                        : "text-zinc-600"
                  }`}
                >
                  {phoneHint}
                </p>
              ) : null}
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
        <button
          type="submit"
          disabled={loading || !accountKind}
          className="min-h-[60px] w-full rounded-2xl bg-zinc-900 text-[18px] font-semibold text-white active:bg-zinc-800 disabled:opacity-60"
        >
          {loading
            ? "처리 중…"
            : isSenior
              ? "가입하고 시작하기"
              : "휴대폰으로 가입하기"}
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
