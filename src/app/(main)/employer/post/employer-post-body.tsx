"use client";

import { JobPostDraftForm } from "@/components/employer/job-post-draft-form";
import { IdentityVerificationExplainer } from "@/components/auth/identity-verification-explainer";

type Props = {
  /** false 이면 공고 폼 대신 본인인증 안내만 */
  allowPosting: boolean;
};

export function EmployerPostBody({ allowPosting }: Props) {
  if (!allowPosting) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <IdentityVerificationExplainer variant="employer_post" />
      </div>
    );
  }
  return <JobPostDraftForm />;
}
