"use client";

import {
  Armchair,
  Calendar,
  Car,
  Footprints,
  GraduationCap,
  HeartHandshake,
  MessageCircle,
  Monitor,
  Store,
  Sun,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AVAILABILITY_OPTIONS,
  CATEGORY_OPTIONS,
  TAG_OPTIONS,
  type SeniorProfileDraft,
  emptySeniorProfileDraft,
} from "@/domain/senior-profile";
import { getSeniorProfileStorage } from "@/lib/storage/senior-profile-storage";
import {
  loadSeniorResumeForUser,
  seniorDraftFromProfileJson,
  upsertSeniorProfileCloud,
} from "@/lib/senior-profile/sync-client";
import { IdentityVerificationModal } from "@/components/auth/identity-verification-modal";
import { BigButton } from "@/components/ui/big-button";
import { StepHeader } from "@/components/ui/step-header";
import { skipIdentityGate } from "@/lib/auth/identity-policy";
import { createClient } from "@/lib/supabase";

const AVAIL_ICONS: Record<string, LucideIcon> = {
  Sunrise,
  Sun,
  Calendar,
  MessageCircle,
};
const CAT_ICONS: Record<string, LucideIcon> = {
  Store,
  GraduationCap,
  HeartHandshake,
  Monitor,
};
const TAG_ICONS: Record<string, LucideIcon> = {
  Armchair,
  Footprints,
  Car,
};

const TOTAL_STEPS = 4;

