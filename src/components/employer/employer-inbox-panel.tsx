"use client";

import { Users } from "lucide-react";

import { EmployerReceivedApplications } from "@/components/employer/employer-received-applications";

export function EmployerInboxPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-100">
      <header className="shrink-0 border-b border-zinc-200 bg-white/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Users className="h-7 w-7" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
              받은 지원
            </h1>
            <p className="text-[15px] text-zinc-500">
              내 공고에 지원한 시니어를 확인할 수 있어요.
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-6">
        <div className="mx-auto max-w-lg">
          <EmployerReceivedApplications />
        </div>
      </div>
    </div>
  );
}
