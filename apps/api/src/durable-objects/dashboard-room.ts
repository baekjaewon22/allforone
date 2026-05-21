import { z } from "zod";

type DashboardMessage = {
	type: "dashboard:update" | "dashboard:ping";
	payload?: unknown;
};

const dashboardMessageSchema = z.object({
	type: z.enum(["dashboard:update", "dashboard:ping"]),
	payload: z.unknown().optional(),
});

export class DashboardRoom implements DurableObject {
	private readonly sockets = new Set<WebSocket>();

	constructor(private readonly state: DurableObjectState) {}

	async fetch(request: Request): Promise<Response> {
		const upgrade = request.headers.get("upgrade");

		if (upgrade !== "websocket") {
			return Response.json({
				ok: true,
				roomId: this.state.id.toString(),
				status: "dashboard_room_ready",
			});
		}

		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		server.accept();
		this.sockets.add(server);
		server.addEventListener("message", (event) => {
			this.handleMessage(server, event.data);
		});
		server.addEventListener("close", () => {
			this.sockets.delete(server);
		});
		server.addEventListener("error", () => {
			this.sockets.delete(server);
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	private handleMessage(sender: WebSocket, data: unknown): void {
		if (typeof data !== "string") {
			return;
		}

		const message = this.parseMessage(data);
		if (!message) {
			return;
		}

		this.broadcast(message, sender);
	}

	private parseMessage(data: string): DashboardMessage | undefined {
		try {
			return dashboardMessageSchema.parse(JSON.parse(data));
		} catch {
			return undefined;
		}
	}

	private broadcast(message: DashboardMessage, sender: WebSocket): void {
		const data = JSON.stringify(message);

		for (const socket of this.sockets) {
			if (socket !== sender) {
				socket.send(data);
			}
		}
	}
}
