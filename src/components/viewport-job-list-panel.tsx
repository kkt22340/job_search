"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { JobTrustBadges } from "@/components/job/job-trust-badges";
import { formatWalkingDistanceMeters } from "@/lib/geo/distance";
import type { JobPin } from "@/types/job";

export type ViewportJobRow = {
  job: JobPin;
  /** 정렬·표시용 직선거리(m) */
  distanceMeters: number;
};

type Props = {
  items: ViewportJobRow[];
  onSelectJob: (job: JobPin) => void;
  /** 지도 없이 목록만 쓸 때(키 미설정) 안내 문구 */
  variant?: "map" | "fallback";
  /** 하단 오프셋 (지도 위 컨트롤과 겹치지 않게) */
  anchorClassName?: string;
  /** 거리 기준 안내 (예: 내 위치 / 화면 중심) */
  sortCaption?: string;
};

/**
 * 현재 지도 화면(또는 전체 목록)에 해당하는 구인 공고를 목록으로 표시.
 */
export function ViewportJobListPanel({
  items,
  onSelectJob,
  variant = "map",
  anchorClassName = "bottom-28",
  sortCaption,
}: Props) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const title =
    variant === "map"
      ? `이 지도 범위 · 공고 ${items.length}건`
      : `표시 중인 공고 · ${items.length}건`;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-[15] flex flex-col items-stretch px-3 ${anchorClassName}`}
      aria-live="polite"
    >
      <div className="pointer-events-auto flex max-h-[min(48vh,420px)] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-h-[56px] w-full flex-col items-stretch gap-1 px-4 py-3 text-left active:bg-zinc-50"
        >
          <div className="flex w-full items-center justify-between gap-3">
          <span className="text-[16px] font-semibold text-zinc-900">{title}</span>
          <span className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-blue-600">
            {open ? (
              <>
                접기
                <ChevronUp className="h-5 w-5" aria-hidden />
              </>
            ) : (
              <>
                목록 보기
                <ChevronDown className="h-5 w-5" aria-hidden />
              </>
            )}
          </span>
          </div>
          {sortCaption ? (
            <p className="text-[13px] leading-snug text-zinc-500">{sortCaption}</p>
          ) : null}
        </button>

        {open ? (
          <ul className="max-h-[min(40vh,340px)] divide-y divide-zinc-100 overflow-y-auto border-t border-zinc-100">
            {items.map(({ job, distanceMeters }) => (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => onSelectJob(job)}
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors active:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 flex-1 text-[17px] font-semibold text-zinc-900">
                      {job.title}
                    </span>
                    <span className="shrink-0 text-[14px] font-medium tabular-nums text-zinc-500">
                      직선{" "}
                      {formatWalkingDistanceMeters(distanceMeters)}
                    </span>
                  </div>
                  <JobTrustBadges job={job} compact />
                  <span className="text-[15px] font-medium text-blue-600">
                    {job.wageLabel}
                  </span>
                  <span className="line-clamp-2 text-[14px] text-zinc-500">
                    {job.address}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
