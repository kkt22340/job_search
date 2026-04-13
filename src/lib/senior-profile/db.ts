import {
  type SeniorProfileDraft,
  emptySeniorProfileDraft,
} from "@/domain/senior-profile";

/**
 * `senior_profiles.profile` JSONB ↔ 도메인 드래프트
 * (웹·Expo 공통 — 동일 스키마 유지)
 */
export function seniorDraftFromProfileJson(
  raw: unknown
): SeniorProfileDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;

  const base = emptySeniorProfileDraft();
  const availabilityIds = o.availabilityIds;
  const categorySlugs = o.categorySlugs;
  const tagIds = o.tagIds;

  if (!Array.isArray(availabilityIds) || !Array.isArray(categorySlugs) || !Array.isArray(tagIds)) {
    return null;
  }

  return {
    ...base,
    availabilityIds: availabilityIds.filter((x): x is string => typeof x === "string"),
    categorySlugs: categorySlugs.filter((x): x is string => typeof x === "string"),
    tagIds: tagIds.filter((x): x is string => typeof x === "string"),
    bio: typeof o.bio === "string" ? o.bio : "",
    phone: typeof o.phone === "string" ? o.phone : "",
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : base.updatedAt,
  };
}

export function seniorDraftToProfileJson(draft: SeniorProfileDraft): Record<
  string,
  unknown
> {
  return {
    version: draft.version,
    availabilityIds: draft.availabilityIds,
    categorySlugs: draft.categorySlugs,
    tagIds: draft.tagIds,
    bio: draft.bio,
    phone: draft.phone,
    updatedAt: draft.updatedAt,
  };
}
