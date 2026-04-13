/**
 * 시니어 간편 프로필 — Supabase `senior_profiles.profile` JSONB 및
 * 향후 React Native(Expo)에서 동일 구조로 재사용하기 위한 순수 타입.
 */
export const SENIOR_PROFILE_VERSION = 1 as const;

export type SeniorProfileDraft = {
  version: typeof SENIOR_PROFILE_VERSION;
  /** 근무 가능 시간대 id (아이콘 선택) */
  availabilityIds: string[];
  /** 관심 카테고리 slug 등 */
  categorySlugs: string[];
  /** 예: desk | stamina | drive */
  tagIds: string[];
  /** 한 줄 소개 (선택) */
  bio: string;
  /** 연락처 — 서버/앱에서는 마스킹·MFA 정책 적용 (클라이언트 임시 저장용) */
  phone: string;
  updatedAt: string;
};

export function emptySeniorProfileDraft(): SeniorProfileDraft {
  return {
    version: SENIOR_PROFILE_VERSION,
    availabilityIds: [],
    categorySlugs: [],
    tagIds: [],
    bio: "",
    phone: "",
    updatedAt: new Date(0).toISOString(),
  };
}

/** UI 옵션 — DB enum과 별도로 표시용 (앱에서도 동일 상수 import) */
export const AVAILABILITY_OPTIONS = [
  { id: "weekday-am", label: "평일 오전", icon: "Sunrise" as const },
  { id: "weekday-pm", label: "평일 오후", icon: "Sun" as const },
  { id: "weekend", label: "주말", icon: "Calendar" as const },
  { id: "flex", label: "협의 가능", icon: "MessageCircle" as const },
] as const;

export const CATEGORY_OPTIONS = [
  { slug: "life-service", label: "생활 서비스", icon: "Store" as const },
  { slug: "pro-edu", label: "전문/교육", icon: "GraduationCap" as const },
  { slug: "public-care", label: "공공/돌봄", icon: "HeartHandshake" as const },
  { slug: "digital-new", label: "디지털/신규", icon: "Monitor" as const },
] as const;

export const TAG_OPTIONS = [
  { id: "desk", label: "주로 앉아서", icon: "Armchair" as const },
  { id: "stamina", label: "어느 정도 체력", icon: "Footprints" as const },
  { id: "drive", label: "운전 가능", icon: "Car" as const },
] as const;
