import { Config } from "../types/config.type.js";
import fs from "fs";

/**
 * Config service
 * @class
 * @implements {IService}
 * @property {Config} _config - Config
 * @constructor
 * @returns {ConfigService} - Config service instance
 * @example
 * const configService = ConfigService.getInstance();
 * const config = configService._config;
 */
export class ConfigService {
	private static _instance: ConfigService;
	private readonly _configPath: string = "./dist/config/default.config.json";

	private _config: Config;

	public get config(): Config {
		return this._config;
	}

	private constructor() {
		this._config = JSON.parse(fs.readFileSync(this._configPath, "utf8"));

		// Listen for changes in config file
		this.listenForFileChanges(this._configPath, () => {
			this._config = JSON.parse(
				fs.readFileSync(this._configPath, "utf8")
			);
		});
	}

	public static getInstance() {
		if (!ConfigService._instance) {
			ConfigService._instance = new ConfigService();
		}
		return ConfigService._instance;
	}

	private listenForFileChanges(path: string, fn: () => void): void {
		fs.watchFile(path, (curr, prev) => {
			if (curr.mtime > prev.mtime) {
				fn();
			}
		});
	}
}
