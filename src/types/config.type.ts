export type Config = {
	meta: {
		name: string;
		version: string;
		description: string;
		homepage_url: string;
		author: {
			name: string;
			email: string;
		};
		contributors: {
			name: string;
			email: string;
		}[];
		license: string;
		repository: string;
		homepage: string;
		bugs: string;
	};
	server: {
		port: number;
		corsOrigins: string[];
		rateLimitPerMinute: number;
		uploadDir: string;
		maxUploadMb: number;
		/** "mongo" shares live updates between several instances using the same MongoDB */
		liveRelay: "none" | "mongo";
	};
	auth: {
		jwtSecret: string;
		/** Lifetime of access tokens, e.g. "15m" */
		tokenLifetime: string;
		/** Lifetime of refresh tokens (logins) in days */
		refreshTokenDays: number;
		adminName: string;
		adminEmail: string;
		adminPassword: string;
	};
	mail: {
		/** SMTP connection URL; without it password reset is disabled */
		smtpUrl: string;
		from: string;
		/** Public URL of the web app, used for links in mails */
		appUrl: string;
	};
	database: {
		/** "mongo" for production, "memory" for tests and quick local runs */
		driver: "mongo" | "memory";
		host: string;
		databasename: string;
		username: string;
		password: string;
	};
};
