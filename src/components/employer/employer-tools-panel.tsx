"use client";

import { Calculator, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { IdentityVerificationModal } from "@/components/auth/identity-verification-modal";
import { EmployerTrustNotice } from "@/components/employer/employer-trust-notice";
import { skipIdentityGate } from "@/lib/auth/identity-policy";
import { createClient } from "@/lib/supabase";
import { BigButton } from "@/components/ui/big-button";
import {
  estimateEmployerMonthlyCost,
  formatKrw,
  type EmployerCostInput,
} from "@/lib/calculator";
import {
  formatKoreanBrnDisplay,
  normalizeKoreanBrn,
  validateKoreanBrnInput,
} from "@/lib/korean-brn";

function FieldLabel({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="mb-2 block text-[17px] font-medium text-zinc-800"
    >
      {children}
    </label>
  );
}

function BigNumberInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
    id: string;
  }
) {
  return (
    <input
      {...props}
      className="min-h-[60px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
      inputMode="decimal"
    />
  );
}

export function EmployerToolsPanel() {
  const [brnRaw, setBrnRaw] = useState("");
  const [brnMessage, setBrnMessage] = useState<string | null>(null);
  const [employerIdGateOpen, setEmployerIdGateOpen] = useState(false);
  const [employerNeedsId, setEmployerNeedsId] = useState(false);

  useEffect(() => {
    if (skipIdentityGate()) {
      setEmployerNeedsId(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setEmployerNeedsId(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, identity_verified_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.role === "employer" && profile.identity_verified_at == null) {
        setEmployerNeedsId(true);
      } else {
        setEmployerNeedsId(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [hourly, setHourly] = useState("11000");
  const [weeklyHours, setWeeklyHours] = useState("20");
  const [weeksPerMonth, setWeeksPerMonth] = useState("4.345");
  const [subsidyOn, setSubsidyOn] = useState(true);

  const onBrnChange = useCallback((v: string) => {
    const n = normalizeKoreanBrn(v).slice(0, 10);
    setBrnRaw(n);
    setBrnMessage(null);
  }, []);

  const checkBrn = useCallback(() => {
    const r = validateKoreanBrnInput(brnRaw);
    if (r.reason === "empty") {
      setBrnMessage("번호를 입력해 주세요.");
      return;
    }
    if (r.reason === "length") {
      setBrnMessage("10자리 숫자를 입력해 주세요.");
      return;
    }
    if (r.reason === "checksum") {
      setBrnMessage("형식·체크섬이 맞지 않습니다. 다시 확인해 주세요.");
      return;
    }
    setBrnMessage("체크섬이 유효합니다. 실제 등록 여부는 국세청 등 조회가 필요합니다.");
  }, [brnRaw]);

  const costInput: EmployerCostInput | null = useMemo(() => {
    const hw = parseFloat(hourly.replace(/,/g, ""));
    const wh = parseFloat(weeklyHours.replace(/,/g, ""));
    const wm = parseFloat(weeksPerMonth.replace(/,/g, ""));
    if (![hw, wh, wm].every((x) => Number.isFinite(x) && x > 0)) return null;
    return {
      hourlyWage: hw,
      weeklyHours: wh,
      weeksPerMonth: wm,
      applySeniorSubsidyExample: subsidyOn,
    };
  }, [hourly, weeklyHours, weeksPerMonth, subsidyOn]);

  const estimate = costInput ? estimateEmployerMonthlyCost(costInput) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-100">
      <header className="shrink-0 border-b border-zinc-200 bg-white/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Calculator className="h-7 w-7" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
                고용주 도구
              </h1>
              <p className="text-[15px] text-zinc-500">
                사업자 번호 형식 확인 · 인건비 추정
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
            {employerNeedsId ? (
              <button
                type="button"
                onClick={() => setEmployerIdGateOpen(true)}
                className="text-[15px] font-semibold text-blue-600 underline"
              >
                공고 등록
              </button>
            ) : (
              <Link
                href="/employer/post"
                className="text-[15px] font-semibold text-blue-600 underline"
              >
                공고 등록
              </Link>
            )}
            <Link
              href="/login"
              className="text-[15px] font-medium text-zinc-600 underline"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-6">
        <div className="mx-auto max-w-lg space-y-10">
          <EmployerTrustNotice />

          <section aria-labelledby="brn-heading">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-zinc-700" aria-hidden />
              <h2 id="brn-heading" className="text-[20px] font-semibold text-zinc-900">
                사업자등록번호
              </h2>
            </div>
            <p className="mb-4 text-[15px] leading-relaxed text-zinc-600">
              숫자만 입력해도 됩니다. 체크섬으로 형식만 검사하며, 실제 사업자
              상태는 공공 API 연동이 필요합니다.
            </p>
            <FieldLabel id="brn-input">번호 (10자리)</FieldLabel>
            <input
              id="brn-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatKoreanBrnDisplay(brnRaw)}
              onChange={(e) => onBrnChange(e.target.value)}
              className="min-h-[60px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] tracking-wide text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
              placeholder="000-00-00000"
            />
            <div className="mt-4">
              <BigButton type="button" variant="secondary" onClick={checkBrn}>
                형식·체크섬 확인
              </BigButton>
            </div>
            {brnMessage && (
              <p
                className="mt-4 rounded-2xl bg-white px-4 py-3 text-[16px] leading-snug text-zinc-800 shadow-sm"
                role="status"
              >
                {brnMessage}
              </p>
            )}
          </section>

          <section aria-labelledby="calc-heading">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-zinc-700" aria-hidden />
              <h2 id="calc-heading" className="text-[20px] font-semibold text-zinc-900">
                인건비 추정
              </h2>
            </div>
            <p className="mb-4 text-[15px] leading-relaxed text-zinc-600">
              시급과 근무시간으로 월 급여와 고용주 부담(단순 근사)을 보여 줍니다.
              지원금은 MVP용 예시 금액입니다.
            </p>

            <div className="space-y-5">
              <div>
                <FieldLabel id="hourly">시급 (원)</FieldLabel>
                <BigNumberInput
                  id="hourly"
                  value={hourly}
                  onChange={(e) => setHourly(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel id="weekly">주 근무시간</FieldLabel>
                <BigNumberInput
                  id="weekly"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel id="wpm">월 환산 주 수</FieldLabel>
                <BigNumberInput
                  id="wpm"
                  value={weeksPerMonth}
                  onChange={(e) => setWeeksPerMonth(e.target.value)}
                />
                <p className="mt-1 text-[14px] text-zinc-500">
                  통상 약 4.345 (52주÷12개월)
                </p>
              </div>

              <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={subsidyOn}
                  onChange={(e) => setSubsidyOn(e.target.checked)}
                  className="h-6 w-6 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[17px] text-zinc-800">
                  고령자 고용 지원금(예시) 반영
                </span>
              </label>
            </div>

            {estimate && (
              <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-[15px] font-medium uppercase tracking-wide text-zinc-500">
                  월 기준 추정
                </p>
                <dl className="space-y-3 text-[17px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-600">월 급여(시급×시간)</dt>
                    <dd className="font-medium text-zinc-900">
                      {formatKrw(estimate.grossMonthlyPay)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-600">고용주 사회보험(근사)</dt>
                    <dd className="font-medium text-zinc-900">
                      +{formatKrw(estimate.employerSocialInsuranceApprox)}
                    </dd>
                  </div>
                  {estimate.seniorSubsidyExample > 0 && (
                    <div className="flex justify-between gap-4 text-blue-700">
                      <dt>예시 지원금(플레이스홀더)</dt>
                      <dd className="font-semibold">
                        −{formatKrw(estimate.seniorSubsidyExample)}
                      </dd>
                    </div>
                  )}
                  <div className="border-t border-zinc-200 pt-4">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[18px] font-semibold text-zinc-900">
                        실질 부담(추정)
                      </dt>
                      <dd className="text-[20px] font-bold text-blue-600">
                        {formatKrw(estimate.netEmployerMonthlyApprox)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            )}
          </section>
        </div>
      </div>

      <IdentityVerificationModal
        open={employerIdGateOpen}
        variant="employer_post"
        onClose={() => setEmployerIdGateOpen(false)}
      />
    </div>
  );
}
