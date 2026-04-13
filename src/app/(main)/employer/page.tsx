import { redirect } from "next/navigation";

import { MAIN_HOME_WITH_MANAGE_TAB } from "@/platform/routes";

/** 북마크 `/employer` → 단일 메인 셸의 고용주 탭 */
export default function EmployerPage() {
  redirect(MAIN_HOME_WITH_MANAGE_TAB);
}
