"use client";

import { ChevronLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  filterPresetRegionsByQuery,
  groupPresetRegionsBySido,
  PRESET_REGIONS,
  type PresetRegion,
} from "@/lib/geo/preset-regions";
import {
  buildCityBuckets,
  shortDistrictLabel,
} from "@/lib/geo/region-hierarchy";

type Props = {
  title: string;
  description?: string;
  value: PresetRegion;
  onChange: (r: PresetRegion) => void;
};

export function PresetRegionPicker({
  title,
  description,
  value,
  onChange,
}: Props) {
  const [q, setQ] = useState("");
  const [selectedSido, setSelectedSido] = useState<string | null>(null);
  const [cityKey, setCityKey] = useState<string | null>(null);

  const groupedFlat = useMemo(
    () => groupPresetRegionsBySido(PRESET_REGIONS),
    []
  );

  const searchMode = q.trim().length > 0;

  useEffect(() => {
    if (searchMode) {
      setSelectedSido(null);
      setCityKey(null);
    }
  }, [searchMode]);

  const currentSidoItems = useMemo(() => {
    if (!selectedSido) return [];
    return groupedFlat.find((g) => g.sido === selectedSido)?.items ?? [];
  }, [groupedFlat, selectedSido]);

  const visibleGroups = useMemo(() => {
    const filteredRegions = filterPresetRegionsByQuery(PRESET_REGIONS, q);
    const filteredSet = new Set(filteredRegions.map((r) => r.id));
    return groupedFlat
      .map((g) => ({
        sido: g.sido,
        items: g.items.filter((it) => filteredSet.has(it.id)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groupedFlat, q]);

  const bucketResult = useMemo(
    () => buildCityBuckets(currentSidoItems),
    [currentSidoItems]
  );

  const sortedBucketKeys = useMemo(() => {
    if (bucketResult.kind !== "buckets") return [];
    return [...bucketResult.buckets.keys()].sort((a, b) =>
      a.localeCompare(b, "ko")
    );
  }, [bucketResult]);

  const guList =
    bucketResult.kind === "buckets" && cityKey
      ? (bucketResult.buckets.get(cityKey) ?? []).sort((a, b) =>
          a.label.localeCompare(b.label, "ko")
        )
      : [];

  const showBack =
    !searchMode && (selectedSido !== null || cityKey !== null);

  function goBack() {
    if (cityKey) {
      setCityKey(null);
      return;
    }
    if (selectedSido) {
      setSelectedSido(null);
    }
  }

  function regionButton(r: PresetRegion) {
    const active = r.id === value.id;
    return (
      <button
        key={r.id}
        type="button"
        onClick={() => onChange(r)}
        className={`flex min-h-[56px] items-center justify-between rounded-2xl px-4 text-left text-[17px] font-medium ${
          active
            ? "bg-blue-50 text-blue-950 ring-2 ring-blue-300"
            : "bg-zinc-50 text-zinc-900 active:bg-zinc-100"
        }`}
      >
        <span>{searchMode ? r.label : shortDistrictLabel(r)}</span>
        {active ? (
          <span className="text-[14px] font-semibold text-blue-700">선택됨</span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-zinc-600" aria-hidden />
        <p className="text-[16px] font-semibold text-zinc-900">{title}</p>
      </div>
      {description ? (
        <p className="mt-1 text-[14px] leading-snug text-zinc-500">
          {description}
        </p>
      ) : null}

      <div className="mt-3">
        <label className="sr-only" htmlFor="region-search">
          지역 검색
        </label>
        <div className="flex min-h-[56px] items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white px-4">
          <Search className="h-5 w-5 text-zinc-400" aria-hidden />
          <input
            id="region-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="시/군/구를 검색해 보세요. 예) 안산, 수원, 강남"
            className="h-[56px] w-full bg-transparent text-[17px] text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      {showBack ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            {cityKey ? "시·군 목록" : "시·도 선택"}
          </button>
          {!cityKey && selectedSido ? (
            <p className="mt-1 text-[14px] text-zinc-500">{selectedSido}</p>
          ) : null}
          {cityKey && selectedSido ? (
            <p className="mt-1 text-[14px] text-zinc-500">
              {selectedSido} · {cityKey}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-5">
        {searchMode ? (
          <>
            {visibleGroups.map((g) => (
              <section key={g.sido} aria-label={`${g.sido} 지역`}>
                <p className="mb-2 text-[14px] font-semibold text-zinc-500">
                  {g.sido}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {g.items.map((r) => regionButton(r))}
                </div>
              </section>
            ))}
            {visibleGroups.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[15px] text-zinc-600">
                검색 결과가 없어요. 다른 키워드로 다시 검색해 주세요.
              </p>
            ) : null}
          </>
        ) : !selectedSido ? (
          <section aria-label="시·도 선택">
            <p className="mb-2 text-[14px] font-semibold text-zinc-500">
              시·도
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {groupedFlat.map((g) => (
                <button
                  key={g.sido}
                  type="button"
                  onClick={() => {
                    setSelectedSido(g.sido);
                    setCityKey(null);
                  }}
                  className="flex min-h-[52px] items-center justify-between rounded-2xl bg-zinc-50 px-4 text-left text-[16px] font-medium text-zinc-900 active:bg-zinc-100"
                >
                  <span>{g.sido}</span>
                  <span className="text-[13px] text-zinc-400">
                    {g.items.length}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : bucketResult.kind === "whole" ? (
          <section aria-label="선택 지역">
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onChange(bucketResult.item)}
                className={`flex min-h-[56px] items-center justify-between rounded-2xl px-4 text-left text-[17px] font-medium ${
                  bucketResult.item.id === value.id
                    ? "bg-blue-50 text-blue-950 ring-2 ring-blue-300"
                    : "bg-zinc-50 text-zinc-900 active:bg-zinc-100"
                }`}
              >
                <span>{bucketResult.item.label}</span>
                {bucketResult.item.id === value.id ? (
                  <span className="text-[14px] font-semibold text-blue-700">
                    선택됨
                  </span>
                ) : null}
              </button>
            </div>
          </section>
        ) : bucketResult.kind === "metro_flat" ? (
          <section aria-label="구·군 선택">
            <p className="mb-2 text-[14px] font-semibold text-zinc-500">
              구·군
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {bucketResult.list.map((r) => regionButton(r))}
            </div>
          </section>
        ) : cityKey ? (
          <section aria-label="구 선택">
            <p className="mb-2 text-[14px] font-semibold text-zinc-500">구</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {guList.map((r) => regionButton(r))}
            </div>
          </section>
        ) : (
          <section aria-label="시·군 선택">
            <p className="mb-2 text-[14px] font-semibold text-zinc-500">
              시·군
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sortedBucketKeys.map((key) => {
                const regions = bucketResult.buckets.get(key)!;
                const single = regions.length === 1;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (single) {
                        onChange(regions[0]);
                        return;
                      }
                      setCityKey(key);
                    }}
                    className="flex min-h-[52px] items-center justify-between rounded-2xl bg-zinc-50 px-4 text-left text-[16px] font-medium text-zinc-900 active:bg-zinc-100"
                  >
                    <span>{key}</span>
                    {!single ? (
                      <span className="text-[13px] text-zinc-400">
                        {regions.length}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
