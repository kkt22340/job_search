"use client";

import type { SeniorProfileDraft } from "@/domain/senior-profile";
import { createClient } from "@/lib/supabase";

import { seniorDraftFromProfileJson, seniorDraftToProfileJson } from "./db";

export type SeniorResumeLoadResult =
  | { kind: "anonymous" }
  | { kind: "non_senior" }
  | { kind: "senior"; row: { profile: unknown; updated_at: string } | null };

export async function loadSeniorResumeForUser(): Promise<SeniorResumeLoadResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "anonymous" };

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.role !== "senior") return { kind: "non_senior" };

  const { data: row } = await supabase
    .from("senior_profiles")
    .select("profile, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return { kind: "senior", row: row ?? null };
}

export async function upsertSeniorProfileCloud(
  draft: SeniorProfileDraft
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.role !== "senior") {
    throw new Error("시니어 계정만 이력서를 동기화할 수 있어요.");
  }

  const payload = seniorDraftToProfileJson(draft);
  const { error } = await supabase.from("senior_profiles").upsert(
    {
      user_id: user.id,
      profile: payload,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

export { seniorDraftFromProfileJson };
