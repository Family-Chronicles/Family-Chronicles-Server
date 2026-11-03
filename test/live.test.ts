import { afterEach, beforeEach, describe, expect, it } from "vitest";
import http from "http";
import { AddressInfo } from "net";
import request from "supertest";
import { WebSocket } from "ws";
import { auth, setup, TestApp } from "./helpers.js";
import { LIVE_PATH, LiveService } from "../src/services/live.srvs.js";

interface Message {
	type: string;
	entity?: string;
	action?: string;
	ids?: string[] | null;
}

/** Opens a socket and collects its messages */
function connect(port: number) {
	const socket = new WebSocket(`ws://127.0.0.1:${port}${LIVE_PATH}`);
	const messages: Message[] = [];
	socket.on("message", (raw) => messages.push(JSON.parse(raw.toString())));
	const opened = new Promise((resolve) => socket.once("open", resolve));
	const closed = new Promise<number>((resolve) =>
		socket.once("close", (code) => resolve(code))
	);
	return { socket, messages, opened, closed };
}

const waitFor = async (check: () => boolean, ms = 2000) => {
	const start = Date.now();
	while (!check()) {
		if (Date.now() - start > ms) throw new Error("timeout");
		await new Promise((r) => setTimeout(r, 10));
	}
};

describe("live updates", () => {
	let t: TestApp;
	let server: http.Server;
	let live: LiveService;
	let port: number;

	beforeEach(async () => {
		t = await setup();
		server = http.createServer(t.app);
		live = new LiveService(server, t.ctx.auth, t.ctx.events);
		await new Promise<void>((resolve) =>
			server.listen(0, "127.0.0.1", resolve)
		);
		port = (server.address() as AddressInfo).port;
	});

	afterEach(async () => {
		live.close();
		await new Promise((resolve) => server.close(resolve));
	});

	it("sends change events to authenticated clients", async () => {
		const viewer = await t.tokenFor("Viewer");
		const c = connect(port);
		await c.opened;
		c.socket.send(JSON.stringify({ type: "auth", token: viewer }));
		await waitFor(() => c.messages.some((m) => m.type === "ready"));

		const person = await request(t.app)
			.post("/api/v1/persons")
			.set(auth(t.adminToken))
			.send({ FirstNames: "Anna", LastNames: "Schmidt" })
			.expect(201);

		await waitFor(() => c.messages.some((m) => m.type === "change"));
		expect(c.messages.find((m) => m.type === "change")).toEqual({
			type: "change",
			entity: "persons",
			action: "created",
			ids: [person.body.Id],
		});
		// viewers do not get user management events
		expect(c.messages.some((m) => m.entity === "users")).toBe(false);
		c.socket.close();
	});

	it("closes connections with an invalid token", async () => {
		const c = connect(port);
		await c.opened;
		c.socket.send(JSON.stringify({ type: "auth", token: "nope" }));
		expect(await c.closed).toBe(4001);
	});

	it("rejects other upgrade paths", async () => {
		const socket = new WebSocket(`ws://127.0.0.1:${port}/somewhere`);
		await new Promise((resolve) => socket.once("error", resolve));
	});
});
