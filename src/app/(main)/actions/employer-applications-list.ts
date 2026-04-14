"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { employerApplicantContactDisplay } from "@/lib/privacy/korean-phone-display";

export type EmployerApplicationListRow = {
  id: string;
  created_at: string;
  status: string;
  jobTitle: string;
  seniorLabel: string;
  /** 마스킹 규칙이 적용된 연락처 문구 */
  contactPrimary: string;
  /** 채용 확정 전 안내 (있을 때만) */
  contactSecondary: string | null;
};

export type EmployerApplicationsListResult =
  | {
      ok: true;
      rows: EmployerApplicationListRow[];
      hint: string | null;
    }
  | { ok: false; error: string };

/**
 * 고용주「받은 지원」목록 — 연락처는 서버에서만 조합·마스킹(PRD 채용 확정 전 규칙).
 */
export async function loadEmployerApplicationsList(): Promise<EmployerApplicationsListResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: true,
        rows: [],
        hint: "로그인하면 등록한 공고에 들어온 지원을 볼 수 있어요.",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "employer") {
      return {
        ok: true,
        rows: [],
        hint: "고용주 계정에서만 지원 목록을 볼 수 있어요.",
      };
    }

    const { data: jobs, error: jobsError } = await supabase
      .from("job_postings")
      .select("id, title")
      .eq("employer_id", user.id);

    if (jobsError) {
      return { ok: false, error: jobsError.message };
    }

    const jobList = jobs ?? [];
    const jobIds = jobList.map((j) => j.id);
    const titleByJob = new Map(
      jobList.map((j) => [j.id, j.title?.trim() || "제목 없음"])
    );

    if (jobIds.length === 0) {
      return {
        ok: true,
        rows: [],
        hint: "등록한 공고가 없어요. 공고를 올리면 지원이 여기에 표시돼요.",
      };
    }

    const { data: apps, error: appsError } = await supabase
      .from("job_applications")
      .select("id, created_at, status, job_id, senior_id")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (appsError) {
      return { ok: false, error: appsError.message };
    }

    const list = apps ?? [];
    /** `in ()` 빈 배열은 PostgREST에서 오류가 나므로 지원 0건이면 여기서 종료 */
    if (list.length === 0) {
      return { ok: true, rows: [], hint: null };
    }

    const seniorIds = [
      ...new Set(
        list
          .map((a) => a.senior_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];

    const svc = createServiceRoleClient();
    if (!svc) {
      return {
        ok: false,
        error:
          "서버에 연락처 조회 설정이 필요해요. (.env 의 SUPABASE_SERVICE_ROLE_KEY)",
      };
    }

    let seniors: {
      id: string;
      display_name: unknown;
      phone: unknown;
    }[] = [];

    if (seniorIds.length > 0) {
      const { data: seniorRows, error: seniorsError } = await svc
        .from("profiles")
        .select("id, display_name, phone")
        .in("id", seniorIds);

      if (seniorsError) {
        return { ok: false, error: seniorsError.message };
      }
      seniors = seniorRows ?? [];
    }

    const nameBySenior = new Map(
      seniors.map((s) => [
        s.id,
        (s.display_name as string | null)?.trim() || "이름 미등록",
      ])
    );
    const phoneBySenior = new Map(
      seniors.map((s) => [s.id, s.phone as string | null | undefined])
    );

    const rows: EmployerApplicationListRow[] = list.map((a) => {
      const phone = a.senior_id
        ? phoneBySenior.get(a.senior_id)
        : undefined;
      const { primary, secondary } = employerApplicantContactDisplay({
        phone,
        applicationStatus: a.status,
      });
      return {
        id: a.id,
        created_at: a.created_at,
        status: a.status,
        jobTitle: titleByJob.get(a.job_id) ?? "—",
        seniorLabel: a.senior_id
          ? (nameBySenior.get(a.senior_id) ?? "지원자")
          : "지원자",
        contactPrimary: primary,
        contactSecondary: secondary,
      };
    });

    return { ok: true, rows, hint: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
    return { ok: false, error: message };
  }
}
