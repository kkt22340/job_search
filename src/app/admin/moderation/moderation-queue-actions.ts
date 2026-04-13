"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export type ModerationMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function approveJobPostingAction(
  jobId: string
): Promise<ModerationMutationResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const id = jobId.trim();
  if (!id) {
    return { ok: false, error: "공고 ID가 없습니다." };
  }

  const supabase = await createClient();

  const { data: updated, error: updateError } = await supabase
    .from("job_postings")
    .update({
      moderation_status: "approved",
      moderation_note: null,
    })
    .eq("id", id)
    .in("moderation_status", ["pending", "needs_review"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: updateError.message ?? "승인 처리에 실패했습니다." };
  }
  if (!updated) {
    return {
      ok: false,
      error: "해당 공고를 찾을 수 없거나 이미 처리되었습니다.",
    };
  }

  const { error: logError } = await supabase.from("job_moderation_logs").insert({
    job_id: id,
    source: "admin_ui",
    reviewed_by: admin.userId,
    flags: { action: "approve" },
  });

  if (logError) {
    console.warn("[approveJobPostingAction] log insert:", logError.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/moderation");

  return { ok: true };
}

export async function rejectJobPostingAction(input: {
  jobId: string;
  note?: string;
}): Promise<ModerationMutationResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const id = input.jobId.trim();
  if (!id) {
    return { ok: false, error: "공고 ID가 없습니다." };
  }

  const note = (input.note ?? "").trim() || null;

  const supabase = await createClient();

  const { data: updated, error: updateError } = await supabase
    .from("job_postings")
    .update({
      moderation_status: "rejected",
      moderation_note: note,
    })
    .eq("id", id)
    .in("moderation_status", ["pending", "needs_review"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: updateError.message ?? "반려 처리에 실패했습니다." };
  }
  if (!updated) {
    return {
      ok: false,
      error: "해당 공고를 찾을 수 없거나 이미 처리되었습니다.",
    };
  }

  const { error: logError } = await supabase.from("job_moderation_logs").insert({
    job_id: id,
    source: "admin_ui",
    reviewed_by: admin.userId,
    flags: { action: "reject", note },
  });

  if (logError) {
    console.warn("[rejectJobPostingAction] log insert:", logError.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/moderation");

  return { ok: true };
}
