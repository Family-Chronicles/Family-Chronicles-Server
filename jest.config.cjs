module.exports = {
	testEnvironment: "node",
	testMatch: ["**/tests/**/*.test.ts"],
	transform: {
		"^.+\\.ts$": "ts-jest",
	},
	extensionsToTreatAsEsm: [".ts"],
	transformIgnorePatterns: ["/node_modules/(?!friendly-helper)"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
};
