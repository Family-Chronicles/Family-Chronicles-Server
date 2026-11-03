import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { AuthService, AuthUser } from "./auth.srvs.js";
import { ChangeBus } from "./events.srvs.js";

export const LIVE_PATH = "/api/v1/live";
const AUTH_TIMEOUT_MS = 5000;
const HEARTBEAT_MS = 30000;

/** Entities a client gets change events for, by role */
const PUBLIC_ENTITIES = [
	"persons",
	"families",
	"memberships",
	"relationships",
	"media",
	"tags",
	"links",
	"peers",
];

interface Client {
	socket: WebSocket;
	user: (AuthUser & { ExpiresAt: number }) | null;
	alive: boolean;
}

/**
 * WebSocket endpoint for live updates.
 *
 * Protocol (JSON messages):
 *   client → { "type": "auth", "token": "<JWT>" }      must be the first message, within 5 s
 *   server → { "type": "ready" }
 *   server → { "type": "change", "entity": "persons", "action": "updated", "ids": ["…"] }
 *
 * The token is sent as a message instead of the URL so it does not end up in access logs.
 */
export class LiveService {
	private wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
	private clients = new Set<Client>();
	private heartbeat: NodeJS.Timeout;
	private unsubscribe: () => void;

	constructor(
		server: HttpServer,
		private readonly auth: AuthService,
		bus: ChangeBus
	) {
		server.on("upgrade", (req, socket, head) => {
			const path = (req.url ?? "").split("?")[0];
			if (path !== LIVE_PATH) {
				socket.destroy();
				return;
			}
			this.wss.handleUpgrade(req, socket, head, (ws) => this.accept(ws));
		});

		this.unsubscribe = bus.subscribe((event) => {
			const message = JSON.stringify({
				type: "change",
				entity: event.Entity,
				action: event.Action,
				ids: event.Ids,
			});
			for (const client of this.clients) {
				if (!client.user || client.socket.readyState !== WebSocket.OPEN)
					continue;
				if (client.user.ExpiresAt < Date.now()) {
					client.socket.close(4001, "Token expired");
					continue;
				}
				const allowed =
					PUBLIC_ENTITIES.includes(event.Entity) ||
					(event.Entity === "users" && client.user.Role === "Admin");
				if (allowed) client.socket.send(message);
			}
		});

		this.heartbeat = setInterval(() => {
			for (const client of this.clients) {
				if (!client.alive) {
					client.socket.terminate();
					continue;
				}
				client.alive = false;
				client.socket.ping();
			}
		}, HEARTBEAT_MS);
	}

	private accept(socket: WebSocket): void {
		const client: Client = { socket, user: null, alive: true };
		this.clients.add(client);
		const timeout = setTimeout(() => {
			if (!client.user) socket.close(4001, "Authentication required");
		}, AUTH_TIMEOUT_MS);

		socket.on("pong", () => (client.alive = true));
		socket.on("close", () => {
			clearTimeout(timeout);
			this.clients.delete(client);
		});
		socket.on("message", async (raw) => {
			if (client.user) return; // clients only send the auth message
			try {
				const message = JSON.parse(raw.toString());
				if (
					message?.type !== "auth" ||
					typeof message.token !== "string"
				) {
					throw new Error("Expected auth message");
				}
				client.user = await this.auth.verify(message.token);
				clearTimeout(timeout);
				socket.send(JSON.stringify({ type: "ready" }));
			} catch {
				socket.close(4001, "Authentication failed");
			}
		});
	}

	public get connectedClients(): number {
		return [...this.clients].filter((c) => c.user).length;
	}

	public close(): void {
		clearInterval(this.heartbeat);
		this.unsubscribe();
		for (const client of this.clients) client.socket.terminate();
		this.wss.close();
	}
}
