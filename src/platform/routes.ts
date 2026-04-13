/**
 * 웹 Next.js 경로와 향후 Expo Router 경로를 맞추기 위한 단일 출처.
 * 앱 프로젝트에서는 동일 문자열로 Stack/Tab 구성하면 됨.
 */
export const ROUTES = {
  home: "/",
  resume: "/resume",
  employer: "/employer",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** 메인 화면 탭 — 한 페이지에서 지도·이력서·고용주 전환 시 라우트 전체 교체 없이 사용 */
export type MainTab = "jobs" | "resume" | "applications" | "manage" | "inbox";

/** URL 동기화: `/?view=resume` 등으로 탭 북마크·공유 */
export const MAIN_VIEW_QUERY = "view" as const;
export const MAIN_VIEW_RESUME = "resume" as const;
export const MAIN_VIEW_APPLICATIONS = "applications" as const;
export const MAIN_VIEW_MANAGE = "manage" as const;
export const MAIN_VIEW_INBOX = "inbox" as const;
export const MAIN_HOME_WITH_RESUME_TAB = `/?${MAIN_VIEW_QUERY}=${MAIN_VIEW_RESUME}` as const;
export const MAIN_HOME_WITH_APPLICATIONS_TAB =
  `/?${MAIN_VIEW_QUERY}=${MAIN_VIEW_APPLICATIONS}` as const;
export const MAIN_HOME_WITH_MANAGE_TAB =
  `/?${MAIN_VIEW_QUERY}=${MAIN_VIEW_MANAGE}` as const;
export const MAIN_HOME_WITH_INBOX_TAB =
  `/?${MAIN_VIEW_QUERY}=${MAIN_VIEW_INBOX}` as const;
