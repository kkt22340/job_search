import "server-only";

import { createClient } from "@/lib/supabase/server";

import { requireAdmin } from "@/lib/supabase/require-admin";

export type ModerationQueueJob = {
  id: string;
  title: string;
  description: string;
  wage_hourly: number | null;
  address: string | null;
  created_at: string;
  employer_id: string;
  employer_display_name: string | null;
  moderation_status: "pending" | "approved" | "rejected" | "needs_review";
  moderation_note: string | null;
};

export type ModerationQueueData =
  | { ok: true; jobs: ModerationQueueJob[] }
  | { ok: false; error: string; jobs: [] };

/**
 * 승인 대기·재검토 필요 공고 목록 (관리자 RLS).
 */
export async function getModerationQueueForAdmin(): Promise<ModerationQueueData> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { ok: false, error: admin.error, jobs: [] };
  }

  const supabase = await createClient();
  const { data: jobs, error } = await supabase
    .from("job_postings")
    .select(
      "id, title, description, wage_hourly, address, created_at, employer_id, moderation_status, moderation_note"
    )
    .in("moderation_status", ["pending", "needs_review"])
    .order("created_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      error: error.message ?? "목록을 불러오지 못했습니다.",
      jobs: [],
    };
  }

  const rows = (jobs ?? []) as Omit<ModerationQueueJob, "employer_display_name">[];
  const employerIds = [...new Set(rows.map((r) => r.employer_id))];
  let nameById = new Map<string, string | null>();

  if (employerIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", employerIds);

    nameById = new Map(
      (profs ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? null])
    );
  }

  const enriched: ModerationQueueJob[] = rows.map((r) => ({
    ...r,
    employer_display_name: nameById.get(r.employer_id) ?? null,
  }));

  return { ok: true, jobs: enriched };
}
