import { redirect } from "next/navigation";

import { MAIN_HOME_WITH_RESUME_TAB } from "@/platform/routes";

/** 북마크 `/resume` → 단일 메인 셸의 이력서 탭 */
export default function ResumePage() {
  redirect(MAIN_HOME_WITH_RESUME_TAB);
}
