/**
 * 회원가입 시 선택하는 계정 유형 (Supabase user metadata `account_kind` 등과 정합)
 */
export type AccountKind =
  | "employer_business"
  | "employer_informal"
  | "senior";

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  employer_business: "고용주 (사업자)",
  employer_informal: "사업자 없는 고용주",
  senior: "구직자 (시니어, 55세 이상 예정)",
};
