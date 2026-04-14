"use client";

import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { createJobPosting } from "@/app/(main)/employer/post/actions";
import { SimpleLaborContract } from "@/components/contract/simple-labor-contract";
import { BigButton } from "@/components/ui/big-button";
import {
  MINIMUM_HOURLY_WAGE_KRW_2026,
  MINIMUM_WAGE_EFFECTIVE_YEAR,
  isBelowMinimumHourlyWage,
  parseHourlyWageInput,
  monthlyHoursSuggestFourInsurance,
} from "@/lib/labor/minimum-wage";

function formatDateLabel(dateIso: string): string {
  const s = dateIso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s || "(작성일 협의)";
  const [y, m, d] = s.split("-");
  const mm = String(Number(m));
  const dd = String(Number(d));
  return `${y}년 ${mm}월 ${dd}일`;
}

function FieldLabel({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
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

/**
 * 공고 등록 — 최저임금 검증 후 Supabase `job_postings` 저장(검수 대기).
 */
export function JobPostDraftForm() {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [workPeriod, setWorkPeriod] = useState<"one_off" | "short" | "long">("short");
  const [employerName, setEmployerName] = useState("");
  const [wageRaw, setWageRaw] = useState("");
  const [weeklyHoursRaw, setWeeklyHoursRaw] = useState("20");
  const [oneOffHoursRaw, setOneOffHoursRaw] = useState("8");
  const [workplace, setWorkplace] = useState("");
  const [description, setDescription] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const [showContract, setShowContract] = useState(false);
  const [showTaxGuide, setShowTaxGuide] = useState(false);
  const [showLegal, setShowLegal] = useState(true);

  const hourlyParsed = useMemo(
    () => parseHourlyWageInput(wageRaw),
    [wageRaw]
  );
  const weeklyHoursParsed = useMemo(() => {
    const n = parseFloat(weeklyHoursRaw.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [weeklyHoursRaw]);
  const oneOffHoursParsed = useMemo(() => {
    const n = parseFloat(oneOffHoursRaw.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [oneOffHoursRaw]);

  const belowMin =
    hourlyParsed !== null && isBelowMinimumHourlyWage(hourlyParsed);
  const insuranceHint =
    workPeriod === "long" &&
    weeklyHoursParsed !== null &&
    monthlyHoursSuggestFourInsurance(weeklyHoursParsed);

  const canSubmit =
    title.trim().length > 0 &&
    hourlyParsed !== null &&
    !belowMin &&
    workplace.trim().length > 0 &&
    description.trim().length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || hourlyParsed === null) return;
    if (workPeriod === "long" && weeklyHoursParsed === null) return;
    if (workPeriod === "one_off" && oneOffHoursParsed === null) return;
    setFormError(null);
    setSuccessId(null);
    startTransition(async () => {
      const result = await createJobPosting({
        title: title.trim(),
        description: description.trim(),
        wageHourly: hourlyParsed,
        address: workplace.trim(),
        workPeriod,
        workStartDate: workStartDate || undefined,
        workEndDate: workEndDate || undefined,
      });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setSuccessId(result.jobId);
      setTitle("");
      setDescription("");
      setWageRaw("");
      setWorkplace("");
    });
  };

  return (
    <div className="space-y-8">
      {showLegal ? (
        <section
          aria-labelledby="legal-guide-heading"
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm"
        >
          <h2
            id="legal-guide-heading"
            className="text-[18px] font-semibold text-zinc-900"
          >
            법적 안내 (필독)
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-[16px] leading-relaxed text-zinc-700">
            <li>
              {MINIMUM_WAGE_EFFECTIVE_YEAR}년 시간당 최저임금{" "}
              <strong>
                {MINIMUM_HOURLY_WAGE_KRW_2026.toLocaleString("ko-KR")}원
              </strong>
              미만으로는 공고를 올릴 수 없어요.
            </li>
            <li>
              월 소정근로시간이 60시간 이상이 될 만큼 길게 적으면(주 근무시간을
              환산) 4대 보험 가입 대상일 수 있다는 안내를 드려요.
            </li>
            <li>
              개인 고용주는 근로계약·세무(예: 원천징수)를 반드시 확인하세요.
              아래 가이드를 펼쳐 보세요.
            </li>
          </ul>
          <button
            type="button"
            onClick={() => setShowTaxGuide((v) => !v)}
            className="mt-4 flex min-h-[48px] w-full items-center justify-between rounded-xl bg-zinc-100 px-4 text-left text-[16px] font-medium text-zinc-900"
          >
            개인 고용 세무 초간단 가이드
            {showTaxGuide ? (
              <ChevronUp className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0" aria-hidden />
            )}
          </button>
          {showTaxGuide ? (
            <div className="mt-3 rounded-xl bg-amber-50/90 px-4 py-3 text-[15px] leading-relaxed text-amber-950">
              <p>
                사업자가 아닌 개인 고용(가사·일용 등)은 소득 유형에 따라
                사업소득·기타소득으로 신고하는 경우가 많고, 일부는{" "}
                <strong>3.3% 원천징수</strong> 후 지급하는 방식이 쓰이기도
                합니다. 실제 세액·신고는 국세청 안내·세무 전문가 상담을
                권장합니다. 백구는 법률·세무 자문을 제공하지 않습니다.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <FieldLabel id="jp-title">공고 제목</FieldLabel>
          <input
            id="jp-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 편의점 야간 계산·진열"
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
        </div>

        <div>
          <FieldLabel id="jp-period">아르바이트 기간</FieldLabel>
          <div
            id="jp-period"
            className="grid grid-cols-3 gap-2 rounded-2xl bg-zinc-100 p-2"
          >
            {(
              [
                { id: "one_off", label: "일회성", sub: "하루·1회" },
                { id: "short", label: "단기", sub: "수일~수주" },
                { id: "long", label: "장기", sub: "1개월+" },
              ] as const
            ).map((opt) => {
              const on = workPeriod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWorkPeriod(opt.id)}
                  className={`min-h-[64px] rounded-2xl border-2 px-3 py-3 text-left transition-colors ${
                    on
                      ? "border-blue-500 bg-white text-blue-900"
                      : "border-transparent bg-transparent text-zinc-800 hover:bg-white/70"
                  }`}
                  aria-pressed={on}
                >
                  <div className="text-[16px] font-semibold leading-tight">
                    {opt.label}
                  </div>
                  <div className="mt-1 text-[13px] text-zinc-500">{opt.sub}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
            단기·일회성 공고도 적극 노출할 수 있도록, 기간 성격을 먼저 골라 주세요.
          </p>
        </div>

        <section aria-labelledby="jp-schedule-heading" className="rounded-2xl border-2 border-zinc-200 bg-white px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="jp-schedule-heading" className="text-[17px] font-semibold text-zinc-900">
                구체적인 근무일 (선택)
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-zinc-500">
                클릭하면 달력이 열려요. 일회성 공고는 근무일을 1개 선택하는 걸 권장해요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSchedule((v) => !v)}
              className="shrink-0 inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 text-[14px] font-semibold text-zinc-800 active:bg-zinc-100"
              aria-expanded={showSchedule}
            >
              <CalendarDays className="h-5 w-5" aria-hidden />
              {showSchedule ? "닫기" : "달력 열기"}
            </button>
          </div>

          {showSchedule ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[15px] font-medium text-zinc-700">
                  {workPeriod === "one_off" ? "근무일" : "시작일"}
                </span>
                <input
                  type="date"
                  value={workStartDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setWorkStartDate(v);
                    if (workPeriod === "one_off") setWorkEndDate(v);
                  }}
                  className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[16px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
                />
              </label>
              {workPeriod === "one_off" ? null : (
                <label className="block">
                  <span className="mb-2 block text-[15px] font-medium text-zinc-700">
                    종료일 (선택)
                  </span>
                  <input
                    type="date"
                    value={workEndDate}
                    onChange={(e) => setWorkEndDate(e.target.value)}
                    min={workStartDate || undefined}
                    className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[16px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
                  />
                </label>
              )}
            </div>
          ) : null}
        </section>

        <div>
          <FieldLabel id="jp-employer">고용주 표시명 (계약서 상단)</FieldLabel>
          <input
            id="jp-employer"
            value={employerName}
            onChange={(e) => setEmployerName(e.target.value)}
            placeholder="상호 또는 성함"
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
        </div>

        <div>
          <FieldLabel id="jp-wage">시급 (원)</FieldLabel>
          <input
            id="jp-wage"
            inputMode="numeric"
            value={wageRaw}
            onChange={(e) => setWageRaw(e.target.value)}
            placeholder={`최저 ${MINIMUM_HOURLY_WAGE_KRW_2026.toLocaleString("ko-KR")}원 이상`}
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
          {hourlyParsed !== null && belowMin ? (
            <p
              className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-[16px] font-medium text-red-800"
              role="alert"
            >
              {MINIMUM_WAGE_EFFECTIVE_YEAR}년 최저임금{" "}
              {MINIMUM_HOURLY_WAGE_KRW_2026.toLocaleString("ko-KR")}원/시간
              미만입니다. 인상 후 등록할 수 있어요.
            </p>
          ) : null}
        </div>

        {workPeriod === "long" ? (
          <div>
            <FieldLabel id="jp-hours">주 근무시간 (시간)</FieldLabel>
            <input
              id="jp-hours"
              inputMode="decimal"
              value={weeklyHoursRaw}
              onChange={(e) => setWeeklyHoursRaw(e.target.value)}
              className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
            />
            {insuranceHint ? (
              <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-[15px] leading-relaxed text-blue-950">
                환산 시 월 근로시간이 60시간 이상에 가깝습니다.{" "}
                <strong>4대 보험 가입 대상일 수 있습니다</strong>. 실제로는
                고용·소득 형태에 따라 달라져요.
              </p>
            ) : null}
          </div>
        ) : workPeriod === "one_off" ? (
          <div>
            <FieldLabel id="jp-oneoff-hours">총 근무시간 (시간)</FieldLabel>
            <input
              id="jp-oneoff-hours"
              inputMode="decimal"
              value={oneOffHoursRaw}
              onChange={(e) => setOneOffHoursRaw(e.target.value)}
              className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
            />
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
              일회성은 “주 근무시간” 대신 하루(1회) 기준 총 시간을 적는 게 자연스러워요.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] leading-relaxed text-zinc-600">
            단기 공고는 주 근무시간이 꼭 필요하지 않아요. 아래 “업무 내용”에 근무시간대를 적어 주세요.
          </div>
        )}

        <div>
          <FieldLabel id="jp-place">근무지</FieldLabel>
          <input
            id="jp-place"
            required
            value={workplace}
            onChange={(e) => setWorkplace(e.target.value)}
            placeholder="주소 또는 건물명"
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
            도로명·지번 등 검색 가능한 주소를 넣으면 서버에서 좌표로 변환해 지도
            핀에 반영해요. 서버에 카카오 REST API 키가 없으면 안내 구역 기본
            좌표를 씁니다.
          </p>
        </div>

        <div>
          <FieldLabel id="jp-desc">업무 내용</FieldLabel>
          <textarea
            id="jp-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="구체적으로 적을수록 근로계약서 초안에 잘 반영돼요."
            className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
        </div>

        {formError ? (
          <div
            className="rounded-2xl bg-red-50 px-4 py-3 text-[15px] leading-relaxed text-red-900"
            role="alert"
          >
            {formError}
            {formError.includes("로그인") ? (
              <span className="mt-2 block">
                <Link href="/login" className="font-semibold text-blue-700 underline">
                  로그인 페이지로 이동
                </Link>
              </span>
            ) : null}
          </div>
        ) : null}

        {successId ? (
          <div
            className="rounded-2xl bg-emerald-50 px-4 py-3 text-[15px] leading-relaxed text-emerald-950"
            role="status"
          >
            등록되었어요. 검수 승인 후 지도에 표시됩니다. (고용주 본인은 목록에서
            확인 가능)
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BigButton type="submit" disabled={!canSubmit || pending}>
            {pending ? "저장 중…" : "공고 등록하기"}
          </BigButton>
          <button
            type="button"
            onClick={() => setShowContract((v) => !v)}
            className="min-h-[52px] rounded-2xl border-2 border-zinc-300 bg-white px-5 text-[16px] font-semibold text-zinc-800"
          >
            {showContract ? "계약서 초안 접기" : "표준 근로계약서 초안 보기"}
          </button>
        </div>
        {!canSubmit ? (
          <p className="text-[15px] text-zinc-500">
            제목·시급(최저임금 이상)·근무지·업무 내용을 채우면 등록할 수 있어요.
          </p>
        ) : null}
      </form>

      {showContract ? (
        workPeriod !== "long" ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-[15px] leading-relaxed text-zinc-600">
            표준 근로계약서 초안은 장기(주 근무시간 기반) 공고에서만 미리보기가 지원돼요.
            단기·일회성은 실제 채용 확정 시 일정에 맞춰 계약서를 작성하게 됩니다.
          </div>
        ) : hourlyParsed !== null && weeklyHoursParsed !== null ? (
          <div className="pt-4">
            <SimpleLaborContract
              employerName={employerName || "고용주(미입력)"}
              workerName={"지원자(미정)"}
              hourlyWageWon={hourlyParsed}
              workplace={workplace}
              workDescription={description}
              weeklyHours={weeklyHoursParsed}
              contractStartLabel={formatDateLabel(workStartDate)}
            />
          </div>
        ) : null
      ) : null}

      <p className="text-center text-[15px] text-zinc-500">
        <Link href="/?view=manage" className="text-blue-600 underline">
          고용주 도구로 돌아가기
        </Link>
      </p>
    </div>
  );
}
