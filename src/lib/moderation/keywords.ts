/**
 * 의심 키워드 선별 — OpenAI 호출 전 1차 필터(PRD §6.4 비용 통제).
 * 실제 운영 시 목록은 운영 정책에 맞게 조정·확장한다.
 */

export type KeywordRisk = "none" | "low" | "medium" | "high";

export type KeywordScanResult = {
  risk: KeywordRisk;
  /** 매칭된 토큰(로그·디버그용, 사용자 노출 시 주의) */
  matches: string[];
};

/** high: 즉시 검수 큐. medium/low: AI 호출 여부는 파이프라인 정책에 따름 */
const HIGH: readonly string[] = [
  "다단계",
  "후원복사",
  "총판모집",
  "입금후",
  "선수수료",
  "카드깡",
  "대포통장",
  "해외배팅",
  "불법도박",
];

const MEDIUM: readonly string[] = [
  "투자",
  "레버리지",
  "마진",
  "코인",
  "리딩",
  "대출",
  "현금삽니다",
  "월천",
  "무조건수익",
  "무료체험입금",
];

const LOW: readonly string[] = [
  "재택",
  "문자발송",
  "간편결제",
  "수수료환급",
];

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function findMatches(haystack: string, needles: readonly string[]): string[] {
  const h = haystack.toLowerCase();
  const found: string[] = [];
  for (const n of needles) {
    if (h.includes(n.toLowerCase())) found.push(n);
  }
  return found;
}

export function scanSuspiciousKeywords(title: string, description: string): KeywordScanResult {
  const combined = normalize(`${title}\n${description}`);
  if (!combined) {
    return { risk: "none", matches: [] };
  }

  const high = findMatches(combined, HIGH);
  if (high.length > 0) {
    return { risk: "high", matches: high };
  }
  const med = findMatches(combined, MEDIUM);
  if (med.length > 0) {
    return { risk: "medium", matches: med };
  }
  const low = findMatches(combined, LOW);
  if (low.length > 0) {
    return { risk: "low", matches: low };
  }
  return { risk: "none", matches: [] };
}
