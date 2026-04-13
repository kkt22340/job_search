import {
  MINIMUM_HOURLY_WAGE_KRW_2026,
  MINIMUM_WAGE_EFFECTIVE_YEAR,
} from "@/lib/labor/minimum-wage";

export type SimpleLaborContractProps = {
  /** 고용주(사업주 또는 개인 고용주) 표시명 */
  employerName: string;
  /** 근로자 성명 */
  workerName: string;
  /** 시간당 임금(원) */
  hourlyWageWon: number;
  /** 근무 장소 */
  workplace: string;
  /** 업무 내용 요약 */
  workDescription: string;
  /** 주 근무시간(시간) */
  weeklyHours: number;
  /** 계약 시작일 표시 (예: 2026년 5월 1일) */
  contractStartLabel?: string;
};

/**
 * 시니어·개인 고용주용 초간단 표준 근로계약서 초안(미리보기).
 * 실제 법적 효력·서명·PDF는 추후 Smart Contract Lite 단계에서 연동.
 */
export function SimpleLaborContract({
  employerName,
  workerName,
  hourlyWageWon,
  workplace,
  workDescription,
  weeklyHours,
  contractStartLabel = "(작성일 협의)",
}: SimpleLaborContractProps) {
  const wageOk = hourlyWageWon >= MINIMUM_HOURLY_WAGE_KRW_2026;

  return (
    <article
      className="rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
      aria-label="표준 근로계약서 초안"
    >
      <header className="border-b border-zinc-200 pb-5 text-center">
        <p className="text-[15px] font-medium uppercase tracking-wide text-zinc-500">
          백구 · 안심 고용
        </p>
        <h1 className="mt-2 text-[24px] font-bold leading-tight text-zinc-900 sm:text-[26px]">
          근로계약서
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-zinc-600">
          (초안 · 앱에서 확정·서명 예정)
        </p>
      </header>

      <div className="mt-8 space-y-8 text-[19px] leading-relaxed text-zinc-900 sm:text-[20px]">
        <section>
          <h2 className="mb-3 text-[18px] font-bold text-zinc-800">
            제1조 (당사자)
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-[16px] font-semibold text-zinc-500">
                고용주
              </dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight">
                {employerName.trim() || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[16px] font-semibold text-zinc-500">
                근로자
              </dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight">
                {workerName.trim() || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-bold text-zinc-800">
            제2조 (임금)
          </h2>
          <p>
            시간당 임금은{" "}
            <strong className="text-[24px] text-blue-700">
              {hourlyWageWon.toLocaleString("ko-KR")}원
            </strong>
            으로 한다.
          </p>
          {!wageOk ? (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-[17px] font-medium text-red-800">
              {MINIMUM_WAGE_EFFECTIVE_YEAR}년 최저임금(
              {MINIMUM_HOURLY_WAGE_KRW_2026.toLocaleString("ko-KR")}원/시간) 이상으로
              조정해야 합니다.
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-bold text-zinc-800">
            제3조 (근무 장소·업무)
          </h2>
          <p className="font-medium">
            <span className="text-zinc-500">근무지 · </span>
            {workplace.trim() || "—"}
          </p>
          <p className="mt-4 whitespace-pre-wrap">
            <span className="text-zinc-500">업무 내용 · </span>
            {workDescription.trim() || "—"}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-bold text-zinc-800">
            제4조 (근로시간)
          </h2>
          <p>
            주 근로시간은{" "}
            <strong className="text-[22px]">{weeklyHours}</strong>시간으로 한다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-bold text-zinc-800">
            제5조 (계약 기간)
          </h2>
          <p className="text-[21px]">{contractStartLabel}부터 협의에 따른다.</p>
        </section>
      </div>

      <footer className="mt-10 border-t border-zinc-200 pt-6 text-[15px] leading-relaxed text-zinc-500">
        본 문서는 백구 앱에서 생성한 참고용 초안입니다. 실제 채용 시 관할 기준·
        세부 조항을 반영하고, 앱 내 서명·PDF 보관 기능이 제공되면 그때 최종
        확정합니다.
      </footer>
    </article>
  );
}