export function SeniorResumeWizard() {
  const storage = useMemo(() => getSeniorProfileStorage(), []);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<SeniorProfileDraft>(emptySeniorProfileDraft);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [trustModalOpen, setTrustModalOpen] = useState(false);
  const [showTrustCta, setShowTrustCta] = useState(false);

  const canCloudSyncRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    canCloudSyncRef.current = false;

    (async () => {
      setSyncBanner("불러오는 중…");
      const result = await loadSeniorResumeForUser();
      if (cancelled) return;

      if (result.kind === "anonymous") {
        setSyncBanner(
          "로그인하면 이력서가 Supabase 계정에 저장되어 웹·모바일 앱에서 같이 쓸 수 있어요."
        );
        setDraft(storage.load());
        return;
      }

      if (result.kind === "non_senior") {
        setSyncBanner(
          "시니어 유형으로 가입·로그인한 경우에만 계정 동기화가 켜져요. 지금은 이 기기에만 저장됩니다."
        );
        setDraft(storage.load());
        return;
      }

      canCloudSyncRef.current = true;
      const local = storage.load();
      const row = result.row;

      if (row?.profile) {
        const fromServer = seniorDraftFromProfileJson(row.profile);
        if (fromServer) {
          const serverTs = new Date(row.updated_at).getTime();
          const localTs = new Date(local.updatedAt).getTime();
          if (Number.isFinite(serverTs) && serverTs >= localTs) {
            setDraft(fromServer);
            storage.save(fromServer);
            setSyncBanner(
              "계정에 저장된 이력서를 불러왔어요. 수정하면 잠시 후 자동으로 다시 저장돼요."
            );
            return;
          }
        }
      }

      setDraft(local);
      setSyncBanner(
        "이 기기 초안을 사용 중이에요. 수정 내용은 계정에도 맞춰 저장됩니다."
      );
    })().catch(() => {
      if (!cancelled) {
        setSyncBanner("서버에서 불러오지 못했어요. 이 기기에만 저장된 초안을 씁니다.");
        setDraft(storage.load());
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storage]);

  useEffect(() => {
    if (skipIdentityGate()) {
      setShowTrustCta(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setShowTrustCta(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, identity_verified_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setShowTrustCta(
        profile?.role === "senior" && profile.identity_verified_at == null
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const runCloudSave = useCallback(async (next: SeniorProfileDraft) => {
    if (!canCloudSyncRef.current) return;
    setSaveError(null);
    try {
      await upsertSeniorProfileCloud(next);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "계정 저장에 실패했어요.";
      setSaveError(msg);
    }
  }, []);

  const persist = useCallback(
    (next: SeniorProfileDraft) => {
      const withTime: SeniorProfileDraft = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      setDraft(withTime);
      storage.save(withTime);

      if (!canCloudSyncRef.current) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void runCloudSave(withTime);
      }, 650);
    },
    [runCloudSave, storage]
  );

  const toggleId = (list: string[], id: string, max?: number) => {
    const has = list.includes(id);
    if (has) return list.filter((x) => x !== id);
    if (max != null && list.length >= max) return list;
    return [...list, id];
  };

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finalizeSave = useCallback(async () => {
    const withTime: SeniorProfileDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    setDraft(withTime);
    storage.save(withTime);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (canCloudSyncRef.current) {
      setSaveError(null);
      try {
        await upsertSeniorProfileCloud(withTime);
        alert("간편 이력서를 이 기기와 계정에 저장했어요.");
      } catch (e) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message?: string }).message)
            : "계정 저장에 실패했어요.";
        setSaveError(msg);
      }
    } else {
      alert(
        "이 기기에 저장했어요. 시니어 계정으로 로그인하면 웹·앱에서 같은 이력서를 쓸 수 있어요."
      );
    }
  }, [draft, storage]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {syncBanner ? (
        <div className="shrink-0 border-b border-zinc-200 bg-blue-50/90 px-4 py-3 text-[14px] leading-relaxed text-blue-950">
          {syncBanner}
        </div>
      ) : null}
      {saveError ? (
        <div
          className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-[14px] text-red-900"
          role="alert"
        >
          {saveError}
        </div>
      ) : null}
      {showTrustCta ? (
        <div className="shrink-0 border-b border-violet-200 bg-violet-50/95 px-4 py-3 text-[14px] leading-relaxed text-violet-950">
          <span className="font-medium">신뢰도 향상 (선택)</span>
          <span className="mt-1 block text-violet-900/95">
            본인인증을 완료하면 고용주에게 더 신뢰받기 쉬워요. 가입 시가 아니라
            여기서만 안내합니다.
          </span>
          <button
            type="button"
            onClick={() => setTrustModalOpen(true)}
            className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-violet-300 bg-white text-[16px] font-semibold text-violet-900 active:bg-violet-100/80"
          >
            본인인증 안내 보기
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-6">
        {step === 1 && (
          <>
            <StepHeader
              step={1}
              total={TOTAL_STEPS}
              title="언제 일할 수 있나요?"
              description="해당하는 시간을 모두 눌러 주세요."
            />
            <div className="grid grid-cols-2 gap-3">
              {AVAILABILITY_OPTIONS.map((opt) => {
                const Icon = AVAIL_ICONS[opt.icon] ?? Sun;
                const on = draft.availabilityIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      persist({
                        ...draft,
                        availabilityIds: toggleId(
                          draft.availabilityIds,
                          opt.id
                        ),
                      })
                    }
                    className={`flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-colors ${
                      on
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-zinc-200 bg-white text-zinc-800"
                    }`}
                  >
                    <Icon className="h-8 w-8" strokeWidth={2} />
                    <span className="text-[16px] font-semibold leading-tight">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeader
              step={2}
              total={TOTAL_STEPS}
              title="어떤 일에 관심 있나요?"
              description="가까운 분야를 골라 주세요. (여러 개 가능)"
            />
            <div className="grid grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map((opt) => {
                const Icon = CAT_ICONS[opt.icon] ?? Store;
                const on = draft.categorySlugs.includes(opt.slug);
                return (
                  <button
                    key={opt.slug}
                    type="button"
                    onClick={() =>
                      persist({
                        ...draft,
                        categorySlugs: toggleId(draft.categorySlugs, opt.slug),
                      })
                    }
                    className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-colors ${
                      on
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-zinc-200 bg-white text-zinc-800"
                    }`}
                  >
                    <Icon className="h-9 w-9" strokeWidth={2} />
                    <span className="text-[16px] font-semibold leading-snug">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <StepHeader
              step={3}
              total={TOTAL_STEPS}
              title="일하는 방식은요?"
              description="해당하면 눌러 주세요."
            />
            <div className="flex flex-col gap-3">
              {TAG_OPTIONS.map((opt) => {
                const Icon = TAG_ICONS[opt.icon] ?? Armchair;
                const on = draft.tagIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      persist({
                        ...draft,
                        tagIds: toggleId(draft.tagIds, opt.id),
                      })
                    }
                    className={`flex min-h-[60px] flex-row items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                      on
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-zinc-200 bg-white text-zinc-800"
                    }`}
                  >
                    <Icon className="h-8 w-8 shrink-0" strokeWidth={2} />
                    <span className="text-[17px] font-semibold">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <StepHeader
              step={4}
              total={TOTAL_STEPS}
              title="연락처와 한 마디"
              description="채용 확정 전에는 고용주에게 연락처가 가려질 수 있어요."
            />
            <label className="mb-4 block">
              <span className="mb-2 block text-[16px] font-medium text-zinc-700">
                휴대전화 (선택)
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="010-0000-0000"
                value={draft.phone}
                onChange={(e) =>
                  persist({ ...draft, phone: e.target.value })
                }
                className="min-h-[56px] w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-[18px] outline-none focus:border-blue-500"
              />
            </label>
            <label className="mb-6 block">
              <span className="mb-2 block text-[16px] font-medium text-zinc-700">
                나를 소개하는 한 줄 (선택)
              </span>
              <textarea
                rows={3}
                placeholder="예: 성실하게 오래 일했어요."
                value={draft.bio}
                onChange={(e) => persist({ ...draft, bio: e.target.value })}
                className="w-full resize-none rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-[18px] leading-relaxed outline-none focus:border-blue-500"
              />
            </label>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-[15px] leading-relaxed text-zinc-600">
              <p className="font-medium text-zinc-800">저장 안내</p>
              <p className="mt-2">
                시니어로 로그인한 경우 같은 내용이{" "}
                <strong>Supabase 계정(senior_profiles)</strong>에도 저장되어
                웹과 모바일 앱(Expo 등)에서 동일 데이터를 불러올 수 있어요. 로그인
                전에는 이 브라우저에만 남습니다.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {step < TOTAL_STEPS ? (
            <>
              <BigButton
                type="button"
                onClick={next}
                disabled={
                  (step === 1 && draft.availabilityIds.length === 0) ||
                  (step === 2 && draft.categorySlugs.length === 0)
                }
              >
                다음
              </BigButton>
              <BigButton
                type="button"
                variant="secondary"
                onClick={back}
                disabled={step === 1}
              >
                이전
              </BigButton>
            </>
          ) : (
            <>
              <BigButton type="button" onClick={() => void finalizeSave()}>
                저장 완료
              </BigButton>
              <BigButton type="button" variant="secondary" onClick={back}>
                이전
              </BigButton>
            </>
          )}
        </div>
      </div>

      <IdentityVerificationModal
        open={trustModalOpen}
        variant="senior_trust"
        onClose={() => setTrustModalOpen(false)}
      />
    </div>
  );
}
