import { authStore } from "@lib/authStore";
import { tokenHasRole } from "@lib/jwtClaims";
import { getRouter } from "@lib/router";

/**
 * Creates a route guard that redirects to signin if not authenticated
 */
export const requireAuth = (): void => {
	const state = authStore.getState();
	if (!state.isAuthenticated) {
		const router = getRouter();
		router.navigate("/signin");
	}
};

/**
 * Creates a route guard that redirects to home if already authenticated
 */
export const requireGuest = (): void => {
	const state = authStore.getState();
	if (state.isAuthenticated) {
		const router = getRouter();
		router.navigate("/");
	}
};

/**
 * Checks if user is authenticated (synchronous, uses cached state)
 */
export const isAuthenticated = (): boolean => {
	const state = authStore.getState();
	return state.isAuthenticated;
};

/**
 * Checks if current user has a role claim in the JWT access token
 */
export const hasRole = (role: string): boolean => {
	const { accessToken } = authStore.getState();
	return tokenHasRole(accessToken, role);
};

/**
 * Checks whether the current user is an admin
 */
export const isAdmin = (): boolean => {
	return hasRole("admin");
};

/**
 * Creates a route guard that allows admin users only
 */
export const requireAdmin = (): void => {
	if (!isAuthenticated()) {
		const router = getRouter();
		router.navigate("/signin");
		return;
	}

	if (!isAdmin()) {
		const router = getRouter();
		router.navigate("/");
	}
};

/**
 * Gets current user profile (synchronous, uses cached state)
 */
export const getCurrentUser = () => {
	const state = authStore.getState();
	return state.user;
};
