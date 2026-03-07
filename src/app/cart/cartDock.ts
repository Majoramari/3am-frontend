import { Button } from "@components/button";
import type { CartItem } from "@lib/api";
import { View } from "@lib/view";
import { cartStore } from "./cartStore";

export class CartDock extends View<"div"> {
	private unsubcribe: (() => void) | null = null;
	private isGearsPage = false;
	private isMorphingToFull = false;
	private isMorphingToIcon = false;
	private morphTimerId: number | null = null;
	private morphToIconTimerId: number | null = null;
	private lastStateSnapshot = cartStore.getState();

	private static isGearsRoute(path: string): boolean {
		const normalizedPath = (path.split(/[?#]/, 1)[0] ?? "/").trim();
		return normalizedPath === "/gears" || normalizedPath.startsWith("/gears/");
	}

	constructor() {
		super("div", {
			className: "cart-dock",
			attrs: {
				"aria-label": "Shopping cart",
			},
		});

		this.isGearsPage = CartDock.isGearsRoute(window.location.pathname);
	}

	protected override onMount(): void {
		this.unsubcribe = cartStore.subscribe(this.handleStateChange);
		this.lastStateSnapshot = cartStore.getState();
		this.syncRootStateClasses();
		this.bindEvents();
	}

	protected override onDestroy(): void {
		this.unsubcribe?.();
		this.stopMorphToFullAnimation();
		this.stopMorphToIconAnimation();
		document.body.classList.remove("cart-dock-open");
	}

	setCurrentPath(path: string): void {
		const wasGearsPage = this.isGearsPage;
		const nextIsGearsPage = CartDock.isGearsRoute(path);
		const becameGearsPage = nextIsGearsPage && !wasGearsPage;
		const leftGearsPage = !nextIsGearsPage && wasGearsPage;
		const hasItems = cartStore.getItemCount() > 0;

		this.isGearsPage = nextIsGearsPage;
		if (becameGearsPage && hasItems) {
			this.startMorphToFullAnimation();
			this.stopMorphToIconAnimation();
		} else if (leftGearsPage && hasItems) {
			this.startMorphToIconAnimation();
			this.stopMorphToFullAnimation();
		} else {
			this.stopMorphToFullAnimation();
			this.stopMorphToIconAnimation();
		}

		this.syncRootStateClasses();
		this.rerender();
		this.bindEvents();
	}

	render(): DocumentFragment {
		const state = cartStore.getState();
		const items = state.items;
		const total = cartStore.getTotal();
		const itemCount = cartStore.getItemCount();
		const quantityControlsDisabled = state.isLoading;

		// Only render when there are items
		if (items.length === 0) {
			return this.tpl`<div class="cart-dock__placeholder"></div>`;
		}

		if (!this.isGearsPage) {
			return this.tpl`
				<div class="cart-dock__icon">
					<button
						class="cart-dock__icon-btn"
						type="button"
						aria-label="Open cart"
						>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M3 7h18l-1.4 13.2a2 2 0 0 1-2 1.8H6.4a2 2 0 0 1-2-1.8L3 7Z"></path>
								<path d="M8 7V6a4 4 0 0 1 8 0v1"></path>
							</svg>
							<span class="cart-dock__icon-count">${itemCount}</span>
						</button>
					</div>

					${this.renderCartPanel(items, total, quantityControlsDisabled)}
				`;
		}

		return this.tpl`
			<div class="cart-dock__bar">
				<div class="cart-dock__summary">
					<span class="cart-dock__count">${itemCount} ${itemCount === 1 ? "item" : "items"}</span>
					<span class="cart-dock__divider"></span>
					<span class="cart-dock__total">$${total.toLocaleString()}</span>
				</div>
				
					<div class="cart-dock__actions">
						${new Button({
							as: "button",
							type: "button",
							label: "View Cart",
							variant: "outline",
							className: "cart-dock__view-btn",
						})}
					</div>

				</div>

					${this.renderCartPanel(items, total, quantityControlsDisabled)}
				`;
	}

	private renderCartPanel(
		items: CartItem[],
		total: number,
		quantityControlsDisabled: boolean = cartStore.getState().isLoading,
	): DocumentFragment {
		return this.tpl`
			<div class="cart-dock__backdrop" aria-hidden="true"></div>

			<div class="cart-dock__panel">
				<div class="cart-dock__header">
					<h2 class="cart-dock__title">Your Cart</h2>
					<button class="cart-dock__panel-close" type="button" aria-label="Close cart">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>

				<div class="cart-dock__body">
					<ul class="cart-dock__items">
						${items.map((item) =>
							this.renderCartItem(item, quantityControlsDisabled),
						)}
					</ul>
				</div>

					<div class="cart-dock__footer">
						<div class="cart-dock__summary-large">
							<span class="cart-dock__summary-label">Subtotal</span>
							<span class="cart-dock__summary-total">$${total.toLocaleString()}</span>
						</div>
						${new Button({
							as: "a",
							href: "/checkout",
							label: "Checkout",
							variant: "cta",
							className: "cart-dock__checkout-btn",
						})}
						<p class="cart-dock__disclaimer">Shipping and taxes calculated at checkout</p>
					</div>
				</div>
			`;
	}

	private renderCartItem(
		item: CartItem,
		quantityControlsDisabled: boolean,
	): DocumentFragment {
		return this.tpl`
			<li class="cart-dock-item" data-cart-item-id="${item.id}">
				<div class="cart-dock-item__image">
					<div class="cart-dock-item__image-placeholder"></div>
				</div>
				<div class="cart-dock-item__content">
					<h3 class="cart-dock-item__name">${item.product_Name}</h3>
					<p class="cart-dock-item__price">$${item.product_Price.toLocaleString()}</p>
					<div class="cart-dock-item__quantity">
						<span class="cart-dock-item__qty-label">Qty:</span>
						<div class="cart-dock-item__qty-controls">
							<button
								class="cart-dock-item__qty-btn cart-dock-item__qty-btn--decrease"
								type="button"
								aria-label="Decrease quantity"
								${quantityControlsDisabled ? "disabled" : ""}
							>
								-
							</button>
							<span class="cart-dock-item__qty-value">${item.quantity}</span>
							<button
								class="cart-dock-item__qty-btn cart-dock-item__qty-btn--increase"
								type="button"
								aria-label="Increase quantity"
								${quantityControlsDisabled ? "disabled" : ""}
							>
								+
							</button>
						</div>
					</div>
				</div>
				<button class="cart-dock-item__remove" type="button" aria-label="Remove item">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 6h18"></path>
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
					</svg>
				</button>
			</li>
		`;
	}

	private readonly handleStateChange = (): void => {
		const previousState = this.lastStateSnapshot;
		const nextState = cartStore.getState();
		this.lastStateSnapshot = nextState;
		const previousItems = Array.isArray(previousState.items)
			? previousState.items
			: [];
		const nextItems = Array.isArray(nextState.items) ? nextState.items : [];

		const shouldRerender =
			!this.areItemsEquivalent(previousItems, nextItems) ||
			previousState.isLoading !== nextState.isLoading;

		this.syncRootStateClasses();
		if (shouldRerender) {
			this.rerender();
			this.bindEvents();
		}
	};

	private areItemsEquivalent(
		previousItems: CartItem[],
		nextItems: CartItem[],
	): boolean {
		if (previousItems.length !== nextItems.length) {
			return false;
		}

		for (let index = 0; index < previousItems.length; index += 1) {
			const previousItem = previousItems[index];
			const nextItem = nextItems[index];
			if (!nextItem) {
				return false;
			}

			if (
				previousItem.id !== nextItem.id ||
				previousItem.quantity !== nextItem.quantity ||
				previousItem.product_Price !== nextItem.product_Price ||
				previousItem.product_Name !== nextItem.product_Name
			) {
				return false;
			}
		}

		return true;
	}

	private bindEvents(): void {
		const iconBtn = this.element.querySelector<HTMLButtonElement>(
			".cart-dock__icon-btn",
		);
		if (iconBtn) {
			this.cleanup.on(iconBtn, "click", this.handleViewCart);
		}

		// View cart button - opens panel
		const viewBtn = this.element.querySelector<HTMLButtonElement>(
			".cart-dock__view-btn",
		);
		if (viewBtn) {
			this.cleanup.on(viewBtn, "click", this.handleViewCart);
		}

		const backdrop = this.element.querySelector<HTMLElement>(
			".cart-dock__backdrop",
		);
		if (backdrop) {
			this.cleanup.on(backdrop, "click", this.handleClose);
		}

		const panelCloseBtn = this.element.querySelector<HTMLButtonElement>(
			".cart-dock__panel-close",
		);
		if (panelCloseBtn) {
			this.cleanup.on(panelCloseBtn, "click", this.handleClose);
		}

		const checkoutBtn = this.element.querySelector<HTMLAnchorElement>(
			".cart-dock__checkout-btn",
		);
		if (checkoutBtn) {
			this.cleanup.on(checkoutBtn, "click", this.handleCheckout);
		}

		// Remove buttons
		const removeBtns = this.element.querySelectorAll<HTMLButtonElement>(
			".cart-dock-item__remove",
		);
		for (const btn of removeBtns) {
			this.cleanup.on(btn, "click", this.handleRemove);
		}

		const decreaseQtyBtns = this.element.querySelectorAll<HTMLButtonElement>(
			".cart-dock-item__qty-btn--decrease",
		);
		for (const btn of decreaseQtyBtns) {
			this.cleanup.on(btn, "click", this.handleDecreaseQuantity);
		}

		const increaseQtyBtns = this.element.querySelectorAll<HTMLButtonElement>(
			".cart-dock-item__qty-btn--increase",
		);
		for (const btn of increaseQtyBtns) {
			this.cleanup.on(btn, "click", this.handleIncreaseQuantity);
		}
	}

	private readonly handleViewCart = (): void => {
		cartStore.setOpen(true);
	};

	private readonly handleClose = (): void => {
		cartStore.setOpen(false);
	};

	private readonly handleCheckout = (): void => {
		cartStore.setOpen(false);
	};

	private readonly handleRemove = (event: Event): void => {
		const btn = event.currentTarget as HTMLButtonElement;
		const itemEl = btn.closest<HTMLElement>(".cart-dock-item");
		if (!itemEl) return;

		const cartItemId = Number(itemEl.dataset.cartItemId);
		void cartStore.removeFromCart(cartItemId);
	};

	private readonly handleDecreaseQuantity = (event: Event): void => {
		const item = this.getCartItemFromEvent(event);
		if (!item) {
			return;
		}

		void cartStore.updateQuantity(item.id, item.quantity - 1);
	};

	private readonly handleIncreaseQuantity = (event: Event): void => {
		const item = this.getCartItemFromEvent(event);
		if (!item) {
			return;
		}

		void cartStore.updateQuantity(item.id, item.quantity + 1);
	};

	private getCartItemFromEvent(event: Event): CartItem | null {
		const btn = event.currentTarget as HTMLElement | null;
		const itemEl = btn?.closest<HTMLElement>(".cart-dock-item");
		if (!itemEl) {
			return null;
		}

		const cartItemId = Number(itemEl.dataset.cartItemId);
		if (!Number.isFinite(cartItemId)) {
			return null;
		}

		const state = cartStore.getState();
		return state.items.find((item) => item.id === cartItemId) ?? null;
	}

	private startMorphToFullAnimation(): void {
		this.stopMorphToFullAnimation(false);
		this.stopMorphToIconAnimation(false);
		this.isMorphingToFull = true;
		this.syncRootStateClasses();

		this.morphTimerId = window.setTimeout(() => {
			this.isMorphingToFull = false;
			this.morphTimerId = null;
			this.syncRootStateClasses();
		}, 420);
	}

	private stopMorphToFullAnimation(syncClasses: boolean = true): void {
		if (this.morphTimerId !== null) {
			window.clearTimeout(this.morphTimerId);
			this.morphTimerId = null;
		}
		if (this.isMorphingToFull) {
			this.isMorphingToFull = false;
			if (syncClasses) {
				this.syncRootStateClasses();
			}
		}
	}

	private startMorphToIconAnimation(): void {
		this.stopMorphToIconAnimation(false);
		this.stopMorphToFullAnimation(false);
		this.isMorphingToIcon = true;
		this.syncRootStateClasses();

		this.morphToIconTimerId = window.setTimeout(() => {
			this.isMorphingToIcon = false;
			this.morphToIconTimerId = null;
			this.syncRootStateClasses();
		}, 420);
	}

	private stopMorphToIconAnimation(syncClasses: boolean = true): void {
		if (this.morphToIconTimerId !== null) {
			window.clearTimeout(this.morphToIconTimerId);
			this.morphToIconTimerId = null;
		}
		if (this.isMorphingToIcon) {
			this.isMorphingToIcon = false;
			if (syncClasses) {
				this.syncRootStateClasses();
			}
		}
	}

	private syncRootStateClasses(): void {
		const state = cartStore.getState();
		const items = Array.isArray(state.items) ? state.items : [];
		this.element.classList.toggle("has-items", items.length > 0);
		this.element.classList.toggle("is-open", state.isOpen);
		this.element.classList.toggle("is-mode-full", this.isGearsPage);
		this.element.classList.toggle("is-mode-icon", !this.isGearsPage);
		this.element.classList.toggle("is-morphing-to-full", this.isMorphingToFull);
		this.element.classList.toggle("is-morphing-to-icon", this.isMorphingToIcon);
		document.body.classList.toggle("cart-dock-open", state.isOpen);
	}
}
