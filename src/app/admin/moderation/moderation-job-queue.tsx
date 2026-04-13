"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  approveJobPostingAction,
  rejectJobPostingAction,
} from "./moderation-queue-actions";
import type { ModerationQueueJob } from "./moderation-queue-data";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function statusLabel(s: ModerationQueueJob["moderation_status"]) {
  if (s === "pending") return "대기";
  if (s === "needs_review") return "재검토";
  return s;
}

export function ModerationJobQueue({ jobs }: { jobs: ModerationQueueJob[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rejectNoteById, setRejectNoteById] = useState<Record<string, string>>(
    {}
  );

  async function onApprove(id: string) {
    setMessage(null);
    setBusyId(id);
    const r = await approveJobPostingAction(id);
    setBusyId(null);
    if (!r.ok) {
      setMessage(r.error);
      return;
    }
    router.refresh();
  }

  async function onReject(id: string) {
    setMessage(null);
    setBusyId(id);
    const r = await rejectJobPostingAction({
      jobId: id,
      note: rejectNoteById[id],
    });
    setBusyId(null);
    if (!r.ok) {
      setMessage(r.error);
      return;
    }
    router.refresh();
  }

  if (jobs.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-[16px] text-zinc-600">
        승인 대기 또는 재검토 상태인 공고가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">
          {message}
        </p>
      )}
      <ul className="space-y-4">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[13px] font-medium text-amber-900">
                    {statusLabel(job.moderation_status)}
                  </span>
                  <span className="text-[14px] text-zinc-500">
                    {formatDate(job.created_at)}
                  </span>
                </div>
                <h3 className="mt-2 text-[18px] font-semibold text-zinc-900">
                  {job.title}
                </h3>
                <p className="mt-1 text-[14px] text-zinc-600">
                  고용주:{" "}
                  {job.employer_display_name?.trim() || "이름 미등록"} · 시급{" "}
                  {job.wage_hourly != null && Number.isFinite(Number(job.wage_hourly))
                    ? `${Math.round(Number(job.wage_hourly)).toLocaleString("ko-KR")}원`
                    : "—"}
                </p>
                {job.address ? (
                  <p className="mt-1 text-[14px] text-zinc-500">{job.address}</p>
                ) : null}
                {job.moderation_note ? (
                  <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-[14px] text-zinc-700">
                    메모: {job.moderation_note}
                  </p>
                ) : null}
                <details className="mt-3">
                  <summary className="cursor-pointer text-[15px] font-medium text-zinc-700">
                    업무 내용 보기
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700">
                    {job.description}
                  </p>
                </details>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
                <button
                  type="button"
                  disabled={busyId === job.id}
                  onClick={() => onApprove(job.id)}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                >
                  {busyId === job.id ? "처리 중…" : "승인"}
                </button>
                <textarea
                  placeholder="반려 사유 (선택)"
                  value={rejectNoteById[job.id] ?? ""}
                  onChange={(e) =>
                    setRejectNoteById((prev) => ({
                      ...prev,
                      [job.id]: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-[15px] text-zinc-900 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  disabled={busyId === job.id}
                  onClick={() => onReject(job.id)}
                  className="rounded-xl border-2 border-red-300 bg-white px-4 py-3 text-[16px] font-semibold text-red-800 transition-colors hover:bg-red-50 disabled:opacity-40"
                >
                  반려
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
