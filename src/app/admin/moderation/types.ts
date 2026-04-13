import type { PipelineResult } from "@/lib/moderation/pipeline";

export type PlaygroundActionState =
  | { ok: true; data: PipelineResult }
  | { ok: false; error: string };
