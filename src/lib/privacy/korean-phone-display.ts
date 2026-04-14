/**
 * PRD: 채용 확정 전 연락처 마스킹 (예: 010-****-1234).
 * 국내 휴대폰(로컬 11자리 010…) 기준.
 */

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/** 표시용 하이픈 포함 (010-1234-5678) */
export function formatKoreanMobileLocal(
  phone: string | null | undefined
): string {
  const d = digitsOnly(phone ?? "");
  if (d.length === 11 && d.startsWith("010")) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10 && d.startsWith("10")) {
    const e = `0${d}`;
    return `${e.slice(0, 3)}-${e.slice(3, 6)}-${e.slice(6)}`;
  }
  if (d.length >= 8) {
    return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
  }
  return phone?.trim() || "등록된 번호 없음";
}

/** 마스킹된 한 줄 (가운데 숨김) */
export function maskKoreanMobileLocal(
  phone: string | null | undefined
): string {
  const d = digitsOnly(phone ?? "");
  if (d.length === 11 && d.startsWith("010")) {
    return `010-****-${d.slice(-4)}`;
  }
  if (d.length === 10 && d.startsWith("10")) {
    const e = `0${d}`;
    return `${e.slice(0, 3)}-****-${e.slice(-4)}`;
  }
  if (d.length >= 8) {
    return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
  }
  if (!phone?.trim()) {
    return "등록된 번호 없음";
  }
  return "****";
}

export function employerApplicantContactDisplay(params: {
  phone: string | null | undefined;
  applicationStatus: string;
}): { primary: string; secondary: string | null } {
  const hired = params.applicationStatus === "hired";
  if (hired) {
    return {
      primary: `연락처: ${formatKoreanMobileLocal(params.phone)}`,
      secondary: null,
    };
  }
  return {
    primary: `연락처: ${maskKoreanMobileLocal(params.phone)}`,
    secondary: "채용 확정 전에는 가운데 번호가 가려져요.",
  };
}
