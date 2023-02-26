import { Config } from "../types/config.type";
import fs from "fs";

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
