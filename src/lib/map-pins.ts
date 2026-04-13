import "server-only";

import { fetchJobPinsFromSupabase } from "@/lib/data/fetch-job-pins";
import { isSupabaseConfigured } from "@/lib/supabase/public-server";
import type { MapJobPinsResult } from "@/types/map-job-pins";

import { MOCK_JOBS } from "./mock-jobs";

export type { MapJobPinsResult } from "@/types/map-job-pins";

/**
 * 홈 지도 핀: Supabase 우선 → 실패·미설정 시 MOCK / Faker(PRD §14.3).
 */
export async function getMapJobPins(): Promise<MapJobPinsResult> {
  if (isSupabaseConfigured()) {
    const fromDb = await fetchJobPinsFromSupabase();
    if (fromDb !== null) {
      if (fromDb.length === 0) {
        return {
          pins: [],
          source: "supabase",
          databaseEmpty: true,
        };
      }
      return { pins: fromDb, source: "supabase" };
    }
  }

  if (process.env.EXTRA_MOCK_JOBS === "true") {
    const raw = process.env.EXTRA_MOCK_JOB_COUNT;
    const parsed = parseInt(raw ?? "200", 10);
    const count = Number.isFinite(parsed)
      ? Math.min(500, Math.max(50, parsed))
      : 200;

    const seedRaw = process.env.EXTRA_MOCK_JOBS_SEED;
    const seedParsed = parseInt(seedRaw ?? "42", 10);
    const seed = Number.isFinite(seedParsed) ? seedParsed : 42;

    const { generateBulkMockJobPins } = await import(
      "./generate-bulk-mock-jobs"
    );
    const bulk = generateBulkMockJobPins(count, seed);
    return { pins: [...MOCK_JOBS, ...bulk], source: "mock" };
  }

  return { pins: MOCK_JOBS, source: "mock" };
}
