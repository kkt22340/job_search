/**
 * 위치 권한 거부·미지원 시 사용하는 지역 프리셋 (「우리 동네 설정」).
 * PRD §6.1: Geolocation 대체 — 행정구역 선택.
 *
 * NOTE: 실제 데이터 목록은 `src/lib/geo/preset-regions.ts`가 단일 출처입니다.
 */
export {
  PRESET_REGIONS,
  presetRegionById,
  type PresetRegion,
} from "@/lib/geo/preset-regions";

import { PRESET_REGIONS, type PresetRegion } from "@/lib/geo/preset-regions";

/** @deprecated 이름 호환 — 첫 번째 프리셋(단원구) */
export const DEFAULT_REGION_ANSAN_DANWON: PresetRegion = PRESET_REGIONS[0];
