import { Router } from "express";
import crypto from "crypto";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, now, parse } from "../core/http.core.js";
import { Peer, PersonLink } from "../models/federation.model.js";
import { normalizePeerUrl, remoteName } from "../services/federation.srvs.js";
import { linkSchema, peerSchema } from "../validation/schemas.js";

/** Never send the (encrypted) token */
const toPublicPeer = ({ TokenEncrypted, ...rest }: Peer) => rest;

/**
 * Connections to other Family Chronicles instances and links between
 * local persons and persons there. See docs/federation.md.
 */
export function federationController(ctx: AppContext): Router {
	const router = Router();
	const { peers, links, persons } = ctx.repos;
	const read = ctx.auth.require("Viewer");
	const write = ctx.auth.require("Editor");
	const admin = ctx.auth.require("Admin");

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
			res.status(201).send(toPublicPeer(peer));
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
