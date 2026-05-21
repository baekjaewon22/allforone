import { z, type ZodType } from "zod";

export class ValidationError extends Error {
	constructor(
		readonly source: "body" | "params" | "query",
		readonly issues: z.core.$ZodIssue[],
	) {
		super(`Invalid ${source}`);
	}
}

export const emptySchema = z.object({}).strict();

export function parseInput<T>(
	source: ValidationError["source"],
	schema: ZodType<T>,
	value: unknown,
): T {
	const parsed = schema.safeParse(value);

	if (!parsed.success) {
		throw new ValidationError(source, parsed.error.issues);
	}

	return parsed.data;
}

export async function parseJsonBody<T>(
	request: Request,
	schema: ZodType<T>,
): Promise<T> {
	const contentType = request.headers.get("content-type") ?? "";
	const value = contentType.includes("application/json")
		? await request.json()
		: {};

	return parseInput("body", schema, value);
}

export function toValidationResponse(error: unknown): Response | undefined {
	if (!(error instanceof ValidationError)) {
		return undefined;
	}

	return Response.json(
		{
			ok: false,
			error: "validation_error",
			source: error.source,
			issues: error.issues,
		},
		{ status: 400 },
	);
}
