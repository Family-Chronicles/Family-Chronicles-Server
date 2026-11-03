import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, z } from "zod";

/** Error with an HTTP status – thrown in handlers, turned into a JSON response */
export class HttpError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly details?: unknown
	) {
		super(message);
	}
}

export const notFound = (what = "Resource") =>
	new HttpError(404, `${what} not found`);

/** Wraps async handlers so rejected promises reach the error handler */
export const handle =
	(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
	(req, res, next) => {
		fn(req, res).catch(next);
	};

/** Parses a request body with a zod schema, throws a 400 on failure */
export function parse<S extends z.ZodType>(
	schema: S,
	data: unknown
): z.infer<S> {
	const result = schema.safeParse(data);
	if (!result.success) {
		throw new HttpError(
			400,
			"Validation failed",
			z.flattenError(result.error)
		);
	}
	return result.data;
}

export function errorHandler(
	error: unknown,
	req: Request,
	res: Response,
	next: NextFunction
): void {
	if (error instanceof HttpError) {
		res.status(error.status).send({
			status: error.status,
			message: error.message,
			details: error.details,
		});
		return;
	}
	if (error instanceof ZodError) {
		res.status(400).send({
			status: 400,
			message: "Validation failed",
			details: z.flattenError(error),
		});
		return;
	}
	if (error instanceof SyntaxError && "body" in error) {
		res.status(400).send({ status: 400, message: "Invalid JSON body" });
		return;
	}
	console.error(error);
	res.status(500).send({ status: 500, message: "Internal server error" });
}

export const now = () => new Date().toISOString();
