/**
 * 고용주 인건비·지원금 추정 (MVP).
 *
 * 정부 지원금·4대보험 요율은 수시로 개정되므로 산식·상수는 이 파일에만 둔다(PRD §14.2).
 * 적용 기준일: 2026-04-13 — 실제 영업 시 고용노동부·국세청 고시로 재검토할 것.
 */

export type EmployerCostInput = {
  /** 시급(원) */
  hourlyWage: number;
  /** 주 근무시간 */
  weeklyHours: number;
  /** 월 환산 주 수 (통상 4.345 주/월 근사) */
  weeksPerMonth: number;
  /**
   * 「고령자 고용 지원」 등 예시 지원금 반영 여부.
   * 실제 지급액·자격은 사업장·고용 형태별 상이함.
   */
  applySeniorSubsidyExample: boolean;
};

export type EmployerCostEstimate = {
  grossMonthlyPay: number;
  /** 고용주 부담 4대보험 등 단순 합산 근사치(원) */
  employerSocialInsuranceApprox: number;
  /** MVP 예시 지원금(원) — 플레이스홀더 */
  seniorSubsidyExample: number;
  /** 실질 월 인건비 추정(급여 + 사회보험 - 예시 지원) */
  netEmployerMonthlyApprox: number;
};

/**
 * 고용주 부담 국민연금·건강·고용·산재를 하나의 비율로 근사(MVP).
 * 정밀 산출은 부문별 요율·상한 적용이 필요함.
 */
const EMPLOYER_SOCIAL_INSURANCE_RATE = 0.115;

/**
 * 고령자 고용 관련 지원금 — MVP용 월환산 예시액(고정).
 * 프로덕션에서는 정책·최저임금·고용 유지 조건에 맞는 모듈로 교체.
 */
const SENIOR_SUBSIDY_MONTHLY_EXAMPLE_PLACEHOLDER = 350_000;

export function estimateEmployerMonthlyCost(
  input: EmployerCostInput
): EmployerCostEstimate {
  const gross =
    input.hourlyWage * input.weeklyHours * input.weeksPerMonth;
  const employerSocialInsuranceApprox = gross * EMPLOYER_SOCIAL_INSURANCE_RATE;
  const seniorSubsidyExample = input.applySeniorSubsidyExample
    ? SENIOR_SUBSIDY_MONTHLY_EXAMPLE_PLACEHOLDER
    : 0;
  const netEmployerMonthlyApprox =
    gross + employerSocialInsuranceApprox - seniorSubsidyExample;

  return {
    grossMonthlyPay: gross,
    employerSocialInsuranceApprox,
    seniorSubsidyExample,
    netEmployerMonthlyApprox,
  };
}

export function formatKrw(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}
