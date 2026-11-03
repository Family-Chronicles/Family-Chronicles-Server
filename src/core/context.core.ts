import { Config } from "../types/config.type.js";
import { Repositories } from "../services/database.srvs.js";
import { AuthService } from "../services/auth.srvs.js";
import { FileStorage } from "../storage/file.storage.js";
import { ChangeBus } from "../services/events.srvs.js";
import { Mailer } from "../services/mail.srvs.js";
import { FederationClient, TokenCipher } from "../services/federation.srvs.js";

/** Everything a controller needs – passed in instead of global singletons */
export interface AppContext {
	config: Config;
	repos: Repositories;
	auth: AuthService;
	storage: FileStorage;
	/** Data changes, used for live updates */
	events: ChangeBus;
	/** null when no SMTP server is configured (password reset disabled) */
	mailer: Mailer | null;
	/** Encrypts the tokens of other instances */
	cipher: TokenCipher;
	/** Reads from other instances */
	federation: FederationClient;
}
