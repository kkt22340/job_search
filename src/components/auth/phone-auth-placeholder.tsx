"use client";

import { Smartphone } from "lucide-react";

import { isPhoneAuthEnabled } from "@/lib/auth/config";

/**
 * 휴대폰 인증 UI — 유료 SMS 연동 전까지 비활성(또는 env 로 켬).
 */
export function PhoneAuthPlaceholder() {
  const enabled = isPhoneAuthEnabled();

  return (
    <section
      aria-labelledby="phone-auth-heading"
      className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-200/90 text-zinc-600">
          <Smartphone className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="phone-auth-heading"
            className="text-[18px] font-semibold text-zinc-900"
          >
            휴대폰 인증
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
            {enabled
              ? "인증번호를 받아 입력하면 가입을 마칠 수 있어요."
              : "SMS 인증은 통신·정책 준비 후 켤 예정이에요. 지금은 아래 이메일로 가입해 주세요."}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01012345678"
              disabled={!enabled}
              className="min-h-[52px] min-w-0 flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 text-[17px] text-zinc-900 outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            />
            <button
              type="button"
              disabled={!enabled}
              className="min-h-[52px] shrink-0 rounded-xl bg-zinc-900 px-5 text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              인증번호 받기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
