import { isAdminPlaygroundEnabled } from "@/lib/admin-env";

import { getModerationQueueForAdmin } from "./moderation-queue-data";
import { ModerationJobQueue } from "./moderation-job-queue";
import { ModerationPlayground } from "./moderation-playground";

export const metadata = {
  title: "공고 검수 — 백구",
  description: "운영자 승인·키워드·AI 검수 파이프라인(로컬·스테이징)",
};

export default async function AdminModerationPage() {
  const playgroundOn = isAdminPlaygroundEnabled();
  const queue = await getModerationQueueForAdmin();

  return (
    <div className="min-h-dvh bg-zinc-100 px-4 py-10">
      <div className="mx-auto mb-12 max-w-3xl">
        <h1 className="text-[24px] font-bold text-zinc-900">공고 검수</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-zinc-600">
          <span className="font-medium text-zinc-800">승인 대기</span>는{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-[15px]">
            profiles.role = &apos;admin&apos;
          </code>{" "}
          계정으로만 목록·승인·반려할 수 있습니다. Supabase에서 해당 사용자 행을
          관리자로 지정해 주세요.
        </p>
      </div>

      <section className="mx-auto mb-16 max-w-3xl">
        <h2 className="mb-4 text-[20px] font-semibold text-zinc-900">
          승인 대기 공고
        </h2>
        {queue.ok ? (
          <ModerationJobQueue jobs={queue.jobs} />
        ) : (
          <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-[16px] text-zinc-600">
            {queue.error}
          </p>
        )}
      </section>

      <div className="mx-auto mb-10 max-w-lg">
        <h2 className="text-[20px] font-semibold text-zinc-900">
          검수 파이프라인 시뮬
        </h2>
        <p className="mt-2 text-[16px] leading-relaxed text-zinc-600">
          키워드 선별 후 조건에 따라 OpenAI를 호출합니다. 운영 배치는{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-[15px]">
            GET /api/cron/moderate-jobs
          </code>{" "}
          (CRON_SECRET) 로 동작합니다.
        </p>
        {playgroundOn ? (
          <p className="mt-2 text-[15px] text-emerald-800">
            <span className="font-medium">시뮬 폼 사용 가능</span> — 서버에서{" "}
            <code className="rounded bg-emerald-100 px-1">
              ADMIN_PLAYGROUND_ENABLED
            </code>
            를 읽었습니다.
          </p>
        ) : (
          <p className="mt-2 text-[15px] text-amber-800">
            <code className="rounded bg-amber-100 px-1">
              ADMIN_PLAYGROUND_ENABLED=true
            </code>
            를{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code>에 넣고{" "}
            <span className="font-medium">개발 서버를 재시작</span>하면 폼이
            동작합니다.
          </p>
        )}
      </div>
      <ModerationPlayground />
    </div>
  );
}
