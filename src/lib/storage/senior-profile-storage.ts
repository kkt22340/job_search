import {
  type SeniorProfileDraft,
  emptySeniorProfileDraft,
} from "@/domain/senior-profile";

const KEY = "baekgu:senior-profile-draft:v1";

/**
 * 웹: localStorage 오프라인 캐시.
 * 로그인한 시니어는 동일 키 구조를 Supabase `senior_profiles.profile` JSONB에도 저장하므로
 * Expo 앱에서는 `@supabase/supabase-js` + 동일 테이블로 읽고, 여기서는 AsyncStorage로
 * `SeniorProfileDraft`를 캐시하면 웹과 동기화된다.
 */
export type SeniorProfileStorage = {
  load: () => SeniorProfileDraft;
  save: (draft: SeniorProfileDraft) => void;
  clear: () => void;
};

function safeParse(raw: string | null): SeniorProfileDraft {
  if (!raw) return emptySeniorProfileDraft();
  try {
    const v = JSON.parse(raw) as SeniorProfileDraft;
    if (v?.version !== 1) return emptySeniorProfileDraft();
    return {
      ...emptySeniorProfileDraft(),
      ...v,
      version: 1,
    };
  } catch {
    return emptySeniorProfileDraft();
  }
}

export const webSeniorProfileStorage: SeniorProfileStorage = {
  load() {
    if (typeof window === "undefined") return emptySeniorProfileDraft();
    return safeParse(window.localStorage.getItem(KEY));
  },
  save(draft: SeniorProfileDraft) {
    if (typeof window === "undefined") return;
    const next = { ...draft, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
  },
};

/** 기본 스토리지 (웹). RN 빌드에서는 이 모듈을 래핑해 교체. */
export function getSeniorProfileStorage(): SeniorProfileStorage {
  return webSeniorProfileStorage;
}
