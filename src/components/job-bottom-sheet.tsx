"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { applyToJobAction } from "@/app/(main)/actions/apply-to-job";
import { JobTrustBadges } from "@/components/job/job-trust-badges";
import { MAIN_HOME_WITH_RESUME_TAB } from "@/platform/routes";
import { createClient } from "@/lib/supabase";
import type { JobPin } from "@/types/job";

type Props = {
  job: JobPin | null;
  onClose: () => void;
  onApplyStateChange?: () => void;
};

type ApplyUiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "anon" }
  | { kind: "not_senior" }
  | { kind: "can_apply" }
  | { kind: "already" }
  | { kind: "error"; message: string };

export function JobBottomSheet({ job, onClose, onApplyStateChange }: Props) {
  const open = job !== null;
  const [applyUi, setApplyUi] = useState<ApplyUiState>({ kind: "idle" });
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!job) {
      setApplyUi({ kind: "idle" });
      setApplyMessage(null);
      return;
    }

    let cancelled = false;
    setApplyUi({ kind: "loading" });
    setApplyMessage(null);

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setApplyUi({ kind: "anon" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.role !== "senior") {
        setApplyUi({ kind: "not_senior" });
        return;
      }
      const { data: existing } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("senior_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        setApplyUi({ kind: "already" });
        return;
      }
      setApplyUi({ kind: "can_apply" });
    })().catch(() => {
      if (!cancelled) setApplyUi({ kind: "error", message: "상태를 불러오지 못했어요." });
    });

    return () => {
      cancelled = true;
    };
  }, [job?.id]);

  const onApply = () => {
    if (!job) return;
    setApplyMessage(null);
    startTransition(async () => {
      const result = await applyToJobAction(job.id);
      if (result.ok) {
        setApplyUi({ kind: "already" });
        setApplyMessage("지원이 접수되었어요.");
        onApplyStateChange?.();
        return;
      }
      if (result.error.includes("이미 지원")) {
        setApplyUi({ kind: "already" });
        setApplyMessage(null);
        onApplyStateChange?.();
        return;
      }
      setApplyMessage(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-300 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[min(58vh,560px)] rounded-t-[1.25rem] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={job ? "job-sheet-title" : undefined}
        aria-hidden={!open}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-14 rounded-full bg-zinc-300" aria-hidden />
        </div>

        <div className="max-h-[calc(min(58vh,560px)-3rem)] overflow-y-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
          {job ? (
            <div className="flex flex-col gap-4">
              {job.category ? (
                <span className="inline-flex w-fit rounded-full bg-zinc-100 px-3 py-1 text-[15px] font-medium text-zinc-600">
                  {job.category}
                </span>
              ) : null}
              <div>
                <p className="text-[15px] font-medium text-zinc-500">
                  {job.company}
                </p>
                <h2
                  id="job-sheet-title"
                  className="mt-1 text-[22px] font-semibold leading-snug tracking-tight text-zinc-900"
                >
                  {job.title}
                </h2>
                <div className="mt-2">
                  <JobTrustBadges job={job} />
                </div>
              </div>
              <p className="text-[20px] font-semibold text-blue-600">
                {job.wageLabel}
              </p>
              <p className="text-[17px] leading-relaxed text-zinc-600">
                {job.address}
              </p>
              <p className="text-[15px] text-zinc-400">
                일자리 위치는 참고용 정보입니다. 지원·채용은 정보 제공을
                바탕으로 진행됩니다.
              </p>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[14px] leading-relaxed text-zinc-700">
                <p className="font-medium text-zinc-900">이력서와 지원</p>
                <p className="mt-1">
                  「이력서」 탭에서 적어 둔 간편 이력서는 고용주가 지원자를
                  볼 때 참고할 수 있어요. 미리{" "}
                  <Link
                    href={MAIN_HOME_WITH_RESUME_TAB}
                    className="font-semibold text-blue-600 underline"
                  >
                    이력서 작성
                  </Link>
                  을 권장해요.
                </p>
              </div>

              {applyUi.kind === "loading" ? (
                <p className="text-[15px] text-zinc-500">지원 가능 여부 확인 중…</p>
              ) : null}

              {applyUi.kind === "anon" ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-blue-600 text-[17px] font-semibold text-white active:bg-blue-700"
                  >
                    로그인하고 지원하기
                  </Link>
                  <p className="text-center text-[14px] text-zinc-500">
                    시니어 유형 계정으로 로그인해야 지원할 수 있어요.
                  </p>
                </div>
              ) : null}

              {applyUi.kind === "not_senior" ? (
                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-amber-950">
                  시니어(구직) 회원만 이 공고에 지원할 수 있어요. 고용주로
                  로그인한 경우, 다른 계정으로 가입하거나 공고를 등록해 보세요.
                </p>
              ) : null}

              {applyUi.kind === "can_apply" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onApply}
                  className="flex h-[60px] w-full items-center justify-center rounded-2xl bg-emerald-600 text-[18px] font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
                >
                  {pending ? "처리 중…" : "이 공고 지원하기"}
                </button>
              ) : null}

              {applyUi.kind === "already" ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-[16px] font-medium text-emerald-900">
                  이 공고에 지원한 상태예요.
                </p>
              ) : null}

              {applyUi.kind === "error" ? (
                <p className="text-[15px] text-red-700">{applyUi.message}</p>
              ) : null}

              {applyMessage ? (
                <p className="text-[15px] font-medium text-emerald-800">
                  {applyMessage}
                </p>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="flex h-[52px] w-full items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white text-[17px] font-semibold text-zinc-800 active:bg-zinc-50"
              >
                닫기
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
