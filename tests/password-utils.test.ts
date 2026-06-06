import NodeRSA from "node-rsa";
import {
	decryptAndValidatePassword,
	decryptPasswordOnly,
} from "../src/utils/password.utils";

/**
 * These tests exercise the full RSA decrypt + strength-enforcement path using an
 * ephemeral key pair, so they require no database or server. They are the
 * regression guard for the bug where `!PasswordValidator.validate(pw)` checked
 * the truthiness of the returned object (always truthy) and therefore never
 * rejected weak passwords.
 */
describe("password.utils decryption + strength enforcement", () => {
	const key = new NodeRSA({ b: 2048 });
	const privateKey = key.exportKey("private");
	const encrypt = (plain: string): string => key.encrypt(plain, "base64");

	it("rejects a weak password when strength validation is enabled", () => {
		const result = decryptAndValidatePassword(encrypt("weak"), privateKey);
		expect(result.success).toBe(false);
		expect(result.error?.code).toBe(400);
		expect(result.error?.message).toEqual(expect.any(String));
		expect(result.error?.message.length).toBeGreaterThan(0);
	});

	it("accepts a strong password and returns the decrypted value", () => {
		const strong = "Str0ng!Pass#2026";
		const result = decryptAndValidatePassword(encrypt(strong), privateKey);
		expect(result.success).toBe(true);
		expect(result.password).toBe(strong);
	});

	it("does not enforce strength on the login path", () => {
		const result = decryptPasswordOnly(encrypt("weak"), privateKey);
		expect(result.success).toBe(true);
		expect(result.password).toBe("weak");
	});

	it("reports an invalid format for undecryptable input", () => {
		const result = decryptAndValidatePassword("not-base64-rsa", privateKey);
		expect(result.success).toBe(false);
		expect(result.error?.code).toBe(400);
	});
});
