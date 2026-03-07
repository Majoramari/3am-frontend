import { cartStore } from "@app/cart/cartStore";
import { Button } from "@components/button";
import { type CartItem, cartApi, paymentApi } from "@lib/api";
import type { OrderDTO } from "@lib/api/auth.types";
import { authStore } from "@lib/authStore";
import { getRouter } from "@lib/router";
import { emitToast } from "@lib/toastBus";
import { View } from "@lib/view";

type PaymentResultStatus = "success" | "failed" | "cancelled";

type PaymentResultState = {
	status: PaymentResultStatus;
	paymentId: string | null;
	orderId: string | null;
};

type CheckoutTotals = {
	subtotalEgp: number;
	shippingEgp: number;
	taxesEgp: number;
	grandTotalEgp: number;
	subtotalKwd: number;
	shippingKwd: number;
	taxesKwd: number;
	grandTotalKwd: number;
};

const PAYMENT_RESULT_STATUSES: Record<string, PaymentResultStatus> = {
	success: "success",
	succeeded: "success",
	paid: "success",
	failed: "failed",
	fail: "failed",
	error: "failed",
	cancelled: "cancelled",
	canceled: "cancelled",
};

const sanitizePaymentId = (value: string): string =>
	value.replace(/[^a-zA-Z0-9_-]/g, "");
const sanitizeOrderId = (value: string): string =>
	value.replace(/[^a-zA-Z0-9_-]/g, "");

const SHIPPING_FEE_EGP = 3.5;
const TAX_RATE = 0.14;
const FALLBACK_EGP_PER_USD = 50;
const FALLBACK_USD_PER_KWD = 3.25;

const parsePositiveNumber = (
	value: string | undefined,
	fallback: number,
): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const EGP_PER_USD = parsePositiveNumber(
	import.meta.env.VITE_EGP_PER_USD,
	FALLBACK_EGP_PER_USD,
);
const USD_PER_KWD = parsePositiveNumber(
	import.meta.env.VITE_USD_PER_KWD,
	FALLBACK_USD_PER_KWD,
);

