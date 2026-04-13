/**
 * 서버 전용 — ADMIN_PLAYGROUND_ENABLED 판별.
 * "true" / "1" / "yes" (대소문자·앞뒤 공백 무시)
 */
export function isAdminPlaygroundEnabled(): boolean {
  const v = process.env.ADMIN_PLAYGROUND_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
