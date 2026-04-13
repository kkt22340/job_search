"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase";

type Row = {
  id: string;
  created_at: string;
  status: string;
  jobTitle: string;
  seniorLabel: string;
};

const STATUS_LABEL: Record<string, string> = {
  applied: "지원됨",
  withdrawn: "철회",
  reviewing: "검토 중",
  hired: "채용 확정",
  rejected: "불합격",
};

/**
 * 내 공고에 달린 지원 목록 (고용주·RLS).
 */
export function EmployerReceivedApplications() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setRows([]);
          setHint("로그인하면 등록한 공고에 들어온 지원을 볼 수 있어요.");
        }
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "employer") {
        if (!cancelled) {
          setRows([]);
          setHint("고용주 계정에서만 지원 목록을 볼 수 있어요.");
        }
        return;
      }

      const { data: jobs } = await supabase
        .from("job_postings")
        .select("id, title")
        .eq("employer_id", user.id);

      const jobList = jobs ?? [];
      const jobIds = jobList.map((j) => j.id);
      const titleByJob = new Map(
        jobList.map((j) => [j.id, j.title?.trim() || "제목 없음"])
      );

      if (jobIds.length === 0) {
        if (!cancelled) {
          setRows([]);
          setHint("등록한 공고가 없어요. 공고를 올리면 지원이 여기에 표시돼요.");
        }
        return;
      }

      const { data: apps, error } = await supabase
        .from("job_applications")
        .select("id, created_at, status, job_id, senior_id")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (error) {
        if (!cancelled) {
          setRows([]);
          setHint(error.message);
        }
        return;
      }

      const list = apps ?? [];
      const seniorIds = [...new Set(list.map((a) => a.senior_id))];
      const { data: seniors } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", seniorIds);

      const nameBySenior = new Map(
        (seniors ?? []).map((s) => [
          s.id,
          (s.display_name as string | null)?.trim() || "이름 미등록",
        ])
      );

      if (cancelled) return;

      setHint(null);
      setRows(
        list.map((a) => ({
          id: a.id,
          created_at: a.created_at,
          status: a.status,
          jobTitle: titleByJob.get(a.job_id) ?? "—",
          seniorLabel: nameBySenior.get(a.senior_id) ?? "지원자",
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="recv-apps-heading">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-6 w-6 text-zinc-700" aria-hidden />
        <h2 id="recv-apps-heading" className="text-[20px] font-semibold text-zinc-900">
          받은 지원
        </h2>
      </div>
      {rows === null ? (
        <p className="text-[15px] text-zinc-500">불러오는 중…</p>
      ) : (
        <>
          {hint ? (
            <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[15px] leading-relaxed text-zinc-600">
              {hint}
            </p>
          ) : null}
          {rows.length === 0 && !hint ? (
            <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[15px] text-zinc-600">
              아직 지원이 없어요. 공고가 승인·노출되면 시니어가 지원할 수 있어요.
            </p>
          ) : null}
          {rows.length > 0 ? (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                >
                  <p className="text-[16px] font-semibold text-zinc-900">
                    {r.jobTitle}
                  </p>
                  <p className="mt-1 text-[15px] text-zinc-700">
                    지원자: {r.seniorLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-zinc-500">
                    <span>
                      {new Date(r.created_at).toLocaleString("ko-KR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700">
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
