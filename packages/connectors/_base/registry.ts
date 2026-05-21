import type { Connector } from "./types";

export class ConnectorRegistry {
	readonly #connectors = new Map<string, Connector>();

	register(connector: Connector): Connector {
		if (this.#connectors.has(connector.id)) {
			throw new Error(`Connector already registered: ${connector.id}`);
		}

		this.#connectors.set(connector.id, connector);
		return connector;
	}

	get(id: string): Connector | undefined {
		return this.#connectors.get(id);
	}

	require(id: string): Connector {
		const connector = this.get(id);
		if (!connector) {
			throw new Error(`Connector not registered: ${id}`);
		}

		return connector;
	}

	list(): Connector[] {
		return [...this.#connectors.values()];
	}

	has(id: string): boolean {
		return this.#connectors.has(id);
	}

	clear(): void {
		this.#connectors.clear();
	}
}

export const createConnectorRegistry = (
	connectors: Connector[] = [],
): ConnectorRegistry => {
	const registry = new ConnectorRegistry();
	for (const connector of connectors) {
		registry.register(connector);
	}

	return registry;
};

export const connectorRegistry = createConnectorRegistry();
