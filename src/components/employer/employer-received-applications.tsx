"use client";

import { Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { loadEmployerApplicationsList } from "@/app/(main)/actions/employer-applications-list";
import { setApplicationHiredAction } from "@/app/(main)/actions/set-application-hired";
import { BigButton } from "@/components/ui/big-button";

type Row = {
  id: string;
  created_at: string;
  status: string;
  jobTitle: string;
  seniorLabel: string;
  contactPrimary: string;
  contactSecondary: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  applied: "지원됨",
  withdrawn: "철회",
  reviewing: "검토 중",
  hired: "채용 확정",
  rejected: "불합격",
};

function canMarkHired(status: string) {
  return status === "applied" || status === "reviewing";
}

/**
 * 내 공고에 달린 지원 목록 (고용주·RLS).
 */
export function EmployerReceivedApplications() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hiringId, setHiringId] = useState<string | null>(null);
  const [hireError, setHireError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const result = await loadEmployerApplicationsList();
      if (!result.ok) {
        setRows([]);
        setHint(result.error);
        return;
      }
      setHint(result.hint);
      setRows(result.rows);
    } catch (e) {
      setRows([]);
      setHint(
        e instanceof Error
          ? e.message
          : "불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요."
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadList();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadList]);

  async function onMarkHired(applicationId: string) {
    setHireError(null);
    setHiringId(applicationId);
    const res = await setApplicationHiredAction(applicationId);
    setHiringId(null);
    if (!res.ok) {
      setHireError(res.error);
      return;
    }
    await loadList();
  }

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
          {hireError ? (
            <p
              className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-900"
              role="alert"
            >
              {hireError}
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
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-800">
                    {r.contactPrimary}
                  </p>
                  {r.contactSecondary ? (
                    <p className="mt-1 text-[14px] leading-relaxed text-zinc-500">
                      {r.contactSecondary}
                    </p>
                  ) : null}
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
                  {canMarkHired(r.status) ? (
                    <div className="mt-4">
                      <BigButton
                        type="button"
                        variant="secondary"
                        disabled={hiringId === r.id}
                        onClick={() => void onMarkHired(r.id)}
                      >
                        {hiringId === r.id
                          ? "처리 중…"
                          : "채용 확정 (연락처 전체 공개)"}
                      </BigButton>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
