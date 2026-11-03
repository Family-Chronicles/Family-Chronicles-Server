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
	};
	auth: {
		jwtSecret: string;
		tokenLifetime: string;
		adminName: string;
		adminEmail: string;
		adminPassword: string;
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
