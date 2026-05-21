import { mockConnector } from "@all-for-one/connectors-mock";
import { myDocsConnector } from "@all-for-one/connectors-my-docs";

export type { Connector } from "@all-for-one/connectors-base";
export { myDocsConnector } from "@all-for-one/connectors-my-docs";
export { mockConnector } from "@all-for-one/connectors-mock";

export const enabledConnectors = [mockConnector, myDocsConnector];
