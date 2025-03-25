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
	database: {
		host: string;
		databasename: string;
		username: string;
		password: string;
		collections: string[];
	};
	auth: {
		privateKey: string;
		publicKey: string;
		tokenExpiration: string;
	};
};
