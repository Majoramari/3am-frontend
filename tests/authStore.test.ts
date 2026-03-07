import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { installDom, resetDom } from "./helpers/dom";

// Mock authApi before importing authStore
const mockRequestOtp = mock(() => Promise.resolve());
const mockVerifyOtp = mock(() =>
	Promise.resolve({
		accessToken: "mock_token",
		refreshToken: "mock_refresh",
		refreshTokenExpiry: new Date().toISOString(),
	}),
);
const mockGetProfile = mock(() =>
	Promise.resolve({
		name: "Test User",
		email: "test@example.com",
		phone: "+1234567890",
		orders: [],
	}),
);
const mockLogout = mock(() => Promise.resolve());
const mockGetStoredToken = mock(() => null);
const mockClearAuth = mock(() => {});
const mockIsAuthenticated = mock(() => false);

mock.module("../src/lib/api", () => ({
	authApi: {
		requestOtp: mockRequestOtp,
		verifyOtp: mockVerifyOtp,
		getProfile: mockGetProfile,
		logout: mockLogout,
		getStoredToken: mockGetStoredToken,
		clearAuth: mockClearAuth,
		isAuthenticated: mockIsAuthenticated,
	},
}));

describe("AuthStore", () => {
	let authStore: typeof import("../src/lib/authStore").authStore;

	beforeEach(async () => {
		installDom();
		localStorage.clear();

		// Reset mocks
		mockRequestOtp.mockClear();
		mockVerifyOtp.mockClear();
		mockGetProfile.mockClear();
		mockLogout.mockClear();
		mockIsAuthenticated.mockClear();

		// Dynamic import to ensure mocks are in place before instantiation
		const { authStore: store } = await import("../src/lib/authStore");
		authStore = store;
	});

	afterEach(() => {
		resetDom();
	});

	test("should initialize with default unauthenticated state", () => {
		const state = authStore.getState();
		expect(state.isAuthenticated).toBe(false);
		expect(state.accessToken).toBeNull();
		expect(state.user).toBeNull();
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeNull();
	});

	test("should subscribe to state changes", () => {
		const listener = mock(() => {});
		const unsubscribe = authStore.subscribe(listener);

		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
	});

	test("requestOtp should call authApi and update state", async () => {
		await authStore.requestOtp("test@example.com");

		expect(mockRequestOtp).toHaveBeenCalledWith({
			email: "test@example.com",
		});

		const state = authStore.getState();
		expect(state.error).toBeNull();
	});

	test("verifyOtp should authenticate user", async () => {
		const result = await authStore.verifyOtp("test@example.com", "123456");

		expect(mockVerifyOtp).toHaveBeenCalledWith({
			email: "test@example.com",
			otpCode: "123456",
		});

		expect(result.accessToken).toBe("mock_token");

		const state = authStore.getState();
		expect(state.isAuthenticated).toBe(true);
		expect(state.accessToken).toBe("mock_token");
	});

	test("loadProfile should fetch user profile", async () => {
		// First authenticate
		await authStore.verifyOtp("test@example.com", "123456");

		const profile = await authStore.loadProfile();

		expect(mockGetProfile).toHaveBeenCalled();
		expect(profile).toEqual({
			name: "Test User",
			email: "test@example.com",
			phone: "+1234567890",
			orders: [],
		});
	});

	test("logout should clear authentication", async () => {
		// First authenticate
		await authStore.verifyOtp("test@example.com", "123456");

		expect(authStore.getState().isAuthenticated).toBe(true);

		await authStore.logout();

		expect(mockLogout).toHaveBeenCalled();
		expect(mockClearAuth).toHaveBeenCalled();

		const state = authStore.getState();
		expect(state.isAuthenticated).toBe(false);
		expect(state.accessToken).toBeNull();
		expect(state.user).toBeNull();
	});
});
