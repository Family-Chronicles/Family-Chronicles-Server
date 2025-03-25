import { Config } from "../types/config.type.js";
import ConfigJson from "../config/default.config.json" assert { type: "json" };

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
export default class ConfigService {
	private static _instance: ConfigService;
	private _config: Config;

	public get config(): Config {
		return this._config;
	}

	private constructor() {
		this._config = ConfigJson;
	}

	public static getInstance() {
		if (!ConfigService._instance) {
			ConfigService._instance = new ConfigService();
		}
		return ConfigService._instance;
	}
}
