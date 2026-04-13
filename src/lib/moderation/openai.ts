/**
 * OpenAI 호출은 배치·선별 검사에만 사용(PRD §6.4).
 * 실패 시 null 반환 — 호출부에서 키워드 결과만으로 판단 가능해야 함.
 */

export type AiModerationJson = {
  risk_score: number;
  reason_short: string;
  recommendation: "approve" | "needs_review" | "reject";
};

const SYSTEM = `당신은 한국 직업정보 플랫폼의 공고 검수 보조입니다.
다음 JSON 스키마로만 응답하세요.
{"risk_score": 0~1 사이 소수, "reason_short": "한 줄 이유(한국어)", "recommendation": "approve"|"needs_review"|"reject"}
- 직업·근로와 무관한 투자·다단계·불법 의심이면 risk_score를 높이고 needs_review 또는 reject.
- 정상 구인 공고면 approve.
- 애매하면 needs_review.`;

export async function moderateWithOpenAI(
  title: string,
  description: string
): Promise<{ parsed: AiModerationJson; rawText: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODERATION_MODEL?.trim() || "gpt-4o-mini";
  const userContent = `제목:\n${title}\n\n본문:\n${description || "(없음)"}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[moderation] OpenAI HTTP error", res.status, err);
    return null;
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const rawText = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!rawText) return null;

  try {
    const parsed = JSON.parse(rawText) as AiModerationJson;
    if (
      typeof parsed.risk_score !== "number" ||
      !["approve", "needs_review", "reject"].includes(parsed.recommendation)
    ) {
      return null;
    }
    return { parsed, rawText };
  } catch {
    return null;
  }
}
