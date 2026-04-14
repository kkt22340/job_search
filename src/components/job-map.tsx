"use client";

import { LocateFixed, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Map,
  MapMarker,
  MarkerClusterer,
  useKakaoLoader,
} from "react-kakao-maps-sdk";

import { PresetRegionPicker } from "@/components/region/preset-region-picker";
import { useMyLocation, type MyLocationState } from "@/hooks/use-my-location";
import { usePreferredRegion } from "@/hooks/use-preferred-region";
import {
  PRESET_REGIONS,
  type PresetRegion,
} from "@/lib/geo-defaults";
import { haversineMeters } from "@/lib/geo/distance";
import type { MapPinsMeta } from "@/types/map-job-pins";
import type { JobPin } from "@/types/job";

import { JobBottomSheet } from "./job-bottom-sheet";
import {
  ViewportJobListPanel,
  type ViewportJobRow,
} from "./viewport-job-list-panel";

/** 스크립트 URL에 https 고정 — clusterer 라이브러리는 libraries 옵션으로 로드 */
const KAKAO_SDK_URL = "https://dapi.kakao.com/v2/maps/sdk.js";

const MY_MARKER = {
  src: "/images/marker-my-location.svg",
  size: { width: 48, height: 48 } as const,
  options: {
    alt: "현재 위치",
    offset: { x: 24, y: 24 },
  } as const,
};

/** Zinc / Blue — Apple 지도 느낌의 클러스터 스타일 (카카오 HTML 마커) */
const CLUSTER_STYLES: object[] = [
  {
    width: "44px",
    height: "44px",
    background: "rgba(24, 24, 27, 0.94)",
    borderRadius: "14px",
    color: "#fafafa",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "15px",
    lineHeight: "40px",
    border: "2px solid #3b82f6",
    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
  },
  {
    width: "52px",
    height: "52px",
    background: "rgba(24, 24, 27, 0.96)",
    borderRadius: "16px",
    color: "#fafafa",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "16px",
    lineHeight: "48px",
    border: "2px solid #2563eb",
    boxShadow: "0 6px 18px rgba(37,99,235,0.35)",
  },
  {
    width: "58px",
    height: "58px",
    background: "rgba(30, 58, 138, 0.95)",
    borderRadius: "18px",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "17px",
    lineHeight: "54px",
    border: "2px solid #93c5fd",
    boxShadow: "0 8px 24px rgba(30,64,175,0.4)",
  },
];

