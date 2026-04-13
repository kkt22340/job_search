"use client";

import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";

import { JobBottomSheet } from "@/components/job-bottom-sheet";
import { jobPinFromPostingRow } from "@/lib/job-pin-from-posting";
import { createClient } from "@/lib/supabase";
import type { JobPin } from "@/types/job";

type Row = {
  id: string;
  job_id: string;
  created_at: string;
  status: string;
  jobTitle: string;
  companyLabel: string;
};

const STATUS_LABEL: Record<string, string> = {
  applied: "지원됨",
  withdrawn: "철회",
  reviewing: "검토 중",
  hired: "채용 확정",
  rejected: "불합격",
};

const COPY = {
  title: "\uc9c0\uc6d0 \ud604\ud669",
  subtitle:
    "\ub0b4\uac00 \uc9c0\uc6d0\ud55c \uacf5\uace0\uc640 \uc0c1\ud0dc\ub97c \ud655\uc778\ud560 \uc218 \uc788\uc5b4\uc694.",
  tapHint:
    "\ud56d\ubaa9\uc744 \ub20c\ub7ec \uacf5\uace0 \uc0c1\uc138\ub97c \ub2e4\uc2dc \ubcfc \uc218 \uc788\uc5b4\uc694.",
  loading: "\ubd88\ub7ec\uc624\ub294 \uc911\u2026",
  empty:
    "\uc544\uc9c1 \uc9c0\uc6d0\ud55c \uacf5\uace0\uac00 \uc5c6\uc5b4\uc694. \u300c\uc54c\ubc14 \ucc3e\uae30\u300d\uc5d0\uc11c \uacf5\uace0\ub97c \ubcf4\uace0 \uc9c0\uc6d0\ud560 \uc218 \uc788\uc5b4\uc694.",
  detail: "\uc0c1\uc138 \ubcf4\uae30",
  hintLogin:
    "\ub85c\uadf8\uc778\ud558\uba74 \uc9c0\uc6d0 \ud604\ud669\uc744 \ubcfc \uc218 \uc788\uc5b4\uc694.",
  hintRole:
    "\uc2dc\ub2c8\uc5b4(\uad6c\uc9c1) \uacc4\uc815\uc5d0\uc11c\ub9cc \uc9c0\uc6d0 \ud604\ud669\uc744 \ubcfc \uc218 \uc788\uc5b4\uc694.",
  dash: "\u2014",
  companyFallback: "\ub4f1\ub85d \uc5c5\uccb4",
  titleFallback: "\uc81c\ubaa9 \uc5c6\uc74c",
} as const;

export function SeniorApplicationStatus() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pinByJobId, setPinByJobId] = useState<Map<string, JobPin>>(
    () => new Map()
  );
  const [sheetJob, setSheetJob] = useState<JobPin | null>(null);

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
          setHint(COPY.hintLogin);
          setPinByJobId(new Map());
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "senior") {
        if (!cancelled) {
          setRows([]);
          setHint(COPY.hintRole);
          setPinByJobId(new Map());
        }
        return;
      }

      const { data: apps, error } = await supabase
        .from("job_applications")
        .select("id, created_at, status, job_id")
        .eq("senior_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        if (!cancelled) {
          setRows([]);
          setHint(error.message);
          setPinByJobId(new Map());
        }
        return;
      }

      const list = apps ?? [];
      const jobIds = [...new Set(list.map((a) => a.job_id))];
      if (jobIds.length === 0) {
        if (!cancelled) {
          setHint(null);
          setRows([]);
          setPinByJobId(new Map());
        }
        return;
      }

      const { data: jobs } = await supabase
        .from("job_postings")
        .select("id, title, wage_hourly, lat, lng, address, employer_id")
        .in("id", jobIds);

      const jobRows = jobs ?? [];
      const employerIds = [
        ...new Set(jobRows.map((j) => j.employer_id as string)),
      ];
      const { data: employers } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", employerIds);

      const companyByEmployer = new Map(
        (employers ?? []).map((p) => [
          p.id as string,
          ((p.display_name as string | null) ?? "").trim(),
        ])
      );

      const pins = new Map<string, JobPin>();
      const metaById = new Map<string, { title: string; company: string }>();

      for (const j of jobRows) {
        const eid = j.employer_id as string;
        const company = companyByEmployer.get(eid) || COPY.companyFallback;
        const pin = jobPinFromPostingRow(
          {
            id: j.id as string,
            title: j.title as string | null,
            wage_hourly: j.wage_hourly as string | number | null,
            lat: j.lat as number | null,
            lng: j.lng as number | null,
            address: j.address as string | null,
          },
          company
        );
        if (pin) {
          pins.set(pin.id, pin);
        }
        metaById.set(j.id as string, {
          title: pin?.title ?? COPY.titleFallback,
          company: pin?.company ?? company,
        });
      }

      if (cancelled) return;
      setHint(null);
      setPinByJobId(pins);
      setRows(
        list.map((a) => {
          const meta = metaById.get(a.job_id) ?? {
            title: COPY.dash,
            company: COPY.dash,
          };
          return {
            id: a.id,
            job_id: a.job_id,
            created_at: a.created_at,
            status: a.status,
            jobTitle: meta.title,
            companyLabel: meta.company,
          };
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-100">
      <header className="shrink-0 border-b border-zinc-200 bg-white/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <ClipboardList className="h-7 w-7" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
              {COPY.title}
            </h1>
            <p className="text-[15px] text-zinc-500">{COPY.subtitle}</p>
            <p className="mt-2 text-[14px] leading-snug text-zinc-400">
              {COPY.tapHint}
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-6">
        <div className="mx-auto max-w-lg">
          {rows === null ? (
            <p className="text-[15px] text-zinc-500">{COPY.loading}</p>
          ) : (
            <>
              {hint ? (
                <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[15px] leading-relaxed text-zinc-600">
                  {hint}
                </p>
              ) : null}
              {rows.length === 0 && !hint ? (
                <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[15px] text-zinc-600">
                  {COPY.empty}
                </p>
              ) : null}
              {rows.length > 0 ? (
                <ul className="space-y-3">
                  {rows.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() =>
                          setSheetJob(pinByJobId.get(r.job_id) ?? null)
                        }
                      >
                        <p className="text-[16px] font-semibold text-zinc-900">
                          {r.jobTitle}
                        </p>
                        <p className="mt-1 text-[15px] text-zinc-700">
                          {r.companyLabel}
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
                        <p className="mt-2 text-[14px] font-medium text-blue-600">
                          {COPY.detail}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      </div>

      <JobBottomSheet job={sheetJob} onClose={() => setSheetJob(null)} />
    </div>
  );
}
