module.exports = {
	testEnvironment: "node",
	testMatch: ["**/tests/**/*.test.ts"],
	transform: {
		"^.+\\.ts$": ["ts-jest", { useESM: true }],
	},
	extensionsToTreatAsEsm: [".ts"],
	transformIgnorePatterns: ["/node_modules/(?!friendly-helper)"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
};
