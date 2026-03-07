import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { installDom, resetDom } from "./helpers/dom";
import { authApi } from "../src/lib/api";

// Mock fetch globally
const originalFetch = global.fetch;

describe("Auth API Integration", () => {
	beforeEach(() => {
		installDom();
		// Clear any stored tokens before each test
		localStorage.clear();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		resetDom();
	});

	test("requestOtp should call the correct endpoint", async () => {
		const mockResponse = {
			ok: true,
			text: () => Promise.resolve(""),
		};
		global.fetch = mock(() => Promise.resolve(mockResponse as Response));

		const email = "test@example.com";
		await authApi.requestOtp({ email });

		expect(fetch).toHaveBeenCalledWith(
			"/api/Auth/request-otp",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			},
		);
	});

	test("verifyOtp should return auth tokens", async () => {
		const tokenPayload = {
			accessToken: "mock_access_token",
			refreshToken: "mock_refresh_token",
			refreshTokenExpiry: new Date().toISOString(),
		};
		const mockAuthResponse = {
			ok: true,
			text: () => Promise.resolve(JSON.stringify(tokenPayload)),
		};

		global.fetch = mock(() => Promise.resolve(mockAuthResponse as Response));

		const result = await authApi.verifyOtp({
			email: "test@example.com",
			otpCode: "123456",
		});

		expect(result).toEqual({
			accessToken: "mock_access_token",
			refreshToken: "mock_refresh_token",
			refreshTokenExpiry: expect.any(String),
		});
		expect(localStorage.getItem("3am_access_token")).toBe("mock_access_token");
		expect(localStorage.getItem("3am_refresh_token")).toBe("mock_refresh_token");
	});

	test("register should call the correct endpoint", async () => {
		const mockResponse = {
			ok: true,
			text: () => Promise.resolve(""),
		};
		global.fetch = mock(() => Promise.resolve(mockResponse as Response));

		await authApi.register({
			name: "Test User",
			email: "test@example.com",
			phone: "+1234567890",
		});

		expect(fetch).toHaveBeenCalledWith(
			"/api/Auth/register",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "Test User",
					email: "test@example.com",
					phone: "+1234567890",
				}),
			},
		);
	});

	test("isAuthenticated should return false without token", () => {
		expect(authApi.isAuthenticated()).toBe(false);
	});

	test("isAuthenticated should return true with valid token", () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 1);
		localStorage.setItem("3am_access_token", "valid_token");
		localStorage.setItem("3am_refresh_token_expiry", futureDate.toISOString());

		expect(authApi.isAuthenticated()).toBe(true);
	});

	test("clearAuth should remove all tokens", () => {
		localStorage.setItem("3am_access_token", "token");
		localStorage.setItem("3am_refresh_token", "refresh");
		localStorage.setItem("3am_refresh_token_expiry", new Date().toISOString());

		authApi.clearAuth();

		expect(localStorage.getItem("3am_access_token")).toBeNull();
		expect(localStorage.getItem("3am_refresh_token")).toBeNull();
		expect(localStorage.getItem("3am_refresh_token_expiry")).toBeNull();
	});
});
