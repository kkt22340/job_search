import type { Metadata } from "next";
import Link from "next/link";
import { Undo2 } from "lucide-react";

import { EmployerPostBody } from "@/app/(main)/employer/post/employer-post-body";
import { skipIdentityGate } from "@/lib/auth/identity-policy";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "공고 등록 — 백구",
  description: "안심 고용 시스템 — 최저임금 검증·표준 근로계약서 초안",
};

export default async function EmployerPostPage() {
  let allowPosting = true;
  if (!skipIdentityGate()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, identity_verified_at")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role === "employer" && profile.identity_verified_at == null) {
        allowPosting = false;
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/?view=manage"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[16px] font-semibold text-zinc-900 shadow-sm active:bg-zinc-50"
          >
            <Undo2 className="h-5 w-5" aria-hidden />
            고용 관리로
          </Link>
          <h1 className="text-[22px] font-semibold text-zinc-900">
            공고 등록
          </h1>
        </div>
        <p className="mx-auto mt-2 max-w-lg text-[15px] text-zinc-600">
          안심 고용: 최저임금 미만은 등록할 수 없어요. 아래에서 근로계약서 초안을
          미리 볼 수 있어요.
        </p>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <EmployerPostBody allowPosting={allowPosting} />
      </div>
    </div>
  );
}
