/**
 * 본인인증 게이트 — 유료 PASS/SMS 연동 시에만 실제 검증.
 * `NEXT_PUBLIC_SKIP_IDENTITY_GATE=true` 이면 서버·UI 모두 건너뜀(로컬·비용 절약).
 */
export function skipIdentityGate(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_IDENTITY_GATE === "true";
}
