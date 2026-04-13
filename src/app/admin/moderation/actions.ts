"use server";

import { isAdminPlaygroundEnabled } from "@/lib/admin-env";
import { runModerationPipeline } from "@/lib/moderation/pipeline";

import type { PlaygroundActionState } from "./types";

export async function moderatePlaygroundAction(
  formData: FormData
): Promise<PlaygroundActionState> {
  if (!isAdminPlaygroundEnabled()) {
    return {
      ok: false,
      error:
        "ADMIN_PLAYGROUND_ENABLED=true(또는 1) 일 때만 사용할 수 있습니다. 값을 넣은 뒤 개발 서버를 재시작했는지 확인하세요.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");

  if (!title) {
    return { ok: false, error: "제목을 입력해 주세요." };
  }

  const data = await runModerationPipeline({ title, description });
  return { ok: true, data };
}
