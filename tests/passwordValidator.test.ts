import PasswordValidator from "../src/classes/passwordValidator";

describe("PasswordValidator.validate", () => {
	it("accepts a strong password", () => {
		const result = PasswordValidator.validate("Str0ng!Pass#2026");
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("rejects a password that is too short", () => {
		const result = PasswordValidator.validate("Aa1!");
		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.stringContaining("at least 8 characters"),
			])
		);
	});

	it("requires an uppercase letter", () => {
		const result = PasswordValidator.validate("str0ng!pass#2026");
		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.stringContaining("uppercase letter"),
			])
		);
	});

	it("requires a lowercase letter", () => {
		const result = PasswordValidator.validate("STR0NG!PASS#2026");
		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.stringContaining("lowercase letter"),
			])
		);
	});

	it("requires a number", () => {
		const result = PasswordValidator.validate("Strong!Pass#Word");
		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([expect.stringContaining("one number")])
		);
	});

	it("requires a special character", () => {
		const result = PasswordValidator.validate("Str0ngPass2026");
		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.stringContaining("special character"),
			])
		);
	});

	it("rejects common passwords", () => {
		const result = PasswordValidator.validate("Password1");
		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([expect.stringContaining("too common")])
		);
	});

	it("honours custom requirements", () => {
		const result = PasswordValidator.validate("abcdef", {
			minLength: 4,
			requireUppercase: false,
			requireLowercase: false,
			requireNumbers: false,
			requireSpecialChars: false,
		});
		expect(result.isValid).toBe(true);
	});
});

describe("PasswordValidator.getStrengthHint", () => {
	it("returns English strength labels", () => {
		expect(PasswordValidator.getStrengthHint("aA")).toBe("Weak");
		expect(PasswordValidator.getStrengthHint("Str0ng!Pass#2026")).toBe(
			"Very strong"
		);
	});
});
