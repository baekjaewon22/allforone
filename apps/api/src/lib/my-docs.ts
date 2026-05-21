import { MyDocsClient } from "@all-for-one/connectors-my-docs";
import type { AppEnv } from "../index";

export function createMyDocsClient(env: AppEnv["Bindings"]): MyDocsClient {
	return new MyDocsClient({
		baseUrl: env.MY_DOCS_API_BASE_URL ?? "https://my-docs.kr/api",
		serviceToken: env.MY_DOCS_SERVICE_TOKEN_READ,
	});
}
