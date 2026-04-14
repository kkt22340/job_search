"use client";

import { PhoneAuthPlaceholder } from "@/components/auth/phone-auth-placeholder";

type Variant = "employer_post" | "senior_trust";

/**
 * PASS/SMS 연동 전 안내 — 비용은 「인증 성공 시」에만 발생하도록 가입 단계에서는 받지 않음.
 */
export function IdentityVerificationExplainer({ variant }: { variant: Variant }) {
  const isEmployer = variant === "employer_post";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-[15px] leading-relaxed text-amber-950">
        <p className="font-semibold">
          {isEmployer
            ? "공고를 올리시려면 본인인증이 필요합니다"
            : "신뢰도를 위해 본인인증을 완료해 주세요"}
        </p>
      </div>

      <PhoneAuthPlaceholder />

      <p className="text-[14px] leading-relaxed text-zinc-500">
        운영 연동 후: 인증이 끝나면 Supabase{" "}
        <code className="rounded bg-zinc-200 px-1">profiles.identity_verified_at</code>
        에 시각이 기록됩니다. 개발 중에는 SQL로 수동 설정하거나{" "}
        <code className="rounded bg-zinc-200 px-1">
          NEXT_PUBLIC_SKIP_IDENTITY_GATE=true
        </code>
        로 게이트를 끌 수 있어요.
      </p>
    </div>
  );
}
