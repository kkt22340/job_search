"use client";

import { useState, type FormEvent } from "react";

import { BigButton } from "@/components/ui/big-button";

import { moderatePlaygroundAction } from "./actions";
import type { PlaygroundActionState } from "./types";

export function ModerationPlayground() {
  const [state, setState] = useState<PlaygroundActionState | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState(null);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await moderatePlaygroundAction(fd);
      setState(r);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-[17px] font-medium text-zinc-800"
          >
            공고 제목
          </label>
          <input
            id="title"
            name="title"
            required
            className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25"
            placeholder="예: 편의점 야간 스태프"
          />
          <p className="mt-2 text-[14px] text-zinc-500">
            제목만 입력해도 됩니다. 본문은 비워 두면 빈 문자열로 검사합니다.
          </p>
        </div>
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-[17px] font-medium text-zinc-800"
          >
            본문 (선택)
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-[18px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25"
            placeholder="공고 상세 내용"
          />
        </div>
        <BigButton type="submit" disabled={pending}>
          {pending ? "검사 중…" : "검수 파이프라인 실행"}
        </BigButton>
      </form>

      {state && !state.ok && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-[16px] text-red-800">
          {state.error}
        </p>
      )}

      {state && state.ok && (
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-[18px] font-semibold text-zinc-900">결과</h2>
          <dl className="space-y-2 text-[16px]">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-600">상태</dt>
              <dd className="font-medium text-zinc-900">
                {state.data.moderation_status}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-600">키워드 위험도</dt>
              <dd className="font-medium">{state.data.keywordScan.risk}</dd>
            </div>
            {state.data.keywordScan.matches.length > 0 && (
              <div>
                <dt className="text-zinc-600">매칭 키워드</dt>
                <dd className="mt-1 text-zinc-900">
                  {state.data.keywordScan.matches.join(", ")}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-600">AI 호출</dt>
              <dd>{state.data.aiCalled ? "예" : "아니오"}</dd>
            </div>
            {state.data.moderation_note && (
              <div>
                <dt className="text-zinc-600">메모</dt>
                <dd className="mt-1 whitespace-pre-wrap text-zinc-900">
                  {state.data.moderation_note}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
