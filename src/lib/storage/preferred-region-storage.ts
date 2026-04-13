const KEY = "baekgu:preferred-region:v1";

export function loadPreferredRegionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { id?: unknown };
    return typeof v.id === "string" ? v.id : null;
  } catch {
    return null;
  }
}

export function savePreferredRegionId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ id }));
}
