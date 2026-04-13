/**
 * 최저임금 — 연도별 고시에 맞춰 갱신 (고용노동부).
 * PRD: 2026년 시간당 10,300원 예상(안심 고용 시스템).
 */
export const MINIMUM_HOURLY_WAGE_KRW_2026 = 10_300;

export const MINIMUM_WAGE_EFFECTIVE_YEAR = 2026;

/**
 * 입력 문자열에서 시급 숫자만 추출·파싱. 빈값·비숫자 → null
 */
export function parseHourlyWageInput(raw: string): number | null {
  const n = parseFloat(raw.replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function isBelowMinimumHourlyWage(hourlyWage: number): boolean {
  return hourlyWage < MINIMUM_HOURLY_WAGE_KRW_2026;
}

/** 주→월 환산(근사). PRD: 월 60시간 이상 시 4대 보험 안내 */
const WEEKS_PER_MONTH_APPROX = 4.345;

export function approximateMonthlyHoursFromWeekly(weeklyHours: number): number {
  return weeklyHours * WEEKS_PER_MONTH_APPROX;
}

/** 월 소정근로시간 60시간 이상(주 근무시간 환산)일 때 안내 */
export function monthlyHoursSuggestFourInsurance(weeklyHours: number): boolean {
  if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) return false;
  return approximateMonthlyHoursFromWeekly(weeklyHours) >= 60;
}
