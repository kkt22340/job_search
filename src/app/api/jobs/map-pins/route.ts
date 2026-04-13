import { NextResponse } from "next/server";

import { getMapJobPins } from "@/lib/map-pins";

export const dynamic = "force-dynamic";

/** 지도용 공고 핀 JSON — 웹·앱·디버그 공용 */
export async function GET() {
  try {
    const result = await getMapJobPins();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
