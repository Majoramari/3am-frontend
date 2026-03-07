import { cartStore } from "@app/cart/cartStore";
import { Button } from "@components/button";
import { type Product, productsApi } from "@lib/api";
import { authStore } from "@lib/authStore";
import { getRouter } from "@lib/router";
import { emitToast } from "@lib/toastBus";
import { View } from "@lib/view";

type ProductSpec = {
	key: string;
	value: string;
};

const PLACEHOLDER_IMAGE = "/assets/shared/placeholder.png";
const RELATED_PRODUCTS_LIMIT = 4;
const RELATED_DESCRIPTION_MAX_LENGTH = 110;

const resolveImageSource = (imageUrl: string | null | undefined): string => {
	if (typeof imageUrl !== "string") {
		return PLACEHOLDER_IMAGE;
	}
	const normalized = imageUrl.trim();
	if (!normalized) {
		return PLACEHOLDER_IMAGE;
	}
	if (/^https?:\/\//i.test(normalized) || normalized.startsWith("/")) {
		return normalized;
	}
	return `/${normalized.replace(/^\/+/, "")}`;
};

const formatPrice = (price: number): string => `$${price.toLocaleString()}`;

const toExcerpt = (value: string, limit: number = RELATED_DESCRIPTION_MAX_LENGTH): string => {
	const normalized = value.replace(/\s+/g, " ").trim();
	if (!normalized) {
		return "No description available.";
	}
	if (normalized.length <= limit) {
		return normalized;
	}
	return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

export class ProductPage extends View<"section"> {
	private productId: number = 0;
	private product: Product | null = null;
	private similarProducts: Product[] = [];
	private isLoading = true;
	private error: string | null = null;
	private quantity = 1;

	constructor(productId: number) {
		super("section", { className: ["page-section", "product-page"] });
		this.productId = productId;
	}

	protected override onMount(): void {
		void this.loadProduct();
	}

	private async loadProduct(): Promise<void> {
		this.isLoading = true;
		this.error = null;
		this.quantity = 1;
		this.product = null;
		this.similarProducts = [];
		this.rerenderAndBindEvents();

		try {
			this.product = await productsApi.getById(this.productId);
			this.error = null;

			// Parse specs from JSON string if available
			if (this.product.specsJson) {
				try {
					const specsJson =
						typeof this.product.specsJson === "string"
							? this.product.specsJson
							: JSON.stringify(this.product.specsJson);
					const specs = JSON.parse(specsJson) as Record<string, unknown>;
					(this.product as Product & { specs: ProductSpec[] }).specs =
						Object.entries(specs).map(([key, value]) => ({
							key,
							value: String(value ?? ""),
						}));
				} catch {
					(this.product as Product & { specs: ProductSpec[] }).specs = [];
				}
			} else {
				(this.product as Product & { specs: ProductSpec[] }).specs = [];
			}
		} catch (error) {
			console.error("Failed to load product:", error);
			this.error = "Failed to load product. Please try again.";
		} finally {
			this.isLoading = false;
			this.rerenderAndBindEvents();
		}

		if (this.product && !this.error) {
			void this.loadSimilarProducts(this.product);
		}
	}

	render(): DocumentFragment {
		if (this.isLoading) {
			return this.tpl`
				<div class="product-page__loading">
					<div class="product-page__loading-spinner"></div>
					<p>Loading product...</p>
				</div>
			`;
		}

		if (this.error || !this.product) {
			return this.tpl`
				<div class="product-page__error">
					<h1 class="product-page__error-title">Product Not Found</h1>
					<p class="product-page__error-message">
						${this.error ?? "The product you're looking for doesn't exist."}
					</p>
					${new Button({
						label: "Back to Shop",
						variant: "solid",
						href: "/gears",
					})}
				</div>
			`;
		}

		const product = this.product;
		const specs = (product as Product & { specs: ProductSpec[] }).specs ?? [];
		const imageSrc = resolveImageSource(product.imageUrl);
		const shouldShowRelated = this.similarProducts.length > 0;
		const relatedCategoryLabel = product.categoryName.trim() || "featured";

		return this.tpl`
			<div class="product-page__shell">
				<nav class="product-page__breadcrumb">
					<a href="/gears" class="product-page__breadcrumb-link">Gears</a>
					<span class="product-page__breadcrumb-separator">/</span>
					<span class="product-page__breadcrumb-current">${product.name}</span>
				</nav>

				<div class="product-page__grid">
					<!-- Product Images -->
					<div class="product-page__media">
						<div class="product-page__main-image">
							<img
								class="product-page__image"
								src="${imageSrc}"
								alt="${product.name}"
								loading="lazy"
								onerror="this.onerror=null;this.src='/assets/shared/placeholder.png';"
							/>
						</div>
					</div>

					<!-- Product Info -->
					<div class="product-page__info">
						<div class="product-page__category">${product.categoryName}</div>
						<h1 class="product-page__title">${product.name}</h1>
						<p class="product-page__brand">${product.brand || "3AM"}</p>

						<div class="product-page__price">
							<span class="product-page__price-current">${formatPrice(product.price)}</span>
							${
								product.quantity > 0
									? this.tpl`
								<span class="product-page__price-status in-stock">In Stock</span>
							`
									: this.tpl`
								<span class="product-page__price-status out-of-stock">Out of Stock</span>
							`
							}
						</div>

						<p class="product-page__description">${product.description}</p>
						<p class="product-page__stock">Available: ${Math.max(0, product.quantity)}</p>

						<!-- Quantity Selector -->
						<div class="product-page__quantity">
							<label class="product-page__quantity-label">Quantity</label>
							<div class="product-page__quantity-controls">
								<button
									class="product-page__qty-btn"
									type="button"
									data-qty-decrease
									aria-label="Decrease quantity"
								>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="5" y1="12" x2="19" y2="12"></line>
									</svg>
								</button>
								<span class="product-page__qty-value">${this.quantity}</span>
								<button
									class="product-page__qty-btn"
									type="button"
									data-qty-increase
									aria-label="Increase quantity"
								>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="12" y1="5" x2="12" y2="19"></line>
										<line x1="5" y1="12" x2="19" y2="12"></line>
									</svg>
								</button>
							</div>
						</div>

						<!-- Add to Cart -->
						<div class="product-page__actions">
							${new Button({
								as: "button",
								type: "button",
								label: product.quantity > 0 ? "Add to Cart" : "Out of Stock",
								variant: "solid",
								className: "product-page__add-to-cart",
								attrs: { disabled: product.quantity <= 0 },
							})}
							${new Button({
								as: "button",
								type: "button",
								label: "Buy Now",
								variant: "outline",
								className: "product-page__buy-now",
								attrs: { disabled: product.quantity <= 0 },
							})}
						</div>

						<!-- Product Specs -->
						${
							specs.length > 0
								? this.tpl`
							<div class="product-page__specs">
								<h3 class="product-page__specs-title">Specifications</h3>
								<dl class="product-page__specs-list">
									${specs.map(
										(spec) => this.tpl`
											<div class="product-page__spec-item">
												<dt class="product-page__spec-key">${spec.key}</dt>
												<dd class="product-page__spec-value">${spec.value}</dd>
											</div>
										`,
									)}
								</dl>
							</div>
						`
								: ""
						}
					</div>
				</div>

				${
					shouldShowRelated
						? this.tpl`
					<section class="product-page__related" aria-label="You may also like">
						<header class="product-page__related-header">
							<h2 class="product-page__related-title">You may also like</h2>
							<p class="product-page__related-subtitle">
								Similar picks from the ${relatedCategoryLabel} collection.
							</p>
						</header>
						<div class="product-page__related-grid">
							${this.similarProducts.map((relatedProduct) => {
								const relatedImage = resolveImageSource(relatedProduct.imageUrl);
								const inStock = relatedProduct.quantity > 0;
								return this.tpl`
									<article class="product-page__related-card">
										<a
											href="/gears/product/${relatedProduct.id}"
											class="product-page__related-media"
											aria-label="View ${relatedProduct.name}"
										>
											<img
												src="${relatedImage}"
												alt="${relatedProduct.name}"
												loading="lazy"
												onerror="this.onerror=null;this.src='/assets/shared/placeholder.png';"
											/>
										</a>
										<div class="product-page__related-content">
											<p class="product-page__related-category">${relatedProduct.categoryName}</p>
											<h3 class="product-page__related-name">
												<a href="/gears/product/${relatedProduct.id}">${relatedProduct.name}</a>
											</h3>
											<p class="product-page__related-description">
												${toExcerpt(relatedProduct.description)}
											</p>
											<div class="product-page__related-meta">
												<span class="product-page__related-price">${formatPrice(relatedProduct.price)}</span>
												<span class="product-page__related-stock ${inStock ? "is-in-stock" : "is-out-stock"}">
													${inStock ? "In stock" : "Out of stock"}
												</span>
											</div>
										</div>
									</article>
								`;
							})}
						</div>
					</section>
				`
						: ""
				}
			</div>
		`;
	}

	private async loadSimilarProducts(product: Product): Promise<void> {
		try {
			const allProducts = await productsApi.getAll();
			const categoryKey = product.categoryName.trim().toLowerCase();
			const brandKey = product.brand.trim().toLowerCase();

			const relevanceScore = (candidate: Product): number => {
				let score = 0;
				if (
					categoryKey &&
					candidate.categoryName.trim().toLowerCase() === categoryKey
				) {
					score += 4;
				}
				if (brandKey && candidate.brand.trim().toLowerCase() === brandKey) {
					score += 2;
				}
				if (candidate.quantity > 0) {
					score += 1;
				}
				score -= Math.min(Math.abs(candidate.price - product.price) / 250, 2);
				return score;
			};

			this.similarProducts = allProducts
				.filter((candidate) => candidate.id !== product.id)
				.sort((a, b) => {
					const scoreDelta = relevanceScore(b) - relevanceScore(a);
					if (scoreDelta !== 0) {
						return scoreDelta;
					}
					return a.name.localeCompare(b.name);
				})
				.slice(0, RELATED_PRODUCTS_LIMIT);
		} catch (error) {
			console.error("Failed to load related products:", error);
			this.similarProducts = [];
		}

		this.rerenderAndBindEvents();
	}

	private bindEvents(): void {
		// Quantity buttons
		const decreaseBtn = this.element.querySelector<HTMLButtonElement>(
			"[data-qty-decrease]",
		);
		const increaseBtn = this.element.querySelector<HTMLButtonElement>(
			"[data-qty-increase]",
		);

		if (decreaseBtn) {
			this.cleanup.on(decreaseBtn, "click", this.handleQuantityChange);
		}
		if (increaseBtn) {
			this.cleanup.on(increaseBtn, "click", this.handleQuantityChange);
		}

		// Add to cart button
		const addToCartBtn = this.element.querySelector<HTMLButtonElement>(
			".product-page__add-to-cart",
		);
		if (addToCartBtn) {
			this.cleanup.on(addToCartBtn, "click", this.handleAddToCart);
		}

		// Buy now button
		const buyNowBtn = this.element.querySelector<HTMLButtonElement>(
			".product-page__buy-now",
		);
		if (buyNowBtn) {
			this.cleanup.on(buyNowBtn, "click", this.handleBuyNow);
		}
	}

	private rerenderAndBindEvents(): void {
		this.rerender();
		this.bindEvents();
	}

	private readonly handleQuantityChange = (event: Event): void => {
		const btn = event.currentTarget as HTMLButtonElement;
		const isIncrease = btn.dataset.qtyIncrease !== undefined;
		const qtyEl = this.element.querySelector<HTMLElement>(
			".product-page__qty-value",
		);

		if (!qtyEl) return;

		const maxQty = Math.max(1, this.product?.quantity ?? 1);
		const newQty = isIncrease
			? Math.min(maxQty, this.quantity + 1)
			: Math.max(1, this.quantity - 1);
		this.quantity = newQty;
		qtyEl.textContent = String(newQty);
	};

	private readonly handleAddToCart = (): void => {
		if (!this.product) return;
		if (!authStore.getState().isAuthenticated) {
			emitToast({
				level: "warning",
				title: "Sign in required",
				message: "Please sign in to add this product to your cart.",
			});
			getRouter().navigate("/signin");
			return;
		}

		void cartStore.addToCart(
			{
				...this.product,
				id: this.product.id,
				name: this.product.name,
				price: this.product.price,
				imageUrl: this.product.imageUrl,
				brand: this.product.brand,
				description: this.product.description,
				quantity: this.product.quantity,
				specsJson: this.product.specsJson,
				categoryName: this.product.categoryName,
			},
			this.quantity,
		);
	};

	private readonly handleBuyNow = async (): Promise<void> => {
		if (!this.product) {
			return;
		}
		if (!authStore.getState().isAuthenticated) {
			emitToast({
				level: "warning",
				title: "Sign in required",
				message: "Please sign in before continuing to checkout.",
			});
			getRouter().navigate("/signin");
			return;
		}

		await cartStore.addToCart(
			{
				...this.product,
				id: this.product.id,
				name: this.product.name,
				price: this.product.price,
				imageUrl: this.product.imageUrl,
				brand: this.product.brand,
				description: this.product.description,
				quantity: this.product.quantity,
				specsJson: this.product.specsJson,
				categoryName: this.product.categoryName,
			},
			this.quantity,
		);

		if (cartStore.getState().error) {
			return;
		}

		const router = getRouter();
		router.navigate("/checkout");
	};
}
