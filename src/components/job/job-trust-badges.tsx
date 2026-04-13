"use client";

import { BadgeCheck, Building2 } from "lucide-react";

import type { JobPin } from "@/types/job";

type Props = {
  job: JobPin;
  /** 더 작은 배지 */
  compact?: boolean;
};

/**
 * PRD §15.2 — 사업자 인증·본인인증 신뢰 배지 (데이터 있을 때만).
 */
export function JobTrustBadges({ job, compact }: Props) {
  const t = job.trust;
  if (!t) return null;

  const showBiz = t.businessVerified;
  const showId = t.identityVerified;
  if (!showBiz && !showId) return null;

  const pill =
    compact
      ? "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      : "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium";

  return (
    <span className="flex flex-wrap items-center gap-1.5" aria-label="신뢰 정보">
      {showBiz ? (
        <span
          className={`${pill} bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80`}
          title="사업자 인증 완료(등록 확인 연동 시)"
        >
          <Building2 className="h-3 w-3 shrink-0" aria-hidden />
          사업자
        </span>
      ) : null}
      {showId ? (
        <span
          className={`${pill} bg-sky-50 text-sky-950 ring-1 ring-sky-200/80`}
          title="고용주 본인인증 완료"
        >
          <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
          본인
        </span>
      ) : null}
    </span>
  );
}