function formatKakaoLoaderError(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof ErrorEvent !== "undefined" && err instanceof ErrorEvent) {
    return err.message || err.filename || "ErrorEvent";
  }
  if (typeof Event !== "undefined" && err instanceof Event) {
    const parts = [err.type || "error"];
    const t = err.target;
    if (t instanceof HTMLScriptElement && t.src) {
      parts.push(`요청: ${t.src}`);
    }
    return parts.join(" · ");
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

type Props = {
  kakaoMapAppKey: string;
  isActive?: boolean;
  jobPins: JobPin[];
  mapPinsMeta?: MapPinsMeta;
  /** 이력서 저장 후 이 공고 시트를 다시 열 때 (지도 탭) */
  resumeRevealJobId?: string | null;
  onResumeRevealConsumed?: () => void;
};

function locationHintText(
  loc: MyLocationState,
  fallbackRegionLabel: string
): string {
  switch (loc.status) {
    case "pending":
      return "현재 위치를 확인하는 중…";
    case "ready":
      return "내 위치를 기준으로 표시합니다. 파란 원이 나의 위치예요.";
    case "denied":
      return `위치 권한이 없어 「${fallbackRegionLabel}」일대를 기준으로 보여요. 아래에서 동네를 바꿀 수 있어요.`;
    case "unavailable":
      return `위치를 알 수 없어 「${fallbackRegionLabel}」일대를 기준으로 보여요. 아래에서 동네를 바꿀 수 있어요.`;
    default:
      return "핀을 누르면 아래에서 공고를 확인할 수 있어요";
  }
}

function JobMapHeader({
  locationNote,
  pinCount,
  mapPinsMeta,
}: {
  locationNote: string;
  pinCount?: number;
  mapPinsMeta?: MapPinsMeta;
}) {
  const showBulk =
    (pinCount ?? 0) > 20 &&
    mapPinsMeta?.source === "mock" &&
    !mapPinsMeta?.databaseEmpty;

  return (
    <header className="relative z-20 shrink-0 border-b border-zinc-200/80 bg-white/95 px-4 py-4 backdrop-blur-sm">
      <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
        내 주변 일자리
      </h1>
      <p className="mt-1 text-[16px] leading-snug text-zinc-500">
        {locationNote}
      </p>
      {mapPinsMeta?.databaseEmpty ? (
        <p className="mt-2 rounded-2xl bg-zinc-100 px-4 py-3 text-[15px] leading-snug text-zinc-700">
          아직 등록된 일자리가 없어요. 고용주 공고가 올라오면 이 지도에 표시돼요.
        </p>
      ) : null}
      {showBulk ? (
        <p className="mt-1 text-[14px] text-zinc-400">
          지도에 공고 {pinCount?.toLocaleString("ko-KR")}건 표시 (성능·클러스터링
          검증용 데모)
        </p>
      ) : null}
    </header>
  );
}

function LocationPermissionCallout({
  visible,
  onOpenNeighborhoodPicker,
}: {
  visible: boolean;
  onOpenNeighborhoodPicker: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="border-b border-blue-100 bg-blue-50/95 px-4 py-3 text-[15px] leading-snug text-blue-950">
      <p>위치 권한을 허용하면 내 주변 일자리를 더 정확히 볼 수 있어요.</p>
      <button
        type="button"
        onClick={onOpenNeighborhoodPicker}
        className="mt-3 flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-blue-200 bg-white px-4 text-[17px] font-semibold text-blue-900 active:bg-blue-50"
      >
        우리 동네 설정
      </button>
    </div>
  );
}

function NeighborhoodPickerModal({
  open,
  selectedId,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (r: PresetRegion) => void;
}) {
  if (!open) return null;
  const selected = PRESET_REGIONS.find((r) => r.id === selectedId) ?? PRESET_REGIONS[0];
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="neighborhood-picker-title"
        className="max-h-[min(70vh,540px)] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[min(70vh,540px)] overflow-y-auto px-3 py-3">
          <PresetRegionPicker
            title="우리 동네 설정"
            description="위치 권한이 없을 때 지도 중심으로 사용할 시/군/구예요."
            value={selected}
            onChange={(r) => {
              onSelect(r);
              onClose();
            }}
          />
          <div className="mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-zinc-100 text-[17px] font-semibold text-zinc-800 active:bg-zinc-200"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 키 없음: 목록 + 시트만 */
function JobMapFallback({
  jobPins,
  mapPinsMeta,
  isActive = true,
  resumeRevealJobId,
  onResumeRevealConsumed,
}: {
  jobPins: JobPin[];
  mapPinsMeta?: MapPinsMeta;
  isActive?: boolean;
  resumeRevealJobId?: string | null;
  onResumeRevealConsumed?: () => void;
}) {
  const [selected, setSelected] = useState<JobPin | null>(null);
  const { region: preferredRegion } = usePreferredRegion();

  useEffect(() => {
    if (!resumeRevealJobId) return;
    const pin = jobPins.find((j) => j.id === resumeRevealJobId);
    if (pin) setSelected(pin);
    onResumeRevealConsumed?.();
  }, [resumeRevealJobId, jobPins, onResumeRevealConsumed]);

  const fallbackListItems = useMemo((): ViewportJobRow[] => {
    if (jobPins.length === 0) return [];
    const rows = jobPins.map((job) => ({
      job,
      distanceMeters: haversineMeters(
        preferredRegion.lat,
        preferredRegion.lng,
        job.lat,
        job.lng
      ),
    }));
    rows.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return rows;
  }, [jobPins, preferredRegion]);

  useEffect(() => {
    if (!isActive) setSelected(null);
  }, [isActive]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-100">
      <JobMapHeader
        locationNote="핀을 누르면 아래에서 공고를 확인할 수 있어요"
        pinCount={jobPins.length}
        mapPinsMeta={mapPinsMeta}
      />
      <div
        className="relative w-full flex-1 overflow-y-auto"
        style={{ minHeight: 320 }}
      >
        <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-8 pb-40 text-center">
          <p className="max-w-md text-[17px] leading-relaxed text-zinc-600">
            지도를 쓰려면{" "}
            <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-[15px]">
              NEXT_PUBLIC_KAKAO_MAP_APP_KEY
            </code>
            를{" "}
            <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-[15px]">
              .env.local
            </code>
            에 넣고 개발 서버를 다시 시작하세요.
          </p>
          {jobPins.length === 0 ? (
            <p className="text-[16px] text-zinc-500">
              표시할 공고가 없습니다. Supabase에 활성·승인 공고가 있으면 여기에
              나타나요.
            </p>
          ) : null}
        </div>
        {fallbackListItems.length >= 1 ? (
          <ViewportJobListPanel
            items={fallbackListItems}
            onSelectJob={(job) => setSelected(job)}
            variant="fallback"
            anchorClassName="bottom-4"
            sortCaption={`가까운 순 · 「${preferredRegion.label}」기준(직선거리)`}
          />
        ) : null}
      </div>
      <JobBottomSheet
        job={selected}
        onClose={() => setSelected(null)}
        resumePanelMode="map"
      />
    </div>
  );
}

function JobMapWithSdk({
  kakaoMapAppKey,
  jobPins,
  mapPinsMeta,
  isActive = true,
  resumeRevealJobId,
  onResumeRevealConsumed,
}: {
  kakaoMapAppKey: string;
  jobPins: JobPin[];
  mapPinsMeta?: MapPinsMeta;
  isActive?: boolean;
  resumeRevealJobId?: string | null;
  onResumeRevealConsumed?: () => void;
}) {
  const [, error] = useKakaoLoader({
    appkey: kakaoMapAppKey,
    url: KAKAO_SDK_URL,
    libraries: ["clusterer"],
  });

  const { state: locState, refresh: refreshLocation } = useMyLocation();
  const { region: preferredRegion, setRegion: setPreferredRegion } =
    usePreferredRegion();

  const [mapCenter, setMapCenter] = useState({
    lat: PRESET_REGIONS[0].lat,
    lng: PRESET_REGIONS[0].lng,
  });
  const [neighborhoodPickerOpen, setNeighborhoodPickerOpen] = useState(false);

  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selected, setSelected] = useState<JobPin | null>(null);
  const [viewportJobItems, setViewportJobItems] = useState<ViewportJobRow[]>(
    []
  );

  useEffect(() => {
    if (!resumeRevealJobId) return;
    const pin = jobPins.find((j) => j.id === resumeRevealJobId);
    if (pin) setSelected(pin);
    onResumeRevealConsumed?.();
  }, [resumeRevealJobId, jobPins, onResumeRevealConsumed]);

  const recalcVisiblePins = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const filtered = jobPins.filter((j) =>
      bounds.contain(new kakao.maps.LatLng(j.lat, j.lng))
    );

    let originLat: number;
    let originLng: number;
    if (locState.status === "ready") {
      originLat = locState.lat;
      originLng = locState.lng;
    } else {
      const c = map.getCenter();
      originLat = c.getLat();
      originLng = c.getLng();
    }

    const rows: ViewportJobRow[] = filtered.map((job) => ({
      job,
      distanceMeters: haversineMeters(
        originLat,
        originLng,
        job.lat,
        job.lng
      ),
    }));
    rows.sort((a, b) => a.distanceMeters - b.distanceMeters);
    setViewportJobItems(rows);
  }, [jobPins, locState]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const handler = () => recalcVisiblePins();
    handler();
    kakao.maps.event.addListener(map, "idle", handler);
    return () => {
      kakao.maps.event.removeListener(map, "idle", handler);
    };
  }, [mapReady, recalcVisiblePins]);

  useEffect(() => {
    if (!isActive) setSelected(null);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !mapReady || !mapRef.current) return;
    const map = mapRef.current;
    requestAnimationFrame(() => {
      map.relayout();
    });
    const t1 = window.setTimeout(() => map.relayout(), 120);
    const t2 = window.setTimeout(() => map.relayout(), 450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isActive, mapReady]);

  useEffect(() => {
    if (locState.status === "ready") {
      setMapCenter({ lat: locState.lat, lng: locState.lng });
      return;
    }
    setMapCenter({
      lat: preferredRegion.lat,
      lng: preferredRegion.lng,
    });
  }, [locState, preferredRegion]);

  useEffect(() => {
    if (!mapReady || locState.status !== "ready") return;
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(4);
    requestAnimationFrame(() => map.relayout());
    setTimeout(() => map.relayout(), 200);
  }, [mapReady, locState]);

  const handleMarkerClick = useCallback((job: JobPin) => {
    setSelected(job);
    const map = mapRef.current;
    if (!map) return;
    map.setCenter(new kakao.maps.LatLng(job.lat, job.lng));
  }, []);

  const goToMyLocation = useCallback(() => {
    if (locState.status === "ready") {
      const map = mapRef.current;
      if (map) {
        map.setCenter(
          new kakao.maps.LatLng(locState.lat, locState.lng)
        );
        map.setLevel(4);
      }
      return;
    }
    if (locState.status === "denied" || locState.status === "unavailable") {
      const map = mapRef.current;
      if (map) {
        map.setCenter(
          new kakao.maps.LatLng(preferredRegion.lat, preferredRegion.lng)
        );
        map.setLevel(5);
      }
      return;
    }
    refreshLocation();
  }, [locState, preferredRegion, refreshLocation]);

  const zoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(Math.max(1, map.getLevel() - 1));
  };

  const zoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(Math.min(14, map.getLevel() + 1));
  };

  const showLocTip =
    locState.status === "denied" || locState.status === "unavailable";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-100">
      <JobMapHeader
        locationNote={locationHintText(
          locState,
          preferredRegion.label
        )}
        pinCount={jobPins.length}
        mapPinsMeta={mapPinsMeta}
      />
      <LocationPermissionCallout
        visible={showLocTip}
        onOpenNeighborhoodPicker={() => setNeighborhoodPickerOpen(true)}
      />

      <div className="relative w-full min-h-0 flex-1">
        {error ? (
          <div className="flex min-h-[400px] items-center justify-center bg-zinc-100 p-6">
            <div className="max-w-md text-center">
              <p className="text-[17px] leading-relaxed text-red-600">
                카카오맵 스크립트를 불러오지 못했습니다.
              </p>
              <p className="mt-3 break-all text-left text-[14px] text-zinc-600">
                <span className="font-medium text-zinc-500">상세: </span>
                {formatKakaoLoaderError(error)}
              </p>
              <p className="mt-3 text-left text-[14px] leading-relaxed text-zinc-600">
                위 메시지가{" "}
                <code className="rounded bg-zinc-200 px-1">
                  error · 요청: https://dapi.kakao.com/...
                </code>{" "}
                형태면,{" "}
                <strong>네트워크에서 해당 주소를 불러오지 못한 것</strong>
                입니다.
              </p>
              <ul className="mt-4 list-inside list-disc text-left text-[15px] leading-relaxed text-zinc-600">
                <li>
                  <strong>광고 차단</strong>(uBlock, Brave 실드 등) 끄고 새로고침
                </li>
                <li>
                  다른 브라우저(Edge/Chrome) 또는 <strong>시크릿 창</strong>에서
                  재시도
                </li>
                <li>
                  F12 → <strong>Network</strong> →{" "}
                  <code className="rounded bg-zinc-200 px-1">sdk.js</code> 실패
                  여부 확인
                </li>
                <li>
                  카카오 콘솔 → <strong>JavaScript 키</strong> · Web 플랫폼 등록
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 z-0 min-h-0">
              <Map
                center={mapCenter}
                level={5}
                style={{ width: "100%", height: "100%", minHeight: 400 }}
                onCreate={(map) => {
                  mapRef.current = map;
                  setMapReady(true);
                  const relayout = () => map.relayout();
                  requestAnimationFrame(relayout);
                  setTimeout(relayout, 100);
                  setTimeout(relayout, 500);
                }}
              >
                {locState.status === "ready" ? (
                  <MapMarker
                    position={{ lat: locState.lat, lng: locState.lng }}
                    zIndex={100}
                    clickable={false}
                    image={MY_MARKER}
                  />
                ) : null}
                {jobPins.length > 0 ? (
                  <MarkerClusterer
                    averageCenter
                    minLevel={5}
                    minClusterSize={2}
                    gridSize={72}
                    calculator={[10, 30, 100]}
                    styles={CLUSTER_STYLES}
                    disableClickZoom={false}
                  >
                    {jobPins.map((job) => (
                      <MapMarker
                        key={job.id}
                        position={{ lat: job.lat, lng: job.lng }}
                        zIndex={1}
                        clickable
                        onClick={() => handleMarkerClick(job)}
                      />
                    ))}
                  </MarkerClusterer>
                ) : null}
              </Map>
            </div>

            {mapReady && viewportJobItems.length >= 1 ? (
              <ViewportJobListPanel
                items={viewportJobItems}
                onSelectJob={handleMarkerClick}
                sortCaption={
                  locState.status === "ready"
                    ? "가까운 순 · 내 위치 기준(직선거리)"
                    : "가까운 순 · 화면 중심 기준(직선거리)"
                }
              />
            ) : null}

            {mapReady ? (
              <>
                <div className="absolute bottom-8 left-4 z-10">
                  <button
                    type="button"
                    onClick={goToMyLocation}
                    aria-label="내 위치로 이동"
                    className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl border border-zinc-200/90 bg-white shadow-md active:bg-zinc-50"
                  >
                    <LocateFixed
                      className="h-8 w-8 text-blue-600"
                      strokeWidth={2.25}
                    />
                  </button>
                </div>
                <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
                  <button
                    type="button"
                    onClick={zoomIn}
                    aria-label="확대"
                    className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl border border-zinc-200/90 bg-white shadow-md active:bg-zinc-50"
                  >
                    <Plus
                      className="h-8 w-8 text-zinc-800"
                      strokeWidth={2.25}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={zoomOut}
                    aria-label="축소"
                    className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl border border-zinc-200/90 bg-white shadow-md active:bg-zinc-50"
                  >
                    <Minus
                      className="h-8 w-8 text-zinc-800"
                      strokeWidth={2.25}
                    />
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      <NeighborhoodPickerModal
        open={neighborhoodPickerOpen}
        selectedId={preferredRegion.id}
        onClose={() => setNeighborhoodPickerOpen(false)}
        onSelect={(r) => {
          setPreferredRegion(r);
          if (
            locState.status === "denied" ||
            locState.status === "unavailable" ||
            locState.status === "pending"
          ) {
            setMapCenter({ lat: r.lat, lng: r.lng });
            const map = mapRef.current;
            if (map) {
              map.setCenter(new kakao.maps.LatLng(r.lat, r.lng));
              map.setLevel(5);
            }
          }
        }}
      />

      <JobBottomSheet
        job={selected}
        onClose={() => setSelected(null)}
        resumePanelMode="map"
      />
    </div>
  );
}

export function JobMap({
  kakaoMapAppKey,
  jobPins,
  mapPinsMeta,
  isActive = true,
  resumeRevealJobId,
  onResumeRevealConsumed,
}: Props) {
  const key = kakaoMapAppKey.trim();
  if (!key) {
    return (
      <JobMapFallback
        jobPins={jobPins}
        mapPinsMeta={mapPinsMeta}
        isActive={isActive}
        resumeRevealJobId={resumeRevealJobId}
        onResumeRevealConsumed={onResumeRevealConsumed}
      />
    );
  }
  return (
    <JobMapWithSdk
      kakaoMapAppKey={key}
      jobPins={jobPins}
      mapPinsMeta={mapPinsMeta}
      isActive={isActive}
      resumeRevealJobId={resumeRevealJobId}
      onResumeRevealConsumed={onResumeRevealConsumed}
    />
  );
}
