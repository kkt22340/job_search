"use server";

import { createClient } from "@/lib/supabase/server";

export type SetApplicationHiredResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * 고용주가 지원 건을 채용 확정으로 표시 — 이후 연락처 마스킹 해제(PRD).
 */
export async function setApplicationHiredAction(
  applicationId: string
): Promise<SetApplicationHiredResult> {
  const id = applicationId.trim();
  if (!id) {
    return { ok: false, error: "지원 정보가 없습니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "로그인이 필요해요." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "employer") {
    return { ok: false, error: "고용주만 사용할 수 있어요." };
  }

  const { data: app, error: appError } = await supabase
    .from("job_applications")
    .select("id, status, job_id")
    .eq("id", id)
    .maybeSingle();

  if (appError || !app) {
    return { ok: false, error: "지원 내역을 찾을 수 없어요." };
  }

  const { data: job, error: jobError } = await supabase
    .from("job_postings")
    .select("employer_id")
    .eq("id", app.job_id)
    .maybeSingle();

  if (jobError || !job || job.employer_id !== user.id) {
    return { ok: false, error: "권한이 없어요." };
  }

  if (app.status === "hired") {
    return { ok: true };
  }
  if (app.status === "withdrawn" || app.status === "rejected") {
    return {
      ok: false,
      error: "이 상태에서는 채용 확정으로 바꿀 수 없어요.",
    };
  }

  const { error: updateError } = await supabase
    .from("job_applications")
    .update({ status: "hired" })
    .eq("id", id);

  if (updateError) {
    return {
      ok: false,
      error: updateError.message ?? "저장에 실패했어요.",
    };
  }

  return { ok: true };
}
