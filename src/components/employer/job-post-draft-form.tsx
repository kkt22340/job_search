"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [employerName, setEmployerName] = useState("");
  const [workerPreviewName, setWorkerPreviewName] = useState("근로자(확정 전)");
  const [wageRaw, setWageRaw] = useState("");
  const [weeklyHoursRaw, setWeeklyHoursRaw] = useState("20");
  const [workplace, setWorkplace] = useState("");
  const [description, setDescription] = useState("");
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

  const belowMin =
    hourlyParsed !== null && isBelowMinimumHourlyWage(hourlyParsed);
  const insuranceHint =
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
    if (!canSubmit || hourlyParsed === null || weeklyHoursParsed === null) return;
    setFormError(null);
    setSuccessId(null);
    startTransition(async () => {
      const result = await createJobPosting({
        title: title.trim(),
        description: description.trim(),
        wageHourly: hourlyParsed,
        address: workplace.trim(),
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

        <div>
          <FieldLabel id="jp-worker-preview">근로자 이름 (미리보기용)</FieldLabel>
          <input
            id="jp-worker-preview"
            value={workerPreviewName}
            onChange={(e) => setWorkerPreviewName(e.target.value)}
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] text-zinc-900 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
          />
          <p className="mt-1 text-[14px] text-zinc-500">
            실제 채용 확정 시 본인 이름으로 바뀝니다.
          </p>
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

      {showContract && hourlyParsed !== null && weeklyHoursParsed !== null ? (
        <div className="pt-4">
          <SimpleLaborContract
            employerName={employerName || "고용주(미입력)"}
            workerName={workerPreviewName}
            hourlyWageWon={hourlyParsed}
            workplace={workplace}
            workDescription={description}
            weeklyHours={weeklyHoursParsed}
          />
        </div>
      ) : null}

      <p className="text-center text-[15px] text-zinc-500">
        <Link href="/?view=manage" className="text-blue-600 underline">
          고용주 도구로 돌아가기
        </Link>
      </p>
    </div>
  );
}
