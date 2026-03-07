import { beforeEach, describe, expect, mock, test } from "bun:test";

type MockAuthState = {
	isAuthenticated: boolean;
};

const authListeners = new Set<(state: MockAuthState) => void>();
let authState: MockAuthState = { isAuthenticated: true };

const mockGetCart = mock(() =>
	Promise.resolve({
		id: 1,
		user_Name: "Test User",
		cartItems: [
			{
				id: 7,
				product_Id: 42,
				product_Name: "Roof Rack",
				product_Price: 99,
				quantity: 2,
			},
		],
	}),
);

mock.module("../src/lib/authStore", () => ({
	authStore: {
		getState: () => ({ ...authState }),
		subscribe: (listener: (state: MockAuthState) => void) => {
			authListeners.add(listener);
			listener({ ...authState });
			return () => authListeners.delete(listener);
		},
	},
}));

mock.module("../src/lib/api", () => ({
	cartApi: {
		getCart: mockGetCart,
		addToCart: mock(() => Promise.resolve()),
		removeFromCart: mock(() => Promise.resolve()),
		clearCart: mock(() => Promise.resolve()),
	},
}));

const flushAsync = async (): Promise<void> => {
	await Promise.resolve();
	await Promise.resolve();
};

const emitAuthState = (): void => {
	for (const listener of authListeners) {
		listener({ ...authState });
	}
};

describe("CartStore", () => {
	beforeEach(() => {
		authState = { isAuthenticated: true };
		authListeners.clear();
		mockGetCart.mockClear();
	});

	test("clears cart state immediately after sign-out", async () => {
		const { cartStore } = await import("../src/app/cart/cartStore");
		await flushAsync();

		expect(mockGetCart).toHaveBeenCalledTimes(1);
		expect(cartStore.getItemCount()).toBe(2);
		cartStore.setOpen(true);

		authState = { isAuthenticated: false };
		emitAuthState();

		const state = cartStore.getState();
		expect(state.items).toEqual([]);
		expect(state.isOpen).toBe(false);
		expect(state.error).toBeNull();
		expect(state.isLoading).toBe(false);

		await cartStore.loadCart();
		expect(mockGetCart).toHaveBeenCalledTimes(1);
	});
});
