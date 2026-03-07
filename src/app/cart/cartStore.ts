import { type CartItem, cartApi, type Product } from "@lib/api";
import { authStore } from "@lib/authStore";
import { emitToast } from "@lib/toastBus";

type CartState = {
	items: CartItem[];
	isOpen: boolean;
	isLoading: boolean;
	error: string | null;
};

type CartListener = (state: CartState) => void;

class CartStore {
	private state: CartState = {
		items: [],
		isOpen: false,
		isLoading: false,
		error: null,
	};

	private listeners: Set<CartListener> = new Set();

	constructor() {
		let wasAuthenticated = authStore.getState().isAuthenticated;

		authStore.subscribe((authState) => {
			const isAuthenticated = authState.isAuthenticated;
			if (wasAuthenticated && !isAuthenticated) {
				this.reset();
			} else if (!wasAuthenticated && isAuthenticated) {
				void this.loadCart();
			}
			wasAuthenticated = isAuthenticated;
		});

		if (wasAuthenticated) {
			void this.loadCart();
		}
	}

	getState(): CartState {
		return { ...this.state, items: [...this.state.items] };
	}

	subscribe(listener: CartListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener(this.state);
		}
	}

	private setState(partial: Partial<CartState>): void {
		const nextItems = Array.isArray(partial.items)
			? partial.items
			: this.state.items;
		this.state = { ...this.state, ...partial, items: nextItems };
		this.notify();
	}

	reset(): void {
		this.setState({
			items: [],
			isOpen: false,
			isLoading: false,
			error: null,
		});
	}

	private mapApiErrorToMessage(error: unknown, fallback: string): string {
		if (!(error instanceof Error)) {
			return fallback;
		}

		const message = error.message.toLowerCase();
		if (message.includes("403") || message.includes("forbidden")) {
			return "Your account does not have permission to use cart actions.";
		}

		if (message.includes("401") || message.includes("authentication")) {
			return "Your session expired. Please sign in again.";
		}

		if (message.includes("404") || message.includes("not found")) {
			return "This product is unavailable right now.";
		}

		return fallback;
	}

	async loadCart(): Promise<void> {
		if (!authStore.getState().isAuthenticated) {
			this.reset();
			return;
		}

		this.setState({ isLoading: true, error: null });

		try {
			const cart = await cartApi.getCart();
			this.setState({ items: cart.cartItems, isLoading: false });
		} catch (error) {
			console.error("Failed to load cart:", error);
			this.setState({
				isLoading: false,
				error: "Failed to load cart. Please try again.",
			});
		}
	}

	async addToCart(product: Product, quantity: number = 1): Promise<void> {
		this.setState({ isLoading: true, error: null });

		try {
			await cartApi.addToCart(product.id, quantity);
			const cart = await cartApi.getCart();
			this.setState({ items: cart.cartItems, isLoading: false });
			emitToast({
				level: "success",
				title: "Added to cart",
				message: `${product.name} added to cart.`,
			});
		} catch (error) {
			console.error("Failed to add to cart:", error);
			const message = this.mapApiErrorToMessage(
				error,
				"Failed to add item to cart.",
			);
			this.setState({
				isLoading: false,
				error: message,
			});
			emitToast({ message, level: "error" });
		}
	}

	async removeFromCart(cartItemId: number): Promise<void> {
		this.setState({ isLoading: true, error: null });

		try {
			await cartApi.removeFromCart(cartItemId);
			const cart = await cartApi.getCart();
			this.setState({ items: cart.cartItems, isLoading: false });
		} catch (error) {
			console.error("Failed to remove from cart:", error);
			this.setState({
				isLoading: false,
				error: "Failed to remove item from cart.",
			});
		}
	}

	async updateQuantity(cartItemId: number, quantity: number): Promise<void> {
		const currentItem = this.state.items.find((item) => item.id === cartItemId);
		if (!currentItem) {
			return;
		}

		if (quantity === currentItem.quantity) {
			return;
		}

		this.setState({ isLoading: true, error: null });

		try {
			if (quantity <= 0) {
				await cartApi.removeFromCart(cartItemId);
			} else if (quantity > currentItem.quantity) {
				const delta = quantity - currentItem.quantity;
				await cartApi.addToCart(currentItem.product_Id, delta);
			} else {
				// No decrement endpoint exists, so rebuild item quantity.
				await cartApi.removeFromCart(cartItemId);
				await cartApi.addToCart(currentItem.product_Id, quantity);
			}

			const cart = await cartApi.getCart();
			this.setState({ items: cart.cartItems, isLoading: false });
		} catch (error) {
			console.error("Failed to update quantity:", error);
			const message = this.mapApiErrorToMessage(
				error,
				"Failed to update quantity.",
			);
			this.setState({
				isLoading: false,
				error: message,
			});
			emitToast({ message, level: "error" });
		}
	}

	async clearCart(): Promise<void> {
		this.setState({ isLoading: true, error: null });

		try {
			await cartApi.clearCart();
			const cart = await cartApi.getCart();
			this.setState({ items: cart.cartItems, isLoading: false });
		} catch (error) {
			console.error("Failed to clear cart:", error);
			const message = this.mapApiErrorToMessage(error, "Failed to clear cart.");
			this.setState({
				isLoading: false,
				error: message,
			});
			emitToast({ message, level: "error" });
		}
	}

	toggleOpen(): void {
		this.setState({ isOpen: !this.state.isOpen });
	}

	setOpen(open: boolean): void {
		this.setState({ isOpen: open });
	}

	getTotal(): number {
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		return items.reduce(
			(total, item) => total + item.product_Price * item.quantity,
			0,
		);
	}

	getItemCount(): number {
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		return items.reduce((count, item) => count + item.quantity, 0);
	}
}

export const cartStore = new CartStore();
