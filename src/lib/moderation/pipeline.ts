import { scanSuspiciousKeywords, type KeywordScanResult } from "./keywords";
import { moderateWithOpenAI, type AiModerationJson } from "./openai";

export type ModerationStatusOutcome =
  | "pending"
  | "approved"
  | "needs_review"
  | "rejected";

export type PipelineResult = {
  moderation_status: ModerationStatusOutcome;
  moderation_note: string | null;
  keywordScan: KeywordScanResult;
  aiCalled: boolean;
  aiResult: AiModerationJson | null;
  aiRawText: string | null;
};

/**
 * 키워드 → (정책에 따라) OpenAI → 최종 상태.
 * - high 키워드: AI 없이 needs_review (비용 절감).
 * - medium/low/none: OPENAI_API_KEY가 있으면 AI, 없으면 키워드만으로 승인/검수.
 */
export async function runModerationPipeline(input: {
  title: string;
  description: string;
}): Promise<PipelineResult> {
  const keywordScan = scanSuspiciousKeywords(input.title, input.description);

  if (keywordScan.risk === "high") {
    return {
      moderation_status: "needs_review",
      moderation_note: `키워드 선별: ${keywordScan.matches.join(", ")}`,
      keywordScan,
      aiCalled: false,
      aiResult: null,
      aiRawText: null,
    };
  }

  const shouldCallAi =
    process.env.OPENAI_API_KEY?.trim() &&
    (keywordScan.risk !== "none" ||
      process.env.MODERATION_AI_FOR_ALL === "true");

  if (!shouldCallAi) {
    if (keywordScan.risk === "none") {
      return {
        moderation_status: "approved",
        moderation_note: null,
        keywordScan,
        aiCalled: false,
        aiResult: null,
        aiRawText: null,
      };
    }
    return {
      moderation_status: "needs_review",
      moderation_note: `키워드 선별: ${keywordScan.matches.join(", ")}`,
      keywordScan,
      aiCalled: false,
      aiResult: null,
      aiRawText: null,
    };
  }

  const ai = await moderateWithOpenAI(input.title, input.description);
  if (!ai) {
    return {
      moderation_status:
        keywordScan.risk === "none" ? "approved" : "needs_review",
      moderation_note: keywordScan.matches.length
        ? `키워드 선별: ${keywordScan.matches.join(", ")} (AI 호출 실패)`
        : "AI 호출 실패 — 수동 검수 권장",
      keywordScan,
      aiCalled: true,
      aiResult: null,
      aiRawText: null,
    };
  }

  const { parsed, rawText } = ai;
  let status: ModerationStatusOutcome;
  if (parsed.recommendation === "approve" && parsed.risk_score < 0.35) {
    status = "approved";
  } else if (parsed.recommendation === "reject" || parsed.risk_score >= 0.85) {
    status = "needs_review";
  } else {
    status = "needs_review";
  }

  return {
    moderation_status: status,
    moderation_note: `[AI] ${parsed.reason_short} (risk ${parsed.risk_score.toFixed(2)})`,
    keywordScan,
    aiCalled: true,
    aiResult: parsed,
    aiRawText: rawText,
  };
}
