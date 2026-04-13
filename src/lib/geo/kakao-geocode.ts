import "server-only";

import { PRESET_REGIONS } from "@/lib/geo-defaults";

export type WorkplaceCoordinatesResult =
  | { ok: true; lat: number; lng: number; source: "kakao" | "preset" }
  | { ok: false; error: string };

type KakaoAddressDoc = {
  y: string;
  x: string;
};

type KakaoAddressResponse = {
  documents?: KakaoAddressDoc[];
};

/**
 * 근무지 문자열 → WGS84 좌표.
 * `KAKAO_REST_API_KEY` 가 있으면 카카오 주소 검색 API 사용, 없으면 PRD 프리셋 1번 좌표.
 */
export async function resolveWorkplaceCoordinates(
  address: string
): Promise<WorkplaceCoordinatesResult> {
  const trimmed = address.trim();
  if (trimmed.length < 4) {
    return {
      ok: false,
      error: "근무지 주소를 조금 더 구체적으로 입력해 주세요.",
    };
  }

  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) {
    const fallback = PRESET_REGIONS[0];
    return {
      ok: true,
      lat: fallback.lat,
      lng: fallback.lng,
      source: "preset",
    };
  }

  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", trimmed);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${key}` },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: "주소 검색 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      error:
        "주소 검색 API 키를 확인해 주세요. (환경 변수 KAKAO_REST_API_KEY — 카카오 개발자 콘솔 REST API 키)",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: "주소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  const json = (await res.json()) as KakaoAddressResponse;
  const doc = json.documents?.[0];
  if (!doc) {
    return {
      ok: false,
      error:
        "입력한 주소에서 위치를 찾지 못했어요. 도로명·지번을 확인하거나 더 구체적으로 입력해 주세요.",
    };
  }

  const lat = parseFloat(doc.y);
  const lng = parseFloat(doc.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      error: "주소 좌표를 해석하지 못했어요. 다른 표기로 다시 시도해 주세요.",
    };
  }

  return { ok: true, lat, lng, source: "kakao" };
}
