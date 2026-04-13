/**
 * 휴대폰 OTP(SMS) — Supabase Phone provider + 통신비 발생 시 활성화.
 * false 이면 UI 만 노출하고 실제 발송·인증은 하지 않음(이메일 가입 사용).
 */
export const isPhoneAuthEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_PHONE_AUTH_ENABLED === "true";
