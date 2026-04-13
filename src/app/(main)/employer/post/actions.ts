"use server";

import { revalidatePath } from "next/cache";

import {
  MINIMUM_HOURLY_WAGE_KRW_2026,
  isBelowMinimumHourlyWage,
} from "@/lib/labor/minimum-wage";
import { skipIdentityGate } from "@/lib/auth/identity-policy";
import { resolveWorkplaceCoordinates } from "@/lib/geo/kakao-geocode";
import { createClient } from "@/lib/supabase/server";

export type CreateJobPostingResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

/**
 * 고용주 로그인 세션으로 공고 1건 저장.
 * 검수 전: `moderation_status=pending` — anon 지도에는 안 보이고, 본인은 조회 가능(RLS).
 */
export async function createJobPosting(input: {
  title: string;
  description: string;
  wageHourly: number;
  address: string;
}): Promise<CreateJobPostingResult> {
  const title = input.title.trim();
  const description = input.description.trim();
  const address = input.address.trim();

  if (!title || !description || !address) {
    return { ok: false, error: "제목·업무 내용·근무지를 입력해 주세요." };
  }

  if (!Number.isFinite(input.wageHourly) || isBelowMinimumHourlyWage(input.wageHourly)) {
    return {
      ok: false,
      error: `시급은 ${MINIMUM_HOURLY_WAGE_KRW_2026.toLocaleString("ko-KR")}원 이상이어야 합니다.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "로그인이 필요합니다. 로그인 후 다시 시도해 주세요." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, identity_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, error: "프로필을 찾을 수 없어요. 잠시 후 다시 시도해 주세요." };
  }

  if (profile.role !== "employer") {
    return {
      ok: false,
      error: "고용주 계정만 공고를 등록할 수 있어요. 회원가입 시 고용주 유형을 선택했는지 확인해 주세요.",
    };
  }

  if (
    !skipIdentityGate() &&
    profile.identity_verified_at == null
  ) {
    return {
      ok: false,
      error:
        "공고를 올리시려면 본인인증이 필요합니다. 고용주 탭에서 안내에 따라 인증을 완료해 주세요.",
    };
  }

  const coords = await resolveWorkplaceCoordinates(address);
  if (!coords.ok) {
    return { ok: false, error: coords.error };
  }

  const tags = ["#구인", "#고용주등록"];

  const { data: row, error: insertError } = await supabase
    .from("job_postings")
    .insert({
      employer_id: user.id,
      category_id: null,
      title,
      description,
      tags,
      wage_hourly: input.wageHourly,
      employment_type: "파트",
      lat: coords.lat,
      lng: coords.lng,
      address,
      status: "active",
      moderation_status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return {
      ok: false,
      error: insertError?.message ?? "저장에 실패했어요.",
    };
  }

  revalidatePath("/");
  revalidatePath("/employer/post");

  return { ok: true, jobId: row.id };
}
