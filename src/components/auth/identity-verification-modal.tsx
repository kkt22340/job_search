"use client";

import { IdentityVerificationExplainer } from "@/components/auth/identity-verification-explainer";

type Variant = "employer_post" | "senior_trust";

type Props = {
  open: boolean;
  variant: Variant;
  onClose: () => void;
  title?: string;
};

export function IdentityVerificationModal({
  open,
  variant,
  onClose,
  title,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idv-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(85vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2
            id="idv-modal-title"
            className="text-[20px] font-semibold text-zinc-900"
          >
            {title ??
              (variant === "employer_post"
                ? "본인인증이 필요해요"
                : "본인인증 (선택)")}
          </h2>
        </div>
        <div className="px-5 py-4">
          <IdentityVerificationExplainer variant={variant} />
        </div>
        <div className="border-t border-zinc-100 p-3">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-zinc-100 text-[17px] font-semibold text-zinc-800 active:bg-zinc-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