const formatMoneyEgp = (amount: number): string =>
	new Intl.NumberFormat("en-EG", {
		style: "currency",
		currency: "EGP",
		currencyDisplay: "narrowSymbol",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);

const toKwdFromEgp = (amountEgp: number): number =>
	amountEgp / EGP_PER_USD / USD_PER_KWD;

export class CheckoutPage extends View<"section"> {
	private unsubscribeCart: (() => void) | null = null;
	private isSubmitting = false;
	private paymentResult: PaymentResultState | null = null;
	private paymentOrder: OrderDTO | null = null;
	private isLoadingPaymentOrder = false;
	private paymentOrderError: string | null = null;

	constructor() {
		super("section", { className: ["page-section", "checkout-page"] });
	}

	protected override onMount(): void {
		this.paymentResult = this.readPaymentResultFromLocation();
		if (this.paymentResult) {
			cartStore.setOpen(false);
			if (
				this.paymentResult.status === "success" &&
				this.paymentResult.orderId &&
				authStore.getState().isAuthenticated
			) {
				void this.loadPaymentOrder(this.paymentResult.orderId);
			}
			return;
		}

		if (!authStore.getState().isAuthenticated) {
			emitToast({
				level: "warning",
				title: "Sign in required",
				message: "Please sign in before continuing to checkout.",
			});
			const router = getRouter();
			router.navigate("/signin");
			return;
		}

		this.unsubscribeCart = cartStore.subscribe(() => {
			this.rerender();
			this.bindEvents();
		});

		void cartStore.loadCart();
		this.bindEvents();
	}

	protected override onDestroy(): void {
		this.unsubscribeCart?.();
	}

	render(): DocumentFragment {
		this.paymentResult = this.readPaymentResultFromLocation();
		if (this.paymentResult) {
			return this.renderPaymentResult(this.paymentResult);
		}

		const state = cartStore.getState();
		const items = state.items;
		const isBusy = state.isLoading || this.isSubmitting;
		const totals = this.getCheckoutTotals(items);

		if (state.isLoading && items.length === 0) {
			return this.tpl`
				<div class="checkout-shell checkout-shell--loading">
					<p class="checkout-loading">Loading checkout details...</p>
				</div>
			`;
		}

		if (items.length === 0) {
			return this.tpl`
				<div class="checkout-shell checkout-shell--empty">
					<h1 class="checkout-empty__title">Your cart is empty</h1>
					<p class="checkout-empty__message">
						Add gear items to continue to payment.
					</p>
					${new Button({
						as: "a",
						href: "/gears",
						label: "Browse Gears",
						variant: "cta",
						className: "checkout-empty__action",
					})}
				</div>
			`;
		}

		return this.tpl`
			<div class="checkout-shell">
				<header class="checkout-header">
					<p class="checkout-eyebrow">Secure Checkout</p>
					<h1 class="checkout-title">Payment</h1>
				</header>

				<div class="checkout-grid">
					<form class="checkout-form" data-checkout-form novalidate>
						<section class="checkout-section checkout-section--redirect">
							<h2 class="checkout-section__title">Secure Gateway Payment</h2>
							<p class="checkout-redirect__message">
								You will complete payment on our trusted provider page. No card details are entered on 3AM.
							</p>
							<ul class="checkout-gateway__list">
								<li>Charge includes shipping and tax</li>
								<li>Redirected securely to gateway checkout</li>
							</ul>
						</section>

						<div class="checkout-actions">
							${new Button({
								as: "button",
								type: "submit",
								label: this.isSubmitting ? "Redirecting..." : "Pay now",
								variant: "cta",
								className: "checkout-submit",
								attrs: { disabled: isBusy },
							})}
							${new Button({
								as: "a",
								href: "/gears",
								label: "Back to shop",
								variant: "text",
								className: "checkout-back",
							})}
						</div>
					</form>

					<aside class="checkout-summary" aria-label="Order summary">
						<h2 class="checkout-summary__title">Order Summary</h2>
						<p class="checkout-summary__currency">Displayed in E£ (EGP)</p>
						<ul class="checkout-summary__items">
							${items.map((item) => this.renderSummaryItem(item, isBusy))}
						</ul>

						<div class="checkout-summary__totals">
							<div class="checkout-summary__row">
								<span>Subtotal</span>
								<span>${formatMoneyEgp(totals.subtotalEgp)}</span>
							</div>
							<div class="checkout-summary__row">
								<span>Shipping</span>
								<span>${formatMoneyEgp(totals.shippingEgp)}</span>
							</div>
							<div class="checkout-summary__row">
								<span>Tax (14%)</span>
								<span>${formatMoneyEgp(totals.taxesEgp)}</span>
							</div>
							<div class="checkout-summary__row is-grand-total">
								<span>Total Due</span>
								<span>${formatMoneyEgp(totals.grandTotalEgp)}</span>
							</div>
						</div>
					</aside>
				</div>
			</div>
		`;
	}

	private readPaymentResultFromLocation(): PaymentResultState | null {
		const params = this.getCheckoutSearchParams();
		const rawStatus = (params.get("payment") ?? params.get("status") ?? "")
			.trim()
			.toLowerCase();
		const status = PAYMENT_RESULT_STATUSES[rawStatus];
		if (!status) {
			return null;
		}

		const rawPaymentId = (
			params.get("paymentId") ??
			params.get("Id") ??
			params.get("id") ??
			""
		).trim();
		const sanitizedPaymentId = rawPaymentId
			? sanitizePaymentId(rawPaymentId)
			: "";
		const rawOrderId = (
			params.get("orderId") ??
			params.get("OrderId") ??
			""
		).trim();
		const sanitizedOrderId = rawOrderId ? sanitizeOrderId(rawOrderId) : "";

		return {
			status,
			paymentId: sanitizedPaymentId || null,
			orderId: sanitizedOrderId || null,
		};
	}

	private getCheckoutSearchParams(): URLSearchParams {
		const rawSearch = window.location.search.startsWith("?")
			? window.location.search.slice(1)
			: window.location.search;
		if (!rawSearch) {
			return new URLSearchParams();
		}

		// Handle malformed callback URLs that append extra "?" fragments.
		const normalizedSearch = rawSearch
			.replace(/&amp;/g, "&")
			.replace(/\?/g, "&");
		return new URLSearchParams(normalizedSearch);
	}

	private renderPaymentResult(result: PaymentResultState): DocumentFragment {
		const isSuccess = result.status === "success";
		const isCancelled = result.status === "cancelled";
		const paymentStatusLabel = isSuccess
			? "Success"
			: isCancelled
				? "Cancelled"
				: "Failed";
		const title = isSuccess
			? "Payment Successful"
			: isCancelled
				? "Payment Cancelled"
				: "Payment Failed";
		const message = isSuccess
			? "Your payment was verified. We are now preparing your order."
			: isCancelled
				? "The payment flow was cancelled. You can retry checkout at any time."
				: "We could not confirm your payment. Please retry checkout.";
		const retryUrl = "/checkout";

		return this.tpl`
			<div class="checkout-result-page checkout-result-page--${result.status}">
				<header class="checkout-result-page__hero">
					<p class="checkout-result-page__eyebrow">Payment Status</p>
					<h1 class="checkout-result-page__title">${title}</h1>
					<p class="checkout-result-page__message">${message}</p>
				</header>

				<div class="checkout-result-page__grid">
					<section class="checkout-result-panel" aria-label="Order information">
						<h2 class="checkout-result-panel__title">Order Information</h2>
						<dl class="checkout-result-facts">
							<div class="checkout-result-fact">
								<dt>Payment Status</dt>
								<dd>${paymentStatusLabel}</dd>
							</div>
							<div class="checkout-result-fact">
								<dt>Order ID</dt>
								<dd>${result.orderId ?? "Not provided"}</dd>
							</div>
							<div class="checkout-result-fact">
								<dt>Payment ID</dt>
								<dd>${result.paymentId ?? "Not provided"}</dd>
							</div>
						</dl>
						${isSuccess ? this.renderPaymentOrderDetails() : ""}
					</section>

					<section class="checkout-result-panel checkout-result-panel--actions">
						<h2 class="checkout-result-panel__title">Next Step</h2>
							<p class="checkout-result-panel__message">
								${
									isSuccess
										? "Your order is confirmed. Continue shopping."
										: "You can retry checkout now or return to home."
								}
							</p>
							<div class="checkout-result-page__actions">
								${
									isSuccess
										? new Button({
												as: "a",
												href: "/gears",
												label: "Back to Gears",
												variant: "cta",
												className: "checkout-result-page__action",
											})
										: new Button({
												as: "a",
												href: retryUrl,
												label: "Try Checkout Again",
												variant: "cta",
												className: "checkout-result-page__action",
											})
								}
							${new Button({
								as: "a",
								href: isSuccess ? "/gears" : "/",
								label: isSuccess ? "Continue Shopping" : "Back Home",
								variant: "outline",
								className: "checkout-result-page__action",
							})}
						</div>
					</section>
				</div>
			</div>
		`;
	}

	private async loadPaymentOrder(orderIdValue: string): Promise<void> {
		const orderId = Number(orderIdValue);
		if (!Number.isFinite(orderId)) {
			return;
		}

		this.isLoadingPaymentOrder = true;
		this.paymentOrder = null;
		this.paymentOrderError = null;
		this.rerender();

		try {
			const cachedOrder =
				authStore
					.getState()
					.user?.orders.find((candidate) => candidate.id === orderId) ?? null;
			if (cachedOrder) {
				this.paymentOrder = cachedOrder;
				return;
			}

			const profile = await authStore.loadProfile();
			const matchedOrder =
				profile?.orders.find((candidate) => candidate.id === orderId) ?? null;
			if (!matchedOrder) {
				this.paymentOrderError =
					"We could not load full order details yet. Please check your orders shortly.";
				return;
			}

			this.paymentOrder = matchedOrder;
		} catch {
			this.paymentOrderError =
				"Unable to load order details right now. Please check your orders shortly.";
		} finally {
			this.isLoadingPaymentOrder = false;
			this.rerender();
		}
	}

	private renderPaymentOrderDetails(): DocumentFragment {
		if (this.isLoadingPaymentOrder) {
			return this.tpl`
				<p class="checkout-result-order__note">Loading order details...</p>
			`;
		}

		if (this.paymentOrderError) {
			return this.tpl`
				<p class="checkout-result-order__note checkout-result-order__note--warning">
					${this.paymentOrderError}
				</p>
			`;
		}

		if (!this.paymentOrder) {
			return this.tpl`
				<p class="checkout-result-order__note">
					Order details will appear here once available.
				</p>
			`;
		}

		const itemCount = this.paymentOrder.cartItems.reduce(
			(total, item) => total + item.quantity,
			0,
		);

		return this.tpl`
			<div class="checkout-result-order">
				<div class="checkout-result-order__summary">
					<p>
						<span>Order Status</span>
						<strong>${this.paymentOrder.status}</strong>
					</p>
					<p>
						<span>Payment</span>
						<strong>${this.paymentOrder.payment_Status}</strong>
					</p>
					<p>
						<span>Items</span>
						<strong>${itemCount}</strong>
					</p>
					<p>
						<span>Total</span>
						<strong>${formatMoneyEgp(this.paymentOrder.total_Price)}</strong>
					</p>
				</div>
				${
					this.paymentOrder.cartItems.length > 0
						? this.tpl`
							<ul class="checkout-result-order__items" aria-label="Order items">
								${this.paymentOrder.cartItems.map(
									(item) => this.tpl`
										<li class="checkout-result-order__item">
											<span class="checkout-result-order__item-name">${item.product_Name}</span>
											<span class="checkout-result-order__item-qty">x${item.quantity}</span>
											<span class="checkout-result-order__item-total">
												${formatMoneyEgp(item.product_Price * item.quantity)}
											</span>
										</li>
									`,
								)}
							</ul>
						`
						: this.tpl`
							<p class="checkout-result-order__note">
								No line items were returned for this order.
							</p>
						`
				}
			</div>
		`;
	}

	private renderSummaryItem(
		item: CartItem,
		disabled: boolean,
	): DocumentFragment {
		const lineTotal = item.product_Price * item.quantity;
		return this.tpl`
			<li class="checkout-item" data-cart-item-id="${item.id}">
				<div class="checkout-item__meta">
					<h3 class="checkout-item__name">${item.product_Name}</h3>
					<p class="checkout-item__price">${formatMoneyEgp(item.product_Price)} each</p>
					<p class="checkout-item__line-total">Line total: ${formatMoneyEgp(lineTotal)}</p>
				</div>
				<div class="checkout-item__controls">
					<div class="checkout-item__qty-controls">
						<button
							type="button"
							class="checkout-item__qty-btn"
							data-qty-action="decrease"
							${disabled ? "disabled" : ""}
						>
							-
						</button>
						<span class="checkout-item__qty-value">${item.quantity}</span>
						<button
							type="button"
							class="checkout-item__qty-btn"
							data-qty-action="increase"
							${disabled ? "disabled" : ""}
						>
							+
						</button>
					</div>
					<button
						type="button"
						class="checkout-item__remove"
						data-remove-item
						${disabled ? "disabled" : ""}
					>
						Remove
					</button>
				</div>
			</li>
		`;
	}

	private bindEvents(): void {
		const form = this.element.querySelector<HTMLFormElement>(
			"[data-checkout-form]",
		);
		if (form) {
			this.cleanup.on(form, "submit", this.handleSubmit);
		}

		const qtyButtons =
			this.element.querySelectorAll<HTMLButtonElement>("[data-qty-action]");
		for (const button of qtyButtons) {
			this.cleanup.on(button, "click", this.handleQuantityChange);
		}

		const removeButtons =
			this.element.querySelectorAll<HTMLButtonElement>("[data-remove-item]");
		for (const button of removeButtons) {
			this.cleanup.on(button, "click", this.handleRemoveItem);
		}
	}

	private readonly handleQuantityChange = (event: Event): void => {
		const button = event.currentTarget as HTMLButtonElement;
		const action = button.dataset.qtyAction;
		if (!action) {
			return;
		}

		const item = this.getCartItemFromEvent(button);
		if (!item || this.isSubmitting) {
			return;
		}

		if (action === "increase") {
			void cartStore.updateQuantity(item.id, item.quantity + 1);
			return;
		}

		if (action === "decrease") {
			void cartStore.updateQuantity(item.id, item.quantity - 1);
		}
	};

	private readonly handleRemoveItem = (event: Event): void => {
		if (this.isSubmitting) {
			return;
		}

		const button = event.currentTarget as HTMLButtonElement;
		const item = this.getCartItemFromEvent(button);
		if (!item) {
			return;
		}

		void cartStore.removeFromCart(item.id);
	};

	private readonly handleSubmit = async (event: Event): Promise<void> => {
		event.preventDefault();
		if (this.isSubmitting) {
			return;
		}

		if (!authStore.getState().isAuthenticated) {
			emitToast({
				level: "warning",
				title: "Sign in required",
				message: "Please sign in before completing payment.",
			});
			const router = getRouter();
			router.navigate("/signin");
			return;
		}

		if (cartStore.getItemCount() === 0) {
			emitToast({
				level: "warning",
				title: "Cart is empty",
				message: "Add at least one item before payment.",
			});
			return;
		}

		this.isSubmitting = true;
		this.rerender();
		this.bindEvents();

		try {
			const order = await cartApi.checkout();
			const totals = this.getCheckoutTotals(cartStore.getState().items);
			const frontendUrl = this.buildPaymentFrontendUrl(totals);
			const payment = await paymentApi.confirm({
				method: 1,
				frontendUrl,
			});
			if (!payment.success) {
				throw new Error(payment.message || "Payment request failed.");
			}

			if (payment.requiresRedirect) {
				if (!payment.paymentUrl) {
					throw new Error("Payment gateway URL is missing.");
				}
				cartStore.setOpen(false);
				emitToast({
					level: "info",
					title: "Redirecting",
					message: "Opening secure payment page...",
					durationMs: 2200,
				});
				window.location.assign(payment.paymentUrl);
				return;
			}

			await cartStore.loadCart();
			cartStore.setOpen(false);

			emitToast({
				level: "success",
				title: "Order placed",
				message: `Order #${order.id} created successfully.`,
			});

			const paymentMessage = payment.message?.trim();
			if (paymentMessage) {
				emitToast({
					level: "info",
					title: "Payment",
					message: paymentMessage,
					durationMs: 3600,
				});
			}

			const router = getRouter();
			router.navigate("/gears");
		} catch (error) {
			const rawMessage =
				error instanceof Error ? error.message : "Unable to complete checkout.";
			const normalizedMessage = rawMessage.toLowerCase();
			const message =
				normalizedMessage.includes("customermobile") ||
				normalizedMessage.includes("request.customermobile")
					? "Your account phone number is invalid for payment. Use 8 to 11 digits and try again."
					: rawMessage;
			emitToast({
				level: "error",
				title: "Checkout failed",
				message,
			});
		} finally {
			this.isSubmitting = false;
			this.rerender();
			this.bindEvents();
		}
	};

	private getCartItemFromEvent(target: HTMLElement): CartItem | null {
		const itemEl = target.closest<HTMLElement>("[data-cart-item-id]");
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

	private getCheckoutTotals(items: ReadonlyArray<CartItem>): CheckoutTotals {
		const subtotalEgp = items.reduce(
			(total, item) => total + item.product_Price * item.quantity,
			0,
		);
		const shippingEgp = items.length > 0 ? SHIPPING_FEE_EGP : 0;
		const taxesEgp = subtotalEgp * TAX_RATE;
		const grandTotalEgp = subtotalEgp + shippingEgp + taxesEgp;

		const subtotalKwd = toKwdFromEgp(subtotalEgp);
		const shippingKwd = toKwdFromEgp(shippingEgp);
		const taxesKwd = toKwdFromEgp(taxesEgp);
		const grandTotalKwd = toKwdFromEgp(grandTotalEgp);

		return {
			subtotalEgp,
			shippingEgp,
			taxesEgp,
			grandTotalEgp,
			subtotalKwd,
			shippingKwd,
			taxesKwd,
			grandTotalKwd,
		};
	}

	private buildPaymentFrontendUrl(totals: CheckoutTotals): string {
		const url = new URL("/checkout", window.location.origin);
		url.searchParams.set("currency", "KWD");
		url.searchParams.set("subtotal", totals.subtotalKwd.toFixed(3));
		url.searchParams.set("shipping", totals.shippingKwd.toFixed(3));
		url.searchParams.set("tax", totals.taxesKwd.toFixed(3));
		url.searchParams.set("total", totals.grandTotalKwd.toFixed(3));
		url.searchParams.set("sourceCurrency", "EGP");
		url.searchParams.set("sourceTotal", totals.grandTotalEgp.toFixed(2));
		return url.toString();
	}
}
