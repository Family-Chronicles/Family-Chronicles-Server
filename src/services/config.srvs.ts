import { Config } from "../types/config.type.js";
import fs from 'fs';
import path from 'path';

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
		   // Testkontext: test.config.json laden
		   const configFileName = process.env.NODE_ENV === 'test'
			   ? 'test.config.json'
			   : 'default.config.json';
		   const configPath = path.resolve(process.cwd(), 'src/config', configFileName);
		   const configFile = fs.readFileSync(configPath, 'utf8');
		   this._config = JSON.parse(configFile) as Config;
	   }

	public static getInstance() {
		if (!ConfigService._instance) {
			ConfigService._instance = new ConfigService();
		}
		return ConfigService._instance;
	}
}
