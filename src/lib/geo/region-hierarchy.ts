import type { PresetRegion } from "./preset-regions";
import { stripProvincePrefix } from "./preset-regions";

/** 광역시·특별시: `label`이 `○○구` 한 토큰이면 시/군 단계 없이 구 목록만 사용 */
export const METRO_SIDO = new Set<string>([
  "\uc11c\uc6b8",
  "\ubd80\uc0b0",
  "\ub300\uad6c",
  "\uc778\ucc9c",
  "\uad11\uc8fc",
  "\ub300\uc804",
  "\uc6b8\uc0b0",
]);

export function tailParts(r: PresetRegion): string[] {
  const tail = stripProvincePrefix(r.label, r.sido);
  if (!tail.trim()) return [];
  return tail.split(/\s+/).filter(Boolean);
}

export type CityBucketResult =
  | { kind: "whole"; item: PresetRegion }
  | { kind: "metro_flat"; list: PresetRegion[] }
  | { kind: "buckets"; buckets: Map<string, PresetRegion[]> };

/**
 * 한 시·도(`sido`) 안의 프리셋만 넘긴다. 세종은 단일 행, 광역시는 구·군 평면 목록, 그 외는 시/군 키로 묶는다.
 */
export function buildCityBuckets(items: PresetRegion[]): CityBucketResult {
  if (items.length === 0) {
    return { kind: "buckets", buckets: new Map() };
  }
  const sido = items[0].sido;
  if (items.some((r) => r.sido !== sido)) {
    throw new Error("buildCityBuckets: mixed sido");
  }

  const metro: PresetRegion[] = [];
  const map = new Map<string, PresetRegion[]>();
  let whole: PresetRegion | null = null;

  for (const r of items) {
    const parts = tailParts(r);
    if (parts.length === 0) {
      whole = r;
      continue;
    }
    if (METRO_SIDO.has(sido) && parts.length === 1) {
      metro.push(r);
      continue;
    }
    const key = parts[0];
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  }

  if (whole) {
    return { kind: "whole", item: whole };
  }
  if (metro.length > 0) {
    return {
      kind: "metro_flat",
      list: [...metro].sort((a, b) =>
        a.label.localeCompare(b.label, "ko")
      ),
    };
  }

  return { kind: "buckets", buckets: map };
}

/** 시/군 아래 구·읍면 선택용 짧은 라벨 (예: 단원구, 처인구) */
export function shortDistrictLabel(r: PresetRegion): string {
  const parts = tailParts(r);
  if (parts.length >= 2) return parts.slice(1).join(" ");
  if (parts.length === 1) return parts[0];
  return r.label;
}
