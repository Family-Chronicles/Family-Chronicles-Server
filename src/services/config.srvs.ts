import { createPublicKey, generateKeyPairSync, randomUUID } from "crypto";
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
 * @security JWT-Signing-Secret und RSA-Keys für den Passworttransport dürfen nicht
 * im Repository gespeichert werden. Für produktive Umgebungen müssen diese Werte aus
 * Environment-Variablen oder Secret Stores geladen werden.
 */
export default class ConfigService {
	private static _instance: ConfigService;
	private _config: Config;
	private readonly _nodeEnv = process.env.NODE_ENV ?? "development";

	public get config(): Config {
		return this._config;
	}

	private constructor() {
		const configFileName =
			this._nodeEnv === "test"
				? "test.config.json"
				: "default.config.json";
		const configPath = path.resolve(
			process.cwd(),
			"src/config",
			configFileName
		);
		const configFile = fs.readFileSync(configPath, "utf8");
		this._config = JSON.parse(configFile) as Config;
		this.applyEnvironmentOverrides();
	}

	private get isTest(): boolean {
		return this._nodeEnv === "test";
	}

	private get isProduction(): boolean {
		return this._nodeEnv === "production";
	}

	private applyEnvironmentOverrides(): void {
		this._config.database.host =
			this.resolveEnvValue(
				["MONGO_URI", "DB_HOST"],
				this._config.database.host
			) ?? this._config.database.host;
		this._config.database.databasename =
			this.resolveEnvValue(
				["MONGO_DATABASE", "DB_NAME"],
				this._config.database.databasename
			) ?? this._config.database.databasename;
		this._config.database.username =
			this.resolveEnvValue(
				["MONGO_USERNAME", "DB_USERNAME"],
				this._config.database.username
			) ?? "";
		this._config.database.password =
			this.resolveEnvValue(
				["MONGO_PASSWORD", "DB_PASSWORD"],
				this._config.database.password
			) ?? "";

		const authConfig = this.resolveAuthConfig();
		this._config.auth.jwtSecret = authConfig.jwtSecret;
		this._config.auth.privateKey = authConfig.privateKey;
		this._config.auth.publicKey = authConfig.publicKey;
	}

	private resolveAuthConfig(): {
		jwtSecret: string;
		privateKey: string;
		publicKey: string;
	} {
		const generatedKeys = this.isTest
			? this.generateEphemeralTestKeys()
			: null;
		const privateKey =
			this.resolvePemValue(
				"PASSWORD_PRIVATE_KEY_BASE64",
				["PASSWORD_PRIVATE_KEY", "PRIVATE_KEY", "JWT_PRIVATE_KEY"],
				this._config.auth.privateKey
			) ?? generatedKeys?.privateKey;
		const publicKey =
			this.resolvePemValue(
				"PASSWORD_PUBLIC_KEY_BASE64",
				["PASSWORD_PUBLIC_KEY", "PUBLIC_KEY", "JWT_PUBLIC_KEY"],
				this._config.auth.publicKey
			) ??
			this.derivePublicKey(privateKey) ??
			generatedKeys?.publicKey;
		const jwtSecret =
			this.resolveEnvValue(
				["JWT_SECRET", "TOKEN_SECRET"],
				this._config.auth.jwtSecret
			) ??
			(this.isTest ? `test-${randomUUID()}-${randomUUID()}` : undefined);

		if (!jwtSecret) {
			throw new Error(
				"Missing JWT secret. Set JWT_SECRET (or legacy TOKEN_SECRET) before starting the server."
			);
		}

		if (!privateKey || !publicKey) {
			throw new Error(
				"Missing RSA key pair for password decryption. Set PASSWORD_PRIVATE_KEY/PASSWORD_PUBLIC_KEY (or *_BASE64 variants) before starting the server."
			);
		}

		if (!this.isProduction) {
			if (!process.env.JWT_SECRET && !process.env.TOKEN_SECRET) {
				console.warn(
					"⚠️  JWT secret is not provided explicitly. A temporary secret is being used for this process only."
				);
			}

			if (
				!process.env.PASSWORD_PRIVATE_KEY &&
				!process.env.PASSWORD_PRIVATE_KEY_BASE64 &&
				!process.env.PRIVATE_KEY &&
				!process.env.JWT_PRIVATE_KEY
			) {
				console.warn(
					"⚠️  RSA password private key is not sourced from environment variables. Verify your secret handling before deploying."
				);
			}
		}

		return {
			jwtSecret,
			privateKey,
			publicKey,
		};
	}

	private resolvePemValue(
		base64EnvName: string,
		envNames: string[],
		fallback?: string
	): string | undefined {
		const base64Value = this.normalizeEnvValue(process.env[base64EnvName]);
		if (base64Value) {
			return Buffer.from(base64Value, "base64").toString("utf8");
		}

		return this.resolveEnvValue(envNames, fallback);
	}

	private resolveEnvValue(
		envNames: string[],
		fallback?: string
	): string | undefined {
		for (const envName of envNames) {
			const value = this.normalizeEnvValue(process.env[envName]);
			if (this.hasMeaningfulValue(value)) {
				return value;
			}
		}

		const normalizedFallback = this.normalizeEnvValue(fallback);
		return this.hasMeaningfulValue(normalizedFallback)
			? normalizedFallback
			: undefined;
	}

	private normalizeEnvValue(value?: string): string | undefined {
		if (!value) {
			return undefined;
		}

		const trimmed = value.trim();
		if (!trimmed) {
			return undefined;
		}

		if (
			(trimmed.startsWith("'") && trimmed.endsWith("'")) ||
			(trimmed.startsWith('"') && trimmed.endsWith('"'))
		) {
			return trimmed.slice(1, -1);
		}

		return trimmed;
	}

	private hasMeaningfulValue(value?: string): value is string {
		return Boolean(value && value !== "changeme" && value !== "__ENV__");
	}

	private derivePublicKey(privateKey?: string): string | undefined {
		if (!privateKey) {
			return undefined;
		}

		try {
			return createPublicKey(privateKey).export({
				type: "spki",
				format: "pem",
			}) as string;
		} catch {
			return undefined;
		}
	}

	private generateEphemeralTestKeys(): {
		privateKey: string;
		publicKey: string;
	} {
		return generateKeyPairSync("rsa", {
			modulusLength: 2048,
			privateKeyEncoding: {
				type: "pkcs1",
				format: "pem",
			},
			publicKeyEncoding: {
				type: "spki",
				format: "pem",
			},
		});
	}

	public static getInstance() {
		if (!ConfigService._instance) {
			ConfigService._instance = new ConfigService();
		}
		return ConfigService._instance;
	}
}
