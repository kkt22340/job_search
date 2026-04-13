"use client";

import { List, MapPinned, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { JobBottomSheet } from "@/components/job-bottom-sheet";
import { JobMap } from "@/components/job-map";
import { PresetRegionPicker } from "@/components/region/preset-region-picker";
import { useMyLocation } from "@/hooks/use-my-location";
import { usePreferredRegion } from "@/hooks/use-preferred-region";
import type { PresetRegion } from "@/lib/geo-defaults";
import { haversineMeters } from "@/lib/geo/distance";
import { createClient } from "@/lib/supabase";
import type { JobPin } from "@/types/job";

/** 지역 탭: 프리셋 중심 좌표 기준 직선거리 이하만 표시 (행정구역 경계와 다를 수 있음) */
const REGION_TAB_MAX_DISTANCE_METERS = 20_000;

type Mode = "list" | "map" | "region";

function SegButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-3 text-[16px] font-semibold transition-colors ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-zinc-200 bg-white text-zinc-800 active:bg-zinc-50"
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </button>
  );
}

export function SeniorJobsPanel({
  kakaoMapAppKey,
  jobPins,
  mapPinsMeta,
}: {
  kakaoMapAppKey: string;
  jobPins: JobPin[];
  mapPinsMeta?: import("@/types/map-job-pins").MapPinsMeta;
}) {
  const [mode, setMode] = useState<Mode>("list");
  const [selected, setSelected] = useState<JobPin | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(
    () => new Set()
  );
  const { state: locState } = useMyLocation();
  const { region, setRegion } = usePreferredRegion();

  const reloadAppliedJobIds = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAppliedJobIds(new Set());
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "senior") {
      setAppliedJobIds(new Set());
      return;
    }
    const { data: apps } = await supabase
      .from("job_applications")
      .select("job_id")
      .eq("senior_id", user.id);
    setAppliedJobIds(new Set((apps ?? []).map((a) => a.job_id as string)));
  }, []);

  useEffect(() => {
    void reloadAppliedJobIds();
  }, [reloadAppliedJobIds]);

  useEffect(() => {
    setSelected(null);
  }, [mode]);

  const origin = useMemo(() => {
    if (mode === "region") {
      return { lat: region.lat, lng: region.lng, label: `「${region.label}」` };
    }
    if (locState.status === "ready") {
      return { lat: locState.lat, lng: locState.lng, label: "내 위치" };
    }
    return { lat: region.lat, lng: region.lng, label: `「${region.label}」` };
  }, [mode, locState, region]);

  const sorted = useMemo(() => {
    let pins = jobPins;
    if (mode === "region") {
      pins = jobPins.filter(
        (job) =>
          haversineMeters(region.lat, region.lng, job.lat, job.lng) <=
          REGION_TAB_MAX_DISTANCE_METERS
      );
    }
    const rows = pins.map((job) => ({
      job,
      distanceMeters: haversineMeters(origin.lat, origin.lng, job.lat, job.lng),
    }));
    rows.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return rows;
  }, [jobPins, origin.lat, origin.lng, mode, region.lat, region.lng]);

  const title =
    mode === "map" ? "지도로 알바 찾기" : mode === "region" ? "지역으로 알바 찾기" : "알바 찾기";

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-100">
      <header className="shrink-0 border-b border-zinc-200 bg-white/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto max-w-lg">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-1 text-[15px] leading-snug text-zinc-500">
            {mode === "map"
              ? "핀을 누르면 아래에서 공고를 보고 지원할 수 있어요."
              : mode === "region"
                ? `선택 지역 중심 ${(REGION_TAB_MAX_DISTANCE_METERS / 1000).toFixed(0)}km 이내 · 가까운 순(직선거리)`
                : `가까운 순 · ${origin.label} 기준(직선거리)`}
          </p>

          <div className="mt-4 flex gap-2">
            <SegButton
              active={mode === "list"}
              onClick={() => setMode("list")}
              icon={List}
              label="리스트"
            />
            <SegButton
              active={mode === "region"}
              onClick={() => setMode("region")}
              icon={SlidersHorizontal}
              label="지역"
            />
            <SegButton
              active={mode === "map"}
              onClick={() => setMode("map")}
              icon={MapPinned}
              label="지도"
            />
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {mode === "map" ? (
          <JobMap
            kakaoMapAppKey={kakaoMapAppKey}
            jobPins={jobPins}
            mapPinsMeta={mapPinsMeta}
            isActive
          />
        ) : (
          <div className="min-h-0 h-full overflow-y-auto px-4 pb-32 pt-6">
            <div className="mx-auto max-w-lg space-y-4">
              {mode === "region" ? (
                <PresetRegionPicker
                  title="지역으로 찾기"
                  description="시/군/구를 검색해 선택할 수 있어요."
                  value={region}
                  onChange={(r) => {
                    setRegion(r);
                  }}
                />
              ) : null}

              {sorted.length === 0 ? (
                <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[15px] text-zinc-600">
                  표시할 공고가 없어요.
                </p>
              ) : (
                <ul className="space-y-3">
                  {sorted.map(({ job, distanceMeters }) => (
                    <li
                      key={job.id}
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(job)}
                        className="w-full text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[16px] font-semibold text-zinc-900">
                            {job.title}
                          </p>
                          {appliedJobIds.has(job.id) ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[13px] font-semibold text-emerald-900">
                              지원함
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[15px] text-zinc-700">
                          {job.company}
                        </p>
                        <p className="mt-2 text-[16px] font-semibold text-blue-600">
                          {job.wageLabel}
                        </p>
                        <p className="mt-1 text-[14px] leading-snug text-zinc-500">
                          {job.address}
                        </p>
                        <p className="mt-2 text-[13px] text-zinc-400">
                          직선 {Math.round(distanceMeters).toLocaleString("ko-KR")}m
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {mode !== "map" ? (
          <JobBottomSheet
            job={selected}
            onClose={() => setSelected(null)}
            onApplyStateChange={() => void reloadAppliedJobIds()}
          />
        ) : null}
      </div>
    </div>
  );
}

