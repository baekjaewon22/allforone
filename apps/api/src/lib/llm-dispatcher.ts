import type { LlmProvider, LlmProviderId, NewLlmChat } from "@all-for-one/shared";
import type { Bindings } from "../index";

export type LlmDispatchResult = {
	provider: LlmProviderId;
	model: string;
	response: string;
	status: "completed" | "fallback" | "failed";
	usage?: {
		inputTokens?: number;
		outputTokens?: number;
		totalTokens?: number;
	};
};

const defaultGeminiModel = "gemini-2.5-flash";

export function listLlmProviders(env: Bindings): LlmProvider[] {
	return [
		{
			id: "gemini",
			name: "Gemini Free Tier",
			model: env.GEMINI_MODEL ?? defaultGeminiModel,
			status: env.GEMINI_API_KEY ? "ready" : "needs_key",
			freeTier: true,
			description: "Google AI Studio API Key로 시작하는 무료 우선 LLM 연결입니다.",
		},
		{
			id: "openrouter",
			name: "OpenRouter Free Models",
			model: env.OPENROUTER_MODEL ?? "openrouter/free",
			status: env.OPENROUTER_API_KEY ? "ready" : "needs_key",
			freeTier: true,
			description: "무료 모델 풀을 보조 provider로 사용할 수 있습니다.",
		},
		{
			id: "ollama",
			name: "Ollama Local",
			model: env.OLLAMA_MODEL ?? "llama3.2",
			status: env.OLLAMA_BASE_URL ? "local_only" : "disabled",
			freeTier: true,
			description: "내 PC에서 직접 돌리는 로컬 LLM입니다. 배포 환경에서는 별도 터널이 필요합니다.",
		},
	];
}

export async function dispatchLlm(
	env: Bindings,
	input: NewLlmChat,
): Promise<LlmDispatchResult> {
	const provider = input.provider ?? "gemini";
	if (provider === "gemini") {
		return callGemini(env, input);
	}

	return {
		provider,
		model: input.model ?? provider,
		status: "fallback",
		response: `${provider} 연결은 준비되어 있지만 아직 API Key가 설정되지 않았습니다. 현재는 Gemini 무료 API를 1순위로 연결하는 단계입니다.`,
	};
}

async function callGemini(
	env: Bindings,
	input: NewLlmChat,
): Promise<LlmDispatchResult> {
	const model = input.model ?? env.GEMINI_MODEL ?? defaultGeminiModel;
	if (!env.GEMINI_API_KEY) {
		return {
			provider: "gemini",
			model,
			status: "fallback",
			response:
				"Gemini 무료 API Key가 아직 설정되지 않았습니다. Google AI Studio에서 API Key를 만든 뒤 `wrangler secret put GEMINI_API_KEY --config infra/wrangler.toml --env dev`로 저장하면 바로 호출됩니다.",
		};
	}

	const prompt = buildPrompt(input);
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				contents: [
					{
						role: "user",
						parts: [{ text: prompt }],
					},
				],
				generationConfig: {
					temperature: input.intent === "command_preview" ? 0.2 : 0.5,
					maxOutputTokens: 1200,
				},
			}),
		},
	);
	const body = (await response.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
		usageMetadata?: {
			promptTokenCount?: number;
			candidatesTokenCount?: number;
			totalTokenCount?: number;
		};
		error?: { message?: string };
	};

	if (!response.ok) {
		return {
			provider: "gemini",
			model,
			status: "failed",
			response: body.error?.message ?? "Gemini API 호출에 실패했습니다.",
		};
	}

	return {
		provider: "gemini",
		model,
		status: "completed",
		response:
			body.candidates?.[0]?.content?.parts
				?.map((part) => part.text ?? "")
				.join("\n")
				.trim() || "응답 내용이 비어 있습니다.",
		usage: {
			inputTokens: body.usageMetadata?.promptTokenCount,
			outputTokens: body.usageMetadata?.candidatesTokenCount,
			totalTokens: body.usageMetadata?.totalTokenCount,
		},
	};
}

function buildPrompt(input: NewLlmChat) {
	const intentGuide =
		input.intent === "summarize"
			? "다음 내용을 한국어로 짧고 실행 가능한 요약으로 정리해줘."
			: input.intent === "command_preview"
				? "사용자의 요청을 실제 실행 전 검토 가능한 작업 초안으로 정리해줘. 위험한 write/admin 실행은 확인 필요로 표시해줘."
				: "너는 All For One 개인 운영 대시보드 안의 업무 비서다. 한국어로 간결하고 실용적으로 답해줘.";

	return [
		intentGuide,
		input.context ? `컨텍스트:\n${JSON.stringify(input.context, null, 2)}` : "",
		`사용자 요청:\n${input.message}`,
	]
		.filter(Boolean)
		.join("\n\n");
}
