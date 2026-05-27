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
const defaultOpenRouterModel = "openrouter/free";

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
			model: env.OPENROUTER_MODEL ?? defaultOpenRouterModel,
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
			description: "로컬 PC에서만 동작하는 LLM입니다. 핸드폰/배포 환경에서는 OpenRouter 또는 Gemini를 사용합니다.",
		},
	];
}

export async function dispatchLlm(
	env: Bindings,
	input: NewLlmChat,
): Promise<LlmDispatchResult> {
	const provider = input.provider ?? "gemini";
	if (provider === "gemini") {
		const result = await callGemini(env, input);
		if (result.status === "failed" && env.OPENROUTER_API_KEY) {
			return callOpenRouter(env, {
				...input,
				provider: "openrouter",
				context: {
					...(input.context ?? {}),
					fallbackFrom: "gemini",
					fallbackReason: result.response,
				},
			});
		}

		return result;
	}

	if (provider === "openrouter") {
		return callOpenRouter(env, input);
	}

	return {
		provider,
		model: input.model ?? provider,
		status: "fallback",
		response: `${provider} 연결은 준비되어 있지만 아직 API Key가 설정되지 않았습니다. 현재는 Gemini 무료 API를 1순위로 연결하는 단계입니다.`,
	};
}

async function callOpenRouter(
	env: Bindings,
	input: NewLlmChat,
): Promise<LlmDispatchResult> {
	const model = input.model ?? env.OPENROUTER_MODEL ?? defaultOpenRouterModel;
	if (!env.OPENROUTER_API_KEY) {
		return {
			provider: "openrouter",
			model,
			status: "fallback",
			response:
				"OpenRouter API Key가 아직 설정되지 않았습니다. `wrangler secret put OPENROUTER_API_KEY --config infra/wrangler.toml --env dev`로 저장하면 무료 모델을 호출합니다.",
		};
	}

	const prompt = await buildPrompt(input);
	const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
			"http-referer": "https://all-for-one-db9.pages.dev",
			"x-title": "All For One",
		},
		body: JSON.stringify({
			model,
			messages: [
				{
					role: "system",
					content:
						"너는 All For One 개인 운영 대시보드 안의 업무 비서다. 한국어로 간결하고 실용적으로 답한다.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: input.intent === "command_preview" ? 0.2 : 0.5,
			max_tokens: 1200,
		}),
	});
	const body = (await response.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
		usage?: {
			prompt_tokens?: number;
			completion_tokens?: number;
			total_tokens?: number;
		};
		error?: { message?: string };
	};

	if (!response.ok) {
		return {
			provider: "openrouter",
			model,
			status: "failed",
			response: body.error?.message ?? "OpenRouter API 호출에 실패했습니다.",
		};
	}

	return {
		provider: "openrouter",
		model,
		status: "completed",
		response: body.choices?.[0]?.message?.content?.trim() || "응답 내용이 비어 있습니다.",
		usage: {
			inputTokens: body.usage?.prompt_tokens,
			outputTokens: body.usage?.completion_tokens,
			totalTokens: body.usage?.total_tokens,
		},
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

	const prompt = await buildPrompt(input);
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

async function buildPrompt(input: NewLlmChat) {
	const context = input.context ? { ...input.context } : undefined;
	const weather = await getWeatherContext(context);
	if (weather && context) {
		context.weather = weather;
		input.context = context;
	}

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

async function getWeatherContext(context?: Record<string, unknown>) {
	const coordinates = parseCoordinates(context?.location);
	if (!coordinates) {
		return undefined;
	}

	try {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.set("latitude", String(coordinates.latitude));
		url.searchParams.set("longitude", String(coordinates.longitude));
		url.searchParams.set(
			"current",
			"temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
		);
		url.searchParams.set("timezone", "auto");

		const response = await fetch(url);
		if (!response.ok) {
			return undefined;
		}

		const body = (await response.json()) as {
			current?: {
				time?: string;
				temperature_2m?: number;
				relative_humidity_2m?: number;
				weather_code?: number;
				wind_speed_10m?: number;
			};
			current_units?: Record<string, string>;
			timezone?: string;
		};
		if (!body.current) {
			return undefined;
		}

		return {
			source: "open-meteo",
			timezone: body.timezone,
			time: body.current.time,
			temperature: formatWeatherValue(body.current.temperature_2m, body.current_units?.temperature_2m),
			humidity: formatWeatherValue(
				body.current.relative_humidity_2m,
				body.current_units?.relative_humidity_2m,
			),
			windSpeed: formatWeatherValue(body.current.wind_speed_10m, body.current_units?.wind_speed_10m),
			weatherCode: body.current.weather_code,
		};
	} catch {
		return undefined;
	}
}

function parseCoordinates(location: unknown) {
	if (typeof location !== "string") {
		return undefined;
	}

	const match =
		location.match(/위도\s*(-?\d+(?:\.\d+)?)[,\s]+경도\s*(-?\d+(?:\.\d+)?)/) ??
		location.match(/lat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)[,\s]+lon(?:gitude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i);
	if (!match) {
		return undefined;
	}

	const latitude = Number(match[1]);
	const longitude = Number(match[2]);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return undefined;
	}

	return { latitude, longitude };
}

function formatWeatherValue(value?: number, unit?: string) {
	return typeof value === "number" ? `${value}${unit ?? ""}` : undefined;
}
