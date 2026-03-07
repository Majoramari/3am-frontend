import { Button } from "@components/button";
import { type Product, productsApi } from "@lib/api";
import { View } from "@lib/view";

type SortOption = "featured" | "price-low" | "price-high";

type ProductCardModel = Product & {
	inStock: boolean;
	sortIndex: number;
};

type CategoryOption = {
	id: number;
	label: string;
	normalizedLabel: string;
};

const SORT_OPTIONS = new Set<SortOption>([
	"featured",
	"price-low",
	"price-high",
]);

const PLACEHOLDER_IMAGE = "/assets/shared/placeholder.png";
const LOADING_SKELETON_CARD_COUNT = 8;
const CARD_EXCERPT_FALLBACK =
	"Built for clean fitment, daily reliability, and confident every-day use.";

const isValidCategoryId = (value: unknown): value is number =>
	typeof value === "number" && Number.isInteger(value) && value > 0;

const normalizeCategoryLabel = (value: string | null | undefined): string =>
	(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const mapProductToCardModel = (
	product: Product,
	sortIndex: number,
): ProductCardModel => {
	const stockQuantity = Math.max(0, Math.floor(product.quantity));
	const inStock = stockQuantity > 0;

	return {
		...product,
		inStock,
		sortIndex,
	};
};

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

const toExcerpt = (value: string): string => {
	const normalized = value.trim().replace(/\s+/g, " ");
	if (!normalized) {
		return CARD_EXCERPT_FALLBACK;
	}
	if (normalized.length <= 110) {
		return normalized;
	}
	return `${normalized.slice(0, 107).trimEnd()}...`;
};

const formatPrice = (price: number): string =>
	`$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export class GearsProductGridSection extends View<"section"> {
	private products: ReadonlyArray<ProductCardModel> = [];
	private filteredProducts: ReadonlyArray<ProductCardModel> = [];
	private categoryOptions: ReadonlyArray<CategoryOption> = [];
	private selectedCategoryIds = new Set<number>();
	private currentSort: SortOption = "featured";
	private itemsPerPage = 12;
	private currentPage = 1;
	private isLoading = true;
	private isLoadingCategories = false;
	private inStockOnly = false;
	private loadError: string | null = null;
	private loadRequestId = 0;

	constructor() {
		super("section", { className: ["page-section", "gears-products"] });
	}

	protected override onMount(): void {
		this.bindEvents();
		void this.loadCategoryOptions();
		void this.loadProducts();
	}

	render(): DocumentFragment {
		const visibleProducts = this.filteredProducts.slice(
			0,
			this.currentPage * this.itemsPerPage,
		);
		const selectedCategoriesCount = this.selectedCategoryIds.size;

		return this.tpl`
			<div class="gears-products__header">
				<div class="gears-products__info">
					<h2 class="gears-products__title">All Products</h2>
					<p class="gears-products__count">
						${this.getCountLabel()}
					</p>
				</div>
				<div class="gears-products__actions">
					<label class="gears-products__sort-label">
						<span>Sort By</span>
						<select class="gears-products__sort-select" data-sort>
							<option value="featured" ${this.currentSort === "featured" ? "selected" : ""}>Featured</option>
							<option value="price-low" ${this.currentSort === "price-low" ? "selected" : ""}>Price: Low to High</option>
							<option value="price-high" ${this.currentSort === "price-high" ? "selected" : ""}>Price: High to Low</option>
						</select>
					</label>

					<label class="gears-products__stock-filter">
						<input
							type="checkbox"
							class="gears-products__stock-input"
							data-stock-only
							${this.inStockOnly ? "checked" : ""}
						/>
						<span>In Stock Only</span>
					</label>
				</div>
			</div>

			<div class="gears-products__categories">
				<div class="gears-products__categories-head">
					<h3 class="gears-products__categories-title">Categories</h3>
					<p class="gears-products__categories-status">
						${
							this.isLoadingCategories
								? "Loading categories..."
								: selectedCategoriesCount > 0
									? `${selectedCategoriesCount} selected`
									: "All categories"
						}
					</p>
				</div>
				<div class="gears-products__category-chips" role="group" aria-label="Filter by categories">
					<button
						type="button"
						class="gears-products__category-chip ${selectedCategoriesCount === 0 ? "is-active" : ""}"
						data-category-id="all"
						${this.isLoadingCategories ? "disabled" : ""}
						aria-pressed="${selectedCategoriesCount === 0}"
					>
						All
					</button>
					${this.categoryOptions.map(
						(category) => this.tpl`
							<button
								type="button"
								class="gears-products__category-chip ${this.selectedCategoryIds.has(category.id) ? "is-active" : ""}"
								data-category-id="${category.id}"
								${this.isLoadingCategories ? "disabled" : ""}
								aria-pressed="${this.selectedCategoryIds.has(category.id)}"
							>
								${category.label}
							</button>
						`,
					)}
				</div>
			</div>

			${this.isLoading ? this.renderLoadingSkeleton() : ""}

			${
				!this.isLoading && this.loadError
					? this.renderState("Could not load products", this.loadError, true)
					: ""
			}

			${
				!this.isLoading && !this.loadError && visibleProducts.length === 0
					? this.renderState(
							"No products found",
							"Try changing your filters or check back later.",
						)
					: ""
			}

			${
				!this.isLoading && !this.loadError && visibleProducts.length > 0
					? this.tpl`
						<div class="gears-products__grid">
							${visibleProducts.map((product) => this.renderProductCard(product))}
						</div>

						${
							this.shouldShowLoadMore()
								? this.tpl`
									<div class="gears-products__load-more">
										${new Button({
											as: "button",
											label: "Load More Products",
											variant: "outline",
											type: "button",
											className: "gears-products__load-more-btn",
										})}
									</div>
								`
								: this.tpl`
									<div class="gears-products__end">
										<p>You've reached the end</p>
									</div>
								`
						}
					`
					: ""
			}
		`;
	}

	private getCountLabel(): string {
		if (this.isLoading) {
			return "Loading products...";
		}

		if (this.loadError) {
			return "Unable to load products right now";
		}

		return `Showing ${this.filteredProducts.length} of ${this.products.length} products`;
	}

	private renderState(
		title: string,
		description: string,
		showRetry: boolean = false,
	): DocumentFragment {
		return this.tpl`
			<div class="gears-products__state" role="status" aria-live="polite">
				<h3 class="gears-products__state-title">${title}</h3>
				<p class="gears-products__state-copy">${description}</p>
				${
					showRetry
						? new Button({
								as: "button",
								label: "Try Again",
								variant: "outline",
								type: "button",
								className: "gears-products__state-action",
							})
						: ""
				}
			</div>
		`;
	}

	private renderLoadingSkeleton(): DocumentFragment {
		const skeletonIndexes = Array.from(
			{ length: LOADING_SKELETON_CARD_COUNT },
			(_, index) => index,
		);

		return this.tpl`
			<div class="gears-products__loading" role="status" aria-live="polite" aria-busy="true">
				<span class="visually-hidden">Loading products...</span>
				<div class="gears-products__grid gears-products__grid--skeleton">
					${skeletonIndexes.map((index) => this.renderSkeletonCard(index))}
				</div>
			</div>
		`;
	}

	private renderSkeletonCard(index: number): DocumentFragment {
		return this.tpl`
			<article
				class="gears-product-card gears-product-card--skeleton"
				aria-hidden="true"
				style="--skeleton-delay: ${index * 70}ms"
				>
					<div class="gears-product-card__skeleton-media gears-skeleton-block"></div>
					<div class="gears-product-card__content">
						<div class="gears-product-card__skeleton-chip gears-skeleton-block"></div>
						<div class="gears-product-card__skeleton-line gears-skeleton-block"></div>
						<div class="gears-product-card__skeleton-line gears-product-card__skeleton-line--short gears-skeleton-block"></div>
						<div class="gears-product-card__skeleton-line gears-product-card__skeleton-line--short gears-skeleton-block"></div>
						<div class="gears-product-card__skeleton-price gears-skeleton-block"></div>
					</div>
				</article>
			`;
	}

	private renderProductCard(product: ProductCardModel): DocumentFragment {
		const imageSrc = resolveImageSource(product.imageUrl);

		return this.tpl`
			<article class="gears-product-card" data-product-id="${product.id}">
				<a href="/gears/product/${product.id}" class="gears-product-card__image-wrapper">
					<img
						class="gears-product-card__image"
						src="${imageSrc}"
						alt="${product.name}"
						loading="lazy"
						onerror="this.onerror=null;this.src='/assets/shared/placeholder.png';"
					/>
				</a>

				<div class="gears-product-card__content">
					<div class="gears-product-card__top">
						<div class="gears-product-card__category">${product.categoryName}</div>
						<span class="gears-product-card__stock ${product.inStock ? "is-in" : "is-out"}">
							${product.inStock ? "In stock" : "Out of stock"}
						</span>
					</div>

					<h3 class="gears-product-card__name">
						<a href="/gears/product/${product.id}">${product.name}</a>
					</h3>

					<p class="gears-product-card__excerpt">
						${toExcerpt(product.description)}
					</p>

					<div class="gears-product-card__footer">
						<span class="gears-product-card__price-current">${formatPrice(product.price)}</span>
						<a href="/gears/product/${product.id}" class="gears-product-card__view-link">
							View Details
						</a>
					</div>
				</div>
			</article>
		`;
	}

	private shouldShowLoadMore(): boolean {
		return this.filteredProducts.length > this.currentPage * this.itemsPerPage;
	}

	private bindEvents(): void {
		const sortSelect = this.element.querySelector<HTMLSelectElement>(
			".gears-products__sort-select",
		);
		if (sortSelect) {
			this.cleanup.on(sortSelect, "change", this.handleSortChange);
		}

		const stockInput = this.element.querySelector<HTMLInputElement>(
			".gears-products__stock-input",
		);
		if (stockInput) {
			this.cleanup.on(stockInput, "change", this.handleStockFilterChange);
		}

		const categoryButtons = this.element.querySelectorAll<HTMLButtonElement>(
			".gears-products__category-chip",
		);
		for (const button of categoryButtons) {
			this.cleanup.on(button, "click", this.handleCategoryChipClick);
		}

		const loadMoreBtn = this.element.querySelector<HTMLButtonElement>(
			".gears-products__load-more-btn",
		);
		if (loadMoreBtn) {
			this.cleanup.on(loadMoreBtn, "click", this.handleLoadMore);
		}

		const retryButton = this.element.querySelector<HTMLButtonElement>(
			".gears-products__state-action",
		);
		if (retryButton) {
			this.cleanup.on(retryButton, "click", this.handleRetry);
		}

	}

	private readonly handleRetry = (): void => {
		void this.loadProducts();
	};

	private readonly handleSortChange = (event: Event): void => {
		const target = event.target as HTMLSelectElement;
		if (!SORT_OPTIONS.has(target.value as SortOption)) {
			return;
		}

		this.currentSort = target.value as SortOption;
		this.applySort();
		this.rerender();
		this.bindEvents();
	};

	private readonly handleStockFilterChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.inStockOnly = target.checked;
		this.currentPage = 1;
		this.applyFiltersAndSort();
		this.rerender();
		this.bindEvents();
	};

	private readonly handleCategoryChipClick = (event: Event): void => {
		const button = event.currentTarget as HTMLButtonElement;
		const rawId = button.dataset.categoryId;
		if (!rawId) {
			return;
		}

		if (rawId === "all") {
			if (this.selectedCategoryIds.size === 0) {
				return;
			}
			this.selectedCategoryIds.clear();
		} else {
			const categoryId = Number(rawId);
			if (!isValidCategoryId(categoryId)) {
				return;
			}
			if (this.selectedCategoryIds.has(categoryId)) {
				this.selectedCategoryIds.delete(categoryId);
			} else {
				this.selectedCategoryIds.add(categoryId);
			}
		}

		this.currentPage = 1;
		this.applyFiltersAndSort();
		this.rerender();
		this.bindEvents();
	};

	private readonly handleLoadMore = (): void => {
		this.currentPage += 1;
		this.rerender();
		this.bindEvents();
	};

	private async loadCategoryOptions(): Promise<void> {
		this.isLoadingCategories = true;
		this.rerender();
		this.bindEvents();

		try {
			const categories = await productsApi.getCategories();
			const deduped = new Map<number, CategoryOption>();
			for (const category of categories) {
				if (!isValidCategoryId(category.id)) {
					continue;
				}
				const label = category.name?.trim() || `Category ${category.id}`;
				if (!deduped.has(category.id)) {
					deduped.set(category.id, {
						id: category.id,
						label,
						normalizedLabel: normalizeCategoryLabel(label),
					});
				}
			}

			this.categoryOptions = Array.from(deduped.values());
			for (const selectedId of Array.from(this.selectedCategoryIds)) {
				if (!deduped.has(selectedId)) {
					this.selectedCategoryIds.delete(selectedId);
				}
			}
			this.applyFiltersAndSort();
		} catch (error) {
			console.error("Failed to load categories:", error);
			this.categoryOptions = [];
			this.selectedCategoryIds.clear();
			this.applyFiltersAndSort();
		} finally {
			this.isLoadingCategories = false;
			this.rerender();
			this.bindEvents();
		}
	}

	private async loadProducts(): Promise<void> {
		const requestId = ++this.loadRequestId;
		this.isLoading = true;
		this.loadError = null;
		this.rerender();
		this.bindEvents();

		try {
			const products = await productsApi.getAll();
			if (requestId !== this.loadRequestId) {
				return;
			}
			const source = Array.isArray(products) ? products : [];
			this.products = source.map((product, index) =>
				mapProductToCardModel(product, index),
			);
			this.currentPage = 1;
			this.applyFiltersAndSort();
			this.loadError = null;
		} catch (error) {
			if (requestId !== this.loadRequestId) {
				return;
			}
			console.error("Failed to load products:", error);
			this.products = [];
			this.filteredProducts = [];
			this.loadError =
				error instanceof Error
					? error.message
					: "Something went wrong while loading products.";
		} finally {
			if (requestId === this.loadRequestId) {
				this.isLoading = false;
				this.rerender();
				this.bindEvents();
			}
		}
	}

	private applyFiltersAndSort(): void {
		const selectedCategoryNames = new Set(
			this.categoryOptions
				.filter((category) => this.selectedCategoryIds.has(category.id))
				.map((category) => category.normalizedLabel),
		);

		this.filteredProducts = this.products.filter((product) => {
			if (this.inStockOnly && !product.inStock) {
				return false;
			}

			if (selectedCategoryNames.size > 0) {
				const categoryLabel = normalizeCategoryLabel(product.categoryName);
				if (!selectedCategoryNames.has(categoryLabel)) {
					return false;
				}
			}

			return true;
		});

		this.applySort();
	}

	private applySort(): void {
		const sorted = [...this.filteredProducts];

		switch (this.currentSort) {
			case "price-low":
				sorted.sort((a, b) => a.price - b.price);
				break;
			case "price-high":
				sorted.sort((a, b) => b.price - a.price);
				break;
			default:
				sorted.sort((a, b) => a.sortIndex - b.sortIndex);
				break;
		}

		this.filteredProducts = sorted;
	}
}
