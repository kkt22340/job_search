import { NextResponse } from "next/server";

import { runModerationPipeline } from "@/lib/moderation/pipeline";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron 등에서 주기 호출 — 전량 실시간 금지, 배치만(PRD §6.4).
 * `Authorization: Bearer ${CRON_SECRET}` 필요.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 503 }
    );
  }

  const { data: jobs, error } = await supabase
    .from("job_postings")
    .select("id, title, description")
    .eq("moderation_status", "pending")
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; status: string }[] = [];

  for (const job of jobs ?? []) {
    const r = await runModerationPipeline({
      title: job.title,
      description: job.description ?? "",
    });

    const { error: upErr } = await supabase
      .from("job_postings")
      .update({
        moderation_status: r.moderation_status,
        moderation_note: r.moderation_note,
      })
      .eq("id", job.id);

    if (upErr) {
      console.error("[cron/moderate-jobs] update failed", job.id, upErr);
      continue;
    }

    const { error: logErr } = await supabase.from("job_moderation_logs").insert({
      job_id: job.id,
      source: "batch",
      ai_score: r.aiResult?.risk_score ?? null,
      flags: {
        keywordRisk: r.keywordScan.risk,
        keywordMatches: r.keywordScan.matches,
        aiCalled: r.aiCalled,
      },
      raw_model_output:
        r.aiRawText || r.aiResult
          ? { text: r.aiRawText, parsed: r.aiResult }
          : null,
    });

    if (logErr) {
      console.error("[cron/moderate-jobs] log insert failed", job.id, logErr);
    }

    results.push({ id: job.id, status: r.moderation_status });
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
