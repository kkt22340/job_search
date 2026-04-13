import { Suspense } from "react";

import { MainAppShell } from "@/components/layout/main-app-shell";
import { getMapJobPins } from "@/lib/map-pins";

export default async function HomePage() {
  const kakaoMapAppKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim() ?? "";
  const mapPins = await getMapJobPins();

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-zinc-100 text-zinc-500">
          불러오는 중…
        </div>
      }
    >
      <MainAppShell
        kakaoMapAppKey={kakaoMapAppKey}
        jobPins={mapPins.pins}
        mapPinsMeta={{
          source: mapPins.source,
          databaseEmpty: mapPins.databaseEmpty,
        }}
      />
    </Suspense>
  );
}
