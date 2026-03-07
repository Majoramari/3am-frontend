import { authApi } from "@lib/api";
import type { AuthResponseDTO, ProfileDTO } from "@lib/api/auth.types";

type AuthState = {
	isAuthenticated: boolean;
	accessToken: string | null;
	user: ProfileDTO | null;
	isLoading: boolean;
	error: string | null;
};

type AuthListener = (state: AuthState) => void;

class AuthStore {
	private state: AuthState = {
		isAuthenticated: false,
		accessToken: null,
		user: null,
		isLoading: true,
		error: null,
	};

	private listeners: Set<AuthListener> = new Set();

	constructor() {
		this.initialize();
	}

	private initialize(): void {
		const isAuthenticated = authApi.isAuthenticated();
		const token = isAuthenticated ? authApi.getStoredToken() : null;
		if (!isAuthenticated) {
			authApi.clearAuth();
		}
		this.state.isAuthenticated = isAuthenticated;
		this.state.accessToken = token;
		this.state.isLoading = false;
		this.notify();
	}

	private setState(updates: Partial<AuthState>): void {
		this.state = { ...this.state, ...updates };
		this.notify();
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener(this.state);
		}
	}

	subscribe(listener: AuthListener): () => void {
		this.listeners.add(listener);
		listener(this.state);
		return () => {
			this.listeners.delete(listener);
		};
	}

	getState(): AuthState {
		return { ...this.state };
	}

	async requestOtp(email: string): Promise<void> {
		this.setState({ isLoading: true, error: null });
		try {
			await authApi.requestOtp({ email });
			this.setState({ isLoading: false });
		} catch (error) {
			this.setState({
				isLoading: false,
				error: error instanceof Error ? error.message : "Failed to send OTP",
			});
			throw error;
		}
	}

	async verifyOtp(email: string, otpCode: string): Promise<AuthResponseDTO> {
		this.setState({ isLoading: true, error: null });
		try {
			const auth = await authApi.verifyOtp({ email, otpCode });
			this.setState({
				isAuthenticated: true,
				accessToken: auth.accessToken,
				isLoading: false,
			});
			return auth;
		} catch (error) {
			this.setState({
				isLoading: false,
				error: error instanceof Error ? error.message : "Invalid OTP",
			});
			throw error;
		}
	}

	async loadProfile(): Promise<ProfileDTO | null> {
		if (!this.state.isAuthenticated) {
			return null;
		}

		this.setState({ isLoading: true, error: null });
		try {
			const profile = await authApi.getProfile();
			this.setState({ user: profile, isLoading: false });
			return profile;
		} catch (error) {
			this.setState({
				isLoading: false,
				error:
					error instanceof Error ? error.message : "Failed to load profile",
			});
			throw error;
		}
	}

	async logout(): Promise<void> {
		this.setState({ isLoading: true, error: null });
		try {
			await authApi.logout();
		} catch {
			// Ignore logout errors (e.g., token expired)
		} finally {
			authApi.clearAuth();
			this.setState({
				isAuthenticated: false,
				accessToken: null,
				user: null,
				isLoading: false,
			});
		}
	}

	clearError(): void {
		this.setState({ error: null });
	}
}

export const authStore = new AuthStore();
