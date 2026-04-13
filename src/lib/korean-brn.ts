/**
 * 대한민국 사업자등록번호 10자리 — 형식·체크섬만 검증.
 * 실제 국세청 등록·폐업 여부는 공공 API 연동이 필요함(PRD §6.3).
 */

const WEIGHTS = [1, 3, 7, 1, 3, 7, 1, 3, 5] as const;

/** 하이픈 제거 후 10자리 숫자 문자열 */
export function normalizeKoreanBrn(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

/** 표시용 000-00-00000 */
export function formatKoreanBrnDisplay(digits: string): string {
  const n = normalizeKoreanBrn(digits);
  if (n.length <= 3) return n;
  if (n.length <= 5) return `${n.slice(0, 3)}-${n.slice(3)}`;
  return `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5)}`;
}

/**
 * 체크섬 검증 (공개된 검증식).
 * 참고: 동일 번호라도 업종·과세 유형에 따라 실제 사용 불가할 수 있음.
 */
export function isValidKoreanBrnChecksum(normalizedTenDigits: string): boolean {
  if (!/^\d{10}$/.test(normalizedTenDigits)) return false;
  const d = normalizedTenDigits.split("").map((c) => parseInt(c, 10));
  let chk = 0;
  for (let i = 0; i < 9; i++) {
    chk += WEIGHTS[i] * d[i];
  }
  chk += Math.floor((WEIGHTS[8] * d[8]) / 10);
  const expected = (10 - (chk % 10)) % 10;
  return d[9] === expected;
}

export function validateKoreanBrnInput(raw: string): {
  normalized: string;
  ok: boolean;
  reason?: "empty" | "length" | "checksum";
} {
  const normalized = normalizeKoreanBrn(raw);
  if (normalized.length === 0) {
    return { normalized, ok: false, reason: "empty" };
  }
  if (normalized.length !== 10) {
    return { normalized, ok: false, reason: "length" };
  }
  if (!isValidKoreanBrnChecksum(normalized)) {
    return { normalized, ok: false, reason: "checksum" };
  }
  return { normalized, ok: true };
}
