import { Config } from "../types/config.type.js";
import { Repositories } from "../services/database.srvs.js";
import { AuthService } from "../services/auth.srvs.js";
import { FileStorage } from "../storage/file.storage.js";

/** Everything a controller needs – passed in instead of global singletons */
export interface AppContext {
	config: Config;
	repos: Repositories;
	auth: AuthService;
	storage: FileStorage;
}
