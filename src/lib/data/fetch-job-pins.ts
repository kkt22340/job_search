import "server-only";

import type { JobPin, JobPinTrust } from "@/types/job";

import { createPublicSupabaseClient } from "@/lib/supabase/public-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Row = {
  id: string;
  title: string;
  wage_hourly: string | number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  employer_id: string;
};

function wageLabel(hourly: string | number | null | undefined): string {
  if (hourly == null || hourly === "") return "시급 협의";
  const n = typeof hourly === "string" ? parseFloat(hourly) : hourly;
  if (!Number.isFinite(n)) return "시급 협의";
  return `시급 ${Math.round(n).toLocaleString("ko-KR")}원`;
}

function rowToPin(row: Row, trust?: JobPinTrust): JobPin | null {
  const lat = typeof row.lat === "number" ? row.lat : Number(row.lat);
  const lng = typeof row.lng === "number" ? row.lng : Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const title =
    row.title == null ? "제목 없음" : String(row.title).trim() || "제목 없음";

  const pin: JobPin = {
    id: row.id,
    title,
    company: "등록 업체",
    wageLabel: wageLabel(row.wage_hourly),
    address: row.address?.trim() || "주소 미등록",
    lat,
    lng,
  };
  if (trust) {
    pin.trust = trust;
  }
  return pin;
}

async function loadEmployerTrustMaps(
  employerIds: string[]
): Promise<{
  identity: Map<string, boolean>;
  business: Map<string, boolean>;
}> {
  const identity = new Map<string, boolean>();
  const business = new Map<string, boolean>();
  const uniq = [...new Set(employerIds)].filter(Boolean);
  if (uniq.length === 0) {
    return { identity, business };
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return { identity, business };
  }

  const { data: profs } = await svc
    .from("profiles")
    .select("id, identity_verified_at")
    .in("id", uniq);

  for (const p of profs ?? []) {
    const id = p.id as string;
    identity.set(id, p.identity_verified_at != null);
  }

  const { data: verifs } = await svc
    .from("employer_business_verifications")
    .select("employer_id, is_verified")
    .in("employer_id", uniq);

  for (const v of verifs ?? []) {
    const eid = v.employer_id as string;
    business.set(eid, v.is_verified === true);
  }

  return { identity, business };
}

/**
 * 활성·승인 공고만, 좌표 있는 행만.
 * @returns 빈 배열(조회 성공 0건) | null(클라이언트 미설정·오류)
 */
export async function fetchJobPinsFromSupabase(): Promise<JobPin[] | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("job_postings")
    .select("id, title, wage_hourly, lat, lng, address, employer_id")
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("[fetchJobPinsFromSupabase]", error.message);
    return null;
  }

  const rows = (data ?? []) as unknown as Row[];
  const { identity, business } = await loadEmployerTrustMaps(
    rows.map((r) => r.employer_id)
  );

  return rows
    .map((row) => {
      const idVerified = identity.get(row.employer_id) ?? false;
      const bizVerified = business.get(row.employer_id) ?? false;
      const trust: JobPinTrust = {
        identityVerified: idVerified,
        businessVerified: bizVerified,
      };
      if (!idVerified && !bizVerified) {
        return rowToPin(row);
      }
      return rowToPin(row, trust);
    })
    .filter((p): p is JobPin => p !== null);
}
