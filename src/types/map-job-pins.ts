import type { JobPin } from "@/types/job";

export type MapJobPinsResult = {
  pins: JobPin[];
  source: "supabase" | "mock";
  /** Supabase 조회 성공 + 0건 */
  databaseEmpty?: boolean;
};

export type MapPinsMeta = Pick<MapJobPinsResult, "source" | "databaseEmpty">;
