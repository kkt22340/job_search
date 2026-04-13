import type { AccountKind } from "@/domain/account-kind";

/**
 * Supabase Auth `options.data` → `raw_user_meta_data` (handle_new_user 트리거와 정합)
 */
export function buildSignupUserMetadata(params: {
  displayName: string;
  accountKind: AccountKind;
  birthYear?: string | null;
}): Record<string, unknown> {
  const { displayName, accountKind, birthYear } = params;
  const meta: Record<string, unknown> = {
    display_name: displayName.trim(),
    account_kind: accountKind,
  };

  if (accountKind === "employer_business") {
    meta.role = "employer";
    meta.employer_without_business = false;
  } else if (accountKind === "employer_informal") {
    meta.role = "employer";
    meta.employer_without_business = true;
  } else {
    meta.role = "senior";
  }

  const y = birthYear?.trim();
  if (y && /^\d{4}$/.test(y)) {
    meta.birth_year = y;
  }

  return meta;
}
