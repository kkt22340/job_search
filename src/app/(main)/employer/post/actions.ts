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
  workPeriod: "one_off" | "short" | "long";
  workStartDate?: string;
  workEndDate?: string;
}): Promise<CreateJobPostingResult> {
  const title = input.title.trim();
  const description = input.description.trim();
  const address = input.address.trim();
  const workPeriod = input.workPeriod;
  const workStartDate = input.workStartDate?.trim() ?? "";
  const workEndDate = input.workEndDate?.trim() ?? "";

  if (!title || !description || !address) {
    return { ok: false, error: "제목·업무 내용·근무지를 입력해 주세요." };
  }
  if (workPeriod !== "one_off" && workPeriod !== "short" && workPeriod !== "long") {
    return { ok: false, error: "아르바이트 기간을 선택해 주세요." };
  }
  if (workStartDate && Number.isNaN(Date.parse(workStartDate))) {
    return { ok: false, error: "근무 시작일 형식이 올바르지 않습니다." };
  }
  if (workEndDate && Number.isNaN(Date.parse(workEndDate))) {
    return { ok: false, error: "근무 종료일 형식이 올바르지 않습니다." };
  }
  if (workPeriod === "one_off") {
    if (!workStartDate) {
      return { ok: false, error: "일회성 공고는 근무일을 선택해 주세요." };
    }
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
      work_period: workPeriod,
      work_start_date: workStartDate || null,
      work_end_date: (workEndDate || (workPeriod === "one_off" ? workStartDate : "")) || null,
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
