import { Router } from "express";
import crypto from "crypto";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, now, parse } from "../core/http.core.js";
import { Peer, PeerRequest, PersonLink } from "../models/federation.model.js";
import { Person, withSearchFields } from "../models/person.model.js";
import { hashPassword } from "../services/auth.srvs.js";
import { normalizePeerUrl, remoteName } from "../services/federation.srvs.js";
import {
	linkSchema,
	peerRequestSchema,
	peerSchema,
} from "../validation/schemas.js";

/** Never send the (encrypted) token */
const toPublicPeer = ({ TokenEncrypted, ...rest }: Peer) => rest;
const toPublicRequest = ({ TokenEncrypted, ...rest }: PeerRequest) => rest;

const MAX_PENDING_REQUESTS = 50;

/**
 * Connections to other Family Chronicles instances and links between
 * local persons and persons there. See docs/federation.md.
 */
export function federationController(ctx: AppContext): Router {
	const router = Router();
	const { peers, links, persons, peerRequests: requests } = ctx.repos;
	const read = ctx.auth.require("Viewer");
	const write = ctx.auth.require("Editor");
	const admin = ctx.auth.require("Admin");

	/** A viewer user plus API token another instance uses to read from this one */
	const createAccessFor = async (peerName: string): Promise<string> => {
		const user = {
			Id: crypto.randomUUID(),
			Name: `Instanz ${peerName}`.slice(0, 100),
			Email: `peer-${crypto.randomUUID()}@peers.invalid`,
			PasswordHash: await hashPassword(
				crypto.randomBytes(32).toString("hex")
			),
			Role: "Viewer" as const,
			CreatedAt: now(),
			UpdatedAt: now(),
		};
		await ctx.repos.users.create(user);
		const { token } = await ctx.auth.createApiToken(
			user,
			`Verbindung mit ${peerName}`.slice(0, 100),
			null
		);
		return token;
	};

	const loadPeer = async (id: string) => {
		const peer = await peers.findById(id);
		if (!peer) throw notFound("Instance");
		return peer;
	};

	/**
	 * GET /api/v1/federation/peers
	 * @tags federation
	 * @summary Connected instances (without tokens)
	 * @security BearerAuth
	 * @return {array<object>} 200 - peers
	 */
	router.get(
		"/peers",
		read,
		handle(async (req, res) => {
			const all = await peers.findAll();
			all.sort((a, b) => a.Name.localeCompare(b.Name));
			res.send(all.map(toPublicPeer));
		})
	);

	/**
	 * POST /api/v1/federation/peers
	 * @tags federation
	 * @summary Connect another instance (Admin). URL and token are checked first.
	 * @security BearerAuth
	 * @param {object} request.body.required - { Name, BaseUrl, Token }
	 * @return {object} 201 - peer
	 * @return {object} 400 - invalid URL, or the instance cannot be reached / rejects the token
	 */
	router.post(
		"/peers",
		admin,
		handle(async (req, res) => {
			const body = parse(peerSchema, req.body);
			const baseUrl = normalizePeerUrl(body.BaseUrl);
			if (body.Mutual && !ctx.config.server.publicUrl) {
				throw new HttpError(
					400,
					"Set PUBLIC_URL on this server to connect both ways"
				);
			}
			const status = await ctx.federation.check(baseUrl, body.Token);
			if (status === "Unreachable")
				throw new HttpError(
					400,
					"The instance cannot be reached at this URL"
				);
			if (status === "Unauthorized")
				throw new HttpError(400, "The instance rejected the token");
			const peer: Peer = {
				Id: crypto.randomUUID(),
				Name: body.Name,
				BaseUrl: baseUrl,
				TokenEncrypted: ctx.cipher.encrypt(body.Token),
				Status: status,
				CheckedAt: now(),
				CreatedAt: now(),
			};
			await peers.create(peer);

			// ask the other instance to connect back, with read access for it
			let requestError: string | null = null;
			if (body.Mutual) {
				try {
					const token = await createAccessFor(peer.Name);
					await ctx.federation.sendRequest(baseUrl, body.Token, {
						Name: ctx.config.server.instanceName,
						BaseUrl: ctx.config.server.publicUrl,
						Token: token,
						Message: body.Message,
					});
				} catch (error) {
					requestError =
						error instanceof Error ? error.message : String(error);
				}
			}
			res.status(201).send({
				...toPublicPeer(peer),
				RequestSent: body.Mutual && !requestError,
				RequestError: requestError,
			});
		})
	);

	/**
	 * POST /api/v1/federation/peers/{id}/check
	 * @tags federation
	 * @summary Check the connection again (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - peer id
	 * @return {object} 200 - peer with current status
	 */
	router.post(
		"/peers/:id/check",
		admin,
		handle(async (req, res) => {
			const peer = await loadPeer(req.params.id);
			const status = await ctx.federation.check(
				peer.BaseUrl,
				ctx.cipher.decrypt(peer.TokenEncrypted)
			);
			res.send(
				toPublicPeer(
					(await peers.update(peer.Id, {
						Status: status,
						CheckedAt: now(),
					}))!
				)
			);
		})
	);

	/**
	 * DELETE /api/v1/federation/peers/{id}
	 * @tags federation
	 * @summary Disconnect an instance and remove all links to it (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - peer id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/peers/:id",
		admin,
		handle(async (req, res) => {
			const peer = await loadPeer(req.params.id);
			await peers.delete(peer.Id);
			await links.deleteMany({ PeerId: peer.Id });
			res.send({ success: true });
		})
	);

	/**
	 * GET /api/v1/federation/peers/{id}/persons
	 * @tags federation
	 * @summary Search persons on another instance (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - peer id
	 * @param {string} q.query - search text
	 * @return {array<object>} 200 - persons of the other instance (basic fields)
	 */
	router.get(
		"/peers/:id/persons",
		write,
		handle(async (req, res) => {
			const peer = await loadPeer(req.params.id);
			const q =
				typeof req.query.q === "string"
					? req.query.q.slice(0, 200)
					: "";
			res.send(await ctx.federation.searchPersons(peer, q));
		})
	);

	/**
	 * GET /api/v1/federation/peers/{id}/persons/{remoteId}
	 * @tags federation
	 * @summary One person of another instance (Viewer)
	 * @security BearerAuth
	 * @param {string} id.path.required - peer id
	 * @param {string} remoteId.path.required - person id on the other instance
	 * @return {object} 200 - person (basic fields)
	 */
	router.get(
		"/peers/:id/persons/:remoteId",
		read,
		handle(async (req, res) => {
			const peer = await loadPeer(req.params.id);
			res.send(await ctx.federation.getPerson(peer, req.params.remoteId));
		})
	);

	/**
	 * GET /api/v1/federation/peers/{id}/persons/{remoteId}/tree
	 * @tags federation
	 * @summary Family tree of a person on another instance (Viewer)
	 * @security BearerAuth
	 * @param {string} id.path.required - peer id
	 * @param {string} remoteId.path.required - person id on the other instance
	 * @param {number} depth.query - generations (1-5, default 3)
	 * @return {object} 200 - tree with basic person fields
	 */
	router.get(
		"/peers/:id/persons/:remoteId/tree",
		read,
		handle(async (req, res) => {
			const peer = await loadPeer(req.params.id);
			res.send(
				await ctx.federation.getTree(
					peer,
					req.params.remoteId,
					Number(req.query.depth) || 3
				)
			);
		})
	);

	/**
	 * POST /api/v1/federation/peers/{id}/persons/{remoteId}/import
	 * @tags federation
	 * @summary Copy a person of another instance into this one and link both (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - peer id
	 * @param {string} remoteId.path.required - person id on the other instance
	 * @return {object} 201 - { Person, Link }
	 * @return {object} 409 - the remote person is already linked as the same person
	 */
	router.post(
		"/peers/:id/persons/:remoteId/import",
		write,
		handle(async (req, res) => {
			const peer = await loadPeer(req.params.id);
			const remote = await ctx.federation.getPerson(
				peer,
				req.params.remoteId
			);
			const existing = await links.findOne({
				PeerId: peer.Id,
				RemotePersonId: remote.Id,
				Relation: "SamePerson",
			});
			if (existing)
				throw new HttpError(
					409,
					"This person is already linked as the same person"
				);
			const gender = ["Male", "Female", "Diverse"].includes(remote.Gender)
				? remote.Gender
				: "Unknown";
			const person: Person = withSearchFields({
				Id: crypto.randomUUID(),
				FirstNames: remote.FirstNames.length
					? remote.FirstNames
					: ["?"],
				MiddleNames: remote.MiddleNames,
				LastNames: remote.LastNames,
				BirthName: remote.BirthName,
				Gender: gender as Person["Gender"],
				DateOfBirth: remote.DateOfBirth,
				PlaceOfBirth: remote.PlaceOfBirth,
				DateOfDeath: remote.DateOfDeath,
				PlaceOfDeath: remote.PlaceOfDeath,
				CauseOfDeath: null,
				Notes: `Übernommen aus ${peer.Name}`,
				Events: [],
				Sources: [
					{
						Title: peer.Name,
						Citation: `Person ${remote.Id}`,
						Url: null,
					},
				],
				CreatedAt: now(),
				UpdatedAt: now(),
			});
			await persons.create(person);
			const link: PersonLink = {
				Id: crypto.randomUUID(),
				PersonId: person.Id,
				PeerId: peer.Id,
				RemotePersonId: remote.Id,
				RemoteName: remoteName(remote).slice(0, 300),
				Relation: "SamePerson",
				Notes: "",
				CreatedAt: now(),
			};
			await links.create(link);
			res.status(201).send({ Person: person, Link: link });
		})
	);

	/**
	 * POST /api/v1/federation/requests
	 * @tags federation
	 * @summary Another instance asks to be connected (only with an API token of this instance)
	 * @security BearerAuth
	 * @param {object} request.body.required - { Name, BaseUrl, Token, Message }
	 * @return {object} 202 - request is waiting for an admin
	 */
	router.post(
		"/requests",
		read,
		handle(async (req, res) => {
			if (!req.user!.ViaApiToken) {
				throw new HttpError(
					403,
					"Connection requests come from other instances with an API token"
				);
			}
			const body = parse(peerRequestSchema, req.body);
			const baseUrl = normalizePeerUrl(body.BaseUrl);
			const pending = await requests.findAll();
			const previous = pending.find((r) => r.BaseUrl === baseUrl);
			if (!previous && pending.length >= MAX_PENDING_REQUESTS) {
				throw new HttpError(429, "Too many open connection requests");
			}
			if (previous) await requests.delete(previous.Id);
			const request: PeerRequest = {
				Id: crypto.randomUUID(),
				Name: body.Name,
				BaseUrl: baseUrl,
				TokenEncrypted: ctx.cipher.encrypt(body.Token),
				Message: body.Message,
				FromUserId: req.user!.Id,
				CreatedAt: now(),
			};
			await requests.create(request);
			res.status(202).send({ success: true });
		})
	);

	/**
	 * GET /api/v1/federation/requests
	 * @tags federation
	 * @summary Open connection requests of other instances (Admin)
	 * @security BearerAuth
	 * @return {array<object>} 200 - requests (without tokens)
	 */
	router.get(
		"/requests",
		admin,
		handle(async (req, res) => {
			const all = await requests.findAll();
			all.sort((a, b) => b.CreatedAt.localeCompare(a.CreatedAt));
			res.send(all.map(toPublicRequest));
		})
	);

	/**
	 * POST /api/v1/federation/requests/{id}/accept
	 * @tags federation
	 * @summary Accept a connection request: checks the other instance and connects it (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - request id
	 * @return {object} 201 - peer
	 */
	router.post(
		"/requests/:id/accept",
		admin,
		handle(async (req, res) => {
			const request = await requests.findById(req.params.id);
			if (!request) throw notFound("Request");
			const token = ctx.cipher.decrypt(request.TokenEncrypted);
			const status = await ctx.federation.check(request.BaseUrl, token);
			if (status !== "Ok") {
				throw new HttpError(
					400,
					status === "Unauthorized"
						? "The instance rejected the token"
						: "The instance cannot be reached"
				);
			}
			const existing = await peers.findOne({ BaseUrl: request.BaseUrl });
			let peer: Peer;
			if (existing) {
				peer = (await peers.update(existing.Id, {
					TokenEncrypted: request.TokenEncrypted,
					Status: status,
					CheckedAt: now(),
				}))!;
			} else {
				peer = {
					Id: crypto.randomUUID(),
					Name: request.Name,
					BaseUrl: request.BaseUrl,
					TokenEncrypted: request.TokenEncrypted,
					Status: status,
					CheckedAt: now(),
					CreatedAt: now(),
				};
				await peers.create(peer);
			}
			await requests.delete(request.Id);
			res.status(201).send(toPublicPeer(peer));
		})
	);

	/**
	 * DELETE /api/v1/federation/requests/{id}
	 * @tags federation
	 * @summary Reject a connection request (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - request id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/requests/:id",
		admin,
		handle(async (req, res) => {
			if (!(await requests.delete(req.params.id)))
				throw notFound("Request");
			res.send({ success: true });
		})
	);

	/**
	 * GET /api/v1/federation/links
	 * @tags federation
	 * @summary Links of a local person to persons of other instances
	 * @security BearerAuth
	 * @param {string} personId.query.required - local person id
	 * @return {array<object>} 200 - links with PeerName
	 */
	router.get(
		"/links",
		read,
		handle(async (req, res) => {
			const personId =
				typeof req.query.personId === "string"
					? req.query.personId
					: "";
			if (!personId) throw new HttpError(400, "personId is required");
			const [found, allPeers] = await Promise.all([
				links.findAll({ PersonId: personId }),
				peers.findAll(),
			]);
			res.send(
				found.map((l) => ({
					...l,
					PeerName:
						allPeers.find((p) => p.Id === l.PeerId)?.Name ?? null,
				}))
			);
		})
	);

	/**
	 * POST /api/v1/federation/links
	 * @tags federation
	 * @summary Link a local person with a person of another instance (Editor)
	 * @security BearerAuth
	 * @param {object} request.body.required - { PersonId, PeerId, RemotePersonId, Relation, Notes }
	 * @return {object} 201 - link
	 */
	router.post(
		"/links",
		write,
		handle(async (req, res) => {
			const body = parse(linkSchema, req.body);
			if (!(await persons.findById(body.PersonId)))
				throw notFound("Person");
			const peer = await loadPeer(body.PeerId);
			const remote = await ctx.federation.getPerson(
				peer,
				body.RemotePersonId
			);
			if (
				await links.findOne({
					PersonId: body.PersonId,
					PeerId: peer.Id,
					RemotePersonId: remote.Id,
				})
			) {
				throw new HttpError(409, "These persons are already linked");
			}
			const link: PersonLink = {
				Id: crypto.randomUUID(),
				PersonId: body.PersonId,
				PeerId: peer.Id,
				RemotePersonId: remote.Id,
				RemoteName: remoteName(remote).slice(0, 300),
				Relation: body.Relation,
				Notes: body.Notes,
				CreatedAt: now(),
			};
			await links.create(link);
			res.status(201).send(link);
		})
	);

	/**
	 * DELETE /api/v1/federation/links/{id}
	 * @tags federation
	 * @summary Remove a link (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - link id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/links/:id",
		write,
		handle(async (req, res) => {
			if (!(await links.delete(req.params.id))) throw notFound("Link");
			res.send({ success: true });
		})
	);

	return router;
}
