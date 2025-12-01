import fs from "fs";
import path from "path";
import { Config } from "../types/config.type.js";

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
 *
 * @security WARNUNG: Die Schlüssel (privateKey, publicKey) sollten über Environment-Variablen
 * geladen werden, nicht aus config.json. Setzen Sie JWT_PRIVATE_KEY und JWT_PUBLIC_KEY
 * als Environment-Variablen für Produktionsumgebungen.
 */
export default class ConfigService {
	private static _instance: ConfigService;
	private _config: Config;

	public get config(): Config {
		return this._config;
	}
	private constructor() {
		// Testkontext: test.config.json laden
		const configFileName =
			process.env.NODE_ENV === "test"
				? "test.config.json"
				: "default.config.json";
		const configPath = path.resolve(
			process.cwd(),
			"src/config",
			configFileName
		);
		const configFile = fs.readFileSync(configPath, "utf8");
		this._config = JSON.parse(configFile) as Config;

		// Überschreibe Keys mit Environment-Variablen falls vorhanden (sicherer!)
		if (process.env.JWT_PRIVATE_KEY) {
			this._config.auth.privateKey = process.env.JWT_PRIVATE_KEY;
		}
		if (process.env.JWT_PUBLIC_KEY) {
			this._config.auth.publicKey = process.env.JWT_PUBLIC_KEY;
		}

		// Warnung ausgeben wenn Keys aus config.json verwendet werden
		if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
			console.warn(
				"⚠️  SICHERHEITSWARNUNG: JWT-Keys werden aus config.json geladen. " +
					"Für Produktionsumgebungen sollten JWT_PRIVATE_KEY und JWT_PUBLIC_KEY " +
					"als Environment-Variablen gesetzt werden."
			);
		}
	}

	public static getInstance() {
		if (!ConfigService._instance) {
			ConfigService._instance = new ConfigService();
		}
		return ConfigService._instance;
	}
}
