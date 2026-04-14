/**
 * 이력서 저장 후 다시 열 공고 시트 — sessionStorage (탭 간 공유)
 */
export const STORAGE_RESUME_RETURN_MODE = "baekgu:resume_return_mode";
export const STORAGE_OPEN_JOB_AFTER_RESUME = "baekgu:open_job_after_resume";

export type ResumeReturnPanelMode = "list" | "map" | "region";

export function setResumeReturnMode(mode: ResumeReturnPanelMode): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_RESUME_RETURN_MODE, mode);
}

export function queueOpenJobSheetAfterResume(jobId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_OPEN_JOB_AFTER_RESUME, jobId);
}

/** 이력서 저장 직후 한 번만 읽고 비움 — 복귀할 공고·패널(리스트/지도/지역) */
export function consumePendingOpenJobAfterResume(): {
  jobId: string | null;
  mode: ResumeReturnPanelMode | null;
} {
  if (typeof window === "undefined") return { jobId: null, mode: null };
  const jobId = sessionStorage.getItem(STORAGE_OPEN_JOB_AFTER_RESUME);
  const raw = sessionStorage.getItem(STORAGE_RESUME_RETURN_MODE);
  if (jobId) sessionStorage.removeItem(STORAGE_OPEN_JOB_AFTER_RESUME);
  if (raw) sessionStorage.removeItem(STORAGE_RESUME_RETURN_MODE);
  const mode =
    raw === "list" || raw === "map" || raw === "region" ? raw : null;
  return {
    jobId: jobId?.trim() || null,
    mode,
  };
}
