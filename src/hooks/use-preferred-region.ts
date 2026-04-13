"use client";

import { useCallback, useEffect, useState } from "react";

import {
  PRESET_REGIONS,
  type PresetRegion,
  presetRegionById,
} from "@/lib/geo-defaults";
import {
  loadPreferredRegionId,
  savePreferredRegionId,
} from "@/lib/storage/preferred-region-storage";

function resolveRegion(savedId: string | null): PresetRegion {
  return presetRegionById(savedId) ?? PRESET_REGIONS[0];
}

/**
 * 위치 권한 없을 때 지도 기준으로 쓸 「우리 동네」(localStorage).
 */
export function usePreferredRegion() {
  const [region, setRegionState] = useState<PresetRegion>(PRESET_REGIONS[0]);

  useEffect(() => {
    setRegionState(resolveRegion(loadPreferredRegionId()));
  }, []);

  const setRegion = useCallback((next: PresetRegion) => {
    setRegionState(next);
    savePreferredRegionId(next.id);
  }, []);

  return { region, setRegion };
}
