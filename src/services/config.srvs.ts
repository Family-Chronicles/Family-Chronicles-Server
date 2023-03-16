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

	public readonly _config: Config = JSON.parse(
		fs.readFileSync("./dist/config/default.config.json", "utf8")
	);

	private constructor() {}

	public static getInstance() {
		if (!ConfigService._instance) {
			ConfigService._instance = new ConfigService();
		}
		return ConfigService._instance;
	}
}
