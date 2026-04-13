import type { JobPin } from "@/types/job";

export function wageLabelFromHourly(
  hourly: string | number | null | undefined
): string {
  if (hourly == null || hourly === "") return "\uc2dc\uae09 \ud611\uc758";
  const n = typeof hourly === "string" ? parseFloat(hourly) : hourly;
  if (!Number.isFinite(n)) return "\uc2dc\uae09 \ud611\uc758";
  return `\uc2dc\uae09 ${Math.round(n).toLocaleString("ko-KR")}\uc6d0`;
}

type PostingRow = {
  id: string;
  title: string | null;
  wage_hourly: string | number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
};

/** Map one `job_postings` row + display company name to a `JobPin`. */
export function jobPinFromPostingRow(
  row: PostingRow,
  company: string
): JobPin | null {
  const lat = typeof row.lat === "number" ? row.lat : Number(row.lat);
  const lng = typeof row.lng === "number" ? row.lng : Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const title =
    row.title == null ? "\uc81c\ubaa9 \uc5c6\uc74c" : String(row.title).trim() || "\uc81c\ubaa9 \uc5c6\uc74c";

  return {
    id: row.id,
    title,
    company: company.trim() || "\ub4f1\ub85d \uc5c5\uccb4",
    wageLabel: wageLabelFromHourly(row.wage_hourly),
    address: row.address?.trim() || "\uc8fc\uc18c \ubbf8\ub4f1\ub85d",
    lat,
    lng,
  };
}
