import { Button } from "@components/button";
import { dashboardApi, type Product, productsApi } from "@lib/api";
import type { Category } from "@lib/api/auth.types";
import { isAdmin, isAuthenticated, requireAdmin } from "@lib/authGuard";
import { optimizeImageToWebp } from "@lib/imageOptimization";
import { emitToast } from "@lib/toastBus";
import { View } from "@lib/view";

type DashboardMetric = {
	label: string;
	value: string;
};

type FormFeedbackState = "success" | "error";

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

const parseJson = (value: string): Record<string, unknown> | null => {
	const trimmed = value.trim();
	if (!trimmed) {
		return {};
	}

	try {
		const parsed = JSON.parse(trimmed) as unknown;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return null;
		}
		return parsed as Record<string, unknown>;
	} catch {
		return null;
	}
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 2,
});

export class DashboardPage extends View<"section"> {
	private isLoading = true;
	private error: string | null = null;
	private categories: Category[] = [];
	private isLoadingCategories = false;
	private isSubmittingProduct = false;

	private products: Product[] = [];
	private isLoadingProducts = false;
	private productsError: string | null = null;
	private updatingProductId: number | null = null;
	private deletingProductId: number | null = null;

	constructor() {
		super("section", { className: ["page-section", "dashboard-page"] });
	}

	protected override onMount(): void {
		requireAdmin();
		if (!isAuthenticated() || !isAdmin()) {
			return;
		}

		void this.refreshAll();
		this.bindEvents();
	}

	private async refreshAll(): Promise<void> {
		await Promise.all([
			this.loadDashboard(),
			this.loadCategories(),
			this.loadProducts(),
		]);
	}

	private async loadDashboard(): Promise<void> {
		this.isLoading = true;
		this.error = null;
		this.rerender();
		this.bindEvents();

		try {
			await dashboardApi.getDashboard();
		} catch (error) {
			console.error("Failed to load dashboard:", error);
			const message =
				error instanceof Error
					? error.message
					: "Unable to load dashboard data.";

			const normalizedMessage = message.toLowerCase();
			if (
				normalizedMessage.includes("403") ||
				normalizedMessage.includes("forbidden") ||
				normalizedMessage.includes("permission")
			) {
				this.error =
					"You do not have permission to access the admin dashboard.";
			} else {
				this.error = message;
			}
		} finally {
			this.isLoading = false;
			this.rerender();
			this.bindEvents();
		}
	}

	private async loadCategories(): Promise<void> {
		this.isLoadingCategories = true;
		this.rerender();
		this.bindEvents();

		try {
			const categories = await productsApi.getCategories();
			this.categories = [...categories].sort((a, b) =>
				(a.name ?? "").localeCompare(b.name ?? ""),
			);
		} catch (error) {
			console.error("Failed to load product categories:", error);
			emitToast({
				level: "error",
				title: "Could not load categories",
				message: "Refresh and try again before adding a product.",
			});
		} finally {
			this.isLoadingCategories = false;
			this.rerender();
			this.bindEvents();
		}
	}

	private async loadProducts(): Promise<void> {
		this.isLoadingProducts = true;
		this.productsError = null;
		this.rerender();
		this.bindEvents();

		try {
			const products = await productsApi.getAllAdmin();
			const activeProducts = products.filter(
				(product) => product.isActive !== false,
			);
			this.products = [...activeProducts].sort((a, b) => b.id - a.id);
		} catch (error) {
			console.error("Failed to load products:", error);
			this.productsError =
				error instanceof Error ? error.message : "Unable to load products.";
		} finally {
			this.isLoadingProducts = false;
			this.rerender();
			this.bindEvents();
		}
	}

	private bindEvents(): void {
		const refreshButton = this.element.querySelector<HTMLButtonElement>(
			"[data-dashboard-refresh]",
		);
		if (refreshButton) {
			this.cleanup.on(refreshButton, "click", this.handleRefresh);
		}

		const addProductForm = this.element.querySelector<HTMLFormElement>(
			"[data-admin-add-product-form]",
		);
		if (addProductForm) {
			this.cleanup.on(addProductForm, "submit", this.handleAddProductSubmit);
		}

		const imageBrowseButton = this.element.querySelector<HTMLButtonElement>(
			"[data-admin-image-browse]",
		);
		const imageInput = this.element.querySelector<HTMLInputElement>(
			"[data-admin-product-image-input]",
		);
		if (imageBrowseButton && imageInput) {
			this.cleanup.on(imageBrowseButton, "click", () => {
				imageInput.click();
			});
		}

		if (imageInput) {
			this.cleanup.on(imageInput, "change", this.handleImageSelection);
		}

		const updateForms = this.element.querySelectorAll<HTMLFormElement>(
			"[data-admin-product-update-form]",
		);
		for (const form of updateForms) {
			this.cleanup.on(form, "submit", this.handleProductUpdateSubmit);
		}

		const productImageBrowseButtons =
			this.element.querySelectorAll<HTMLButtonElement>(
				"[data-admin-product-image-browse]",
			);
		for (const button of productImageBrowseButtons) {
			this.cleanup.on(button, "click", this.handleProductImageBrowse);
		}

		const productImageInputs = this.element.querySelectorAll<HTMLInputElement>(
			"[data-admin-product-image-input-card]",
		);
		for (const input of productImageInputs) {
			this.cleanup.on(input, "change", this.handleProductImageSelection);
		}

		const deleteButtons = this.element.querySelectorAll<HTMLButtonElement>(
			"[data-admin-product-delete]",
		);
		for (const button of deleteButtons) {
			this.cleanup.on(button, "click", this.handleProductDeleteClick);
		}
	}

	private buildInventoryMetrics(): DashboardMetric[] {
		const totalProducts = this.products.length;
		const totalStock = this.products.reduce(
			(total, product) => total + Math.max(0, product.quantity),
			0,
		);
		const outOfStock = this.products.filter(
			(product) => product.quantity <= 0,
		).length;
		const lowStock = this.products.filter(
			(product) => product.quantity > 0 && product.quantity <= 5,
		).length;
		const categories = new Set(
			this.products
				.map((product) => product.categoryName?.trim())
				.filter((name) => Boolean(name)),
		).size;

		const avgPrice =
			totalProducts > 0
				? this.products.reduce((total, product) => total + product.price, 0) /
					totalProducts
				: 0;

		return [
			{ label: "Products", value: this.formatNumeric(totalProducts) },
			{ label: "In Stock Units", value: this.formatNumeric(totalStock) },
			{ label: "Out Of Stock", value: this.formatNumeric(outOfStock) },
			{ label: "Low Stock (<= 5)", value: this.formatNumeric(lowStock) },
			{ label: "Categories", value: this.formatNumeric(categories) },
			{ label: "Avg Price", value: currencyFormatter.format(avgPrice) },
		];
	}

	private formatNumeric(value: number): string {
		const isInteger = Number.isInteger(value);
		return new Intl.NumberFormat("en-US", {
			maximumFractionDigits: isInteger ? 0 : 2,
		}).format(value);
	}

	private setFormSubmitting(
		form: HTMLFormElement,
		isSubmitting: boolean,
	): void {
		const submitButton = form.querySelector<HTMLButtonElement>(
			"[data-admin-add-product-submit]",
		);
		if (submitButton) {
			submitButton.disabled = isSubmitting;
			const label =
				submitButton.querySelector<HTMLElement>(".ui-button__label");
			if (label) {
				label.textContent = isSubmitting ? "Adding..." : "Add Product";
			}
		}
	}

	private setFormFeedback(
		form: HTMLFormElement,
		message: string,
		state: FormFeedbackState,
	): void {
		const feedback = form.querySelector<HTMLElement>(
			"[data-admin-form-feedback]",
		);
		if (!feedback) {
			return;
		}

		feedback.textContent = message;
		feedback.dataset.state = state;
	}

	private clearFormFeedback(form: HTMLFormElement): void {
		const feedback = form.querySelector<HTMLElement>(
			"[data-admin-form-feedback]",
		);
		if (!feedback) {
			return;
		}

		feedback.textContent = "";
		feedback.removeAttribute("data-state");
	}

	private setImageFileName(form: HTMLFormElement, name: string | null): void {
		const fileName = form.querySelector<HTMLElement>(
			"[data-admin-image-file-name]",
		);
		if (!fileName) {
			return;
		}

		fileName.textContent = name?.trim() || "No file selected";
	}

	private setProductImageFileName(
		form: HTMLFormElement,
		name: string | null,
	): void {
		const fileName = form.querySelector<HTMLElement>(
			"[data-admin-product-image-file-name]",
		);
		if (!fileName) {
			return;
		}

		fileName.textContent = name?.trim() || "No image selected";
	}

	private readonly handleRefresh = (): void => {
		void this.refreshAll();
	};

	private readonly handleImageSelection = (event: Event): void => {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		const form = input.closest<HTMLFormElement>(
			"[data-admin-add-product-form]",
		);
		if (!form) {
			return;
		}

		const fileName = input.files?.[0]?.name ?? null;
		this.setImageFileName(form, fileName);
	};

	private readonly handleAddProductSubmit = (event: Event): void => {
		event.preventDefault();
		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) {
			return;
		}

		void this.submitAddProductForm(form);
	};

	private readonly handleProductImageBrowse = (event: Event): void => {
		const button = event.currentTarget;
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		const form = button.closest<HTMLFormElement>(
			"[data-admin-product-update-form]",
		);
		if (!form) {
			return;
		}

		const input = form.querySelector<HTMLInputElement>(
			"[data-admin-product-image-input-card]",
		);
		input?.click();
	};

	private readonly handleProductImageSelection = (event: Event): void => {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		const form = input.closest<HTMLFormElement>(
			"[data-admin-product-update-form]",
		);
		if (!form) {
			return;
		}

		const fileName = input.files?.[0]?.name ?? null;
		this.setProductImageFileName(form, fileName);
	};

	private async submitAddProductForm(form: HTMLFormElement): Promise<void> {
		if (this.isSubmittingProduct) {
			return;
		}

		const formData = new FormData(form);
		const name = String(formData.get("name") ?? "").trim();
		const description = String(formData.get("description") ?? "").trim();
		const brand = String(formData.get("brand") ?? "").trim();
		const specsJson = String(formData.get("specsJson") ?? "{}").trim();
		const categoryId = Number(formData.get("categoryId"));
		const price = Number(formData.get("price"));
		const stockQuantity = Number(formData.get("stockQuantity"));
		const rawImage = formData.get("image");

		if (!name || !description || !brand) {
			this.setFormFeedback(
				form,
				"Name, description, and brand are required.",
				"error",
			);
			return;
		}

		if (!isFiniteNumber(price) || price <= 0) {
			this.setFormFeedback(
				form,
				"Price must be a number greater than zero.",
				"error",
			);
			return;
		}

		if (
			!isFiniteNumber(stockQuantity) ||
			stockQuantity < 0 ||
			!Number.isInteger(stockQuantity)
		) {
			this.setFormFeedback(
				form,
				"Stock quantity must be a whole number 0 or higher.",
				"error",
			);
			return;
		}

		if (!isFiniteNumber(categoryId) || categoryId <= 0) {
			this.setFormFeedback(form, "Please choose a product category.", "error");
			return;
		}

		if (!parseJson(specsJson)) {
			this.setFormFeedback(
				form,
				"Specs JSON must be a valid JSON object.",
				"error",
			);
			return;
		}

		this.isSubmittingProduct = true;
		this.setFormSubmitting(form, true);
		this.clearFormFeedback(form);

		try {
			const image =
				rawImage instanceof File && rawImage.size > 0
					? await optimizeImageToWebp(rawImage)
					: undefined;

			await productsApi.addProduct({
				name,
				description,
				price,
				stockQuantity,
				brand,
				specsJson,
				categoryId,
				image,
			});

			this.setFormFeedback(form, "Product added successfully.", "success");
			emitToast({
				level: "success",
				title: "Product added",
				message: `${name} is now available in the catalog.`,
			});
			form.reset();
			this.setImageFileName(form, null);
			await Promise.all([this.loadDashboard(), this.loadProducts()]);
		} catch (error) {
			console.error("Failed to add product:", error);
			const message =
				error instanceof Error
					? error.message
					: "Failed to add product. Please try again.";
			this.setFormFeedback(form, message, "error");
			emitToast({
				level: "error",
				title: "Add product failed",
				message,
			});
		} finally {
			this.isSubmittingProduct = false;
			this.setFormSubmitting(form, false);
		}
	}

	private readonly handleProductUpdateSubmit = (event: Event): void => {
		event.preventDefault();
		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) {
			return;
		}

		void this.submitProductUpdate(form);
	};

	private async submitProductUpdate(form: HTMLFormElement): Promise<void> {
		const productId = Number(form.dataset.productId);
		if (!Number.isFinite(productId) || productId <= 0) {
			return;
		}

		const product = this.products.find(
			(candidate) => candidate.id === productId,
		);
		if (!product) {
			return;
		}

		const formData = new FormData(form);
		const price = Number(formData.get("price"));
		const stockQuantity = Number(formData.get("stockQuantity"));
		const rawImage = formData.get("image");

		if (!isFiniteNumber(price) || price <= 0) {
			emitToast({
				level: "error",
				title: "Invalid price",
				message: "Price must be greater than zero.",
			});
			return;
		}

		if (
			!isFiniteNumber(stockQuantity) ||
			stockQuantity < 0 ||
			!Number.isInteger(stockQuantity)
		) {
			emitToast({
				level: "error",
				title: "Invalid stock",
				message: "Stock quantity must be a whole number 0 or higher.",
			});
			return;
		}

		this.updatingProductId = productId;
		this.rerender();
		this.bindEvents();

		try {
			const image =
				rawImage instanceof File && rawImage.size > 0
					? await optimizeImageToWebp(rawImage)
					: undefined;

			await productsApi.updateProduct(productId, {
				name: product.name || `Product ${product.id}`,
				description: product.description || `Product ${product.id}`,
				price,
				stockQuantity,
				image,
			});

			emitToast({
				level: "success",
				title: "Product updated",
				message: `${product.name} was updated successfully.`,
			});
			await Promise.all([this.loadProducts(), this.loadDashboard()]);
		} catch (error) {
			console.error("Failed to update product:", error);
			emitToast({
				level: "error",
				title: "Update failed",
				message:
					error instanceof Error ? error.message : "Failed to update product.",
			});
		} finally {
			this.updatingProductId = null;
			this.rerender();
			this.bindEvents();
		}
	}

	private readonly handleProductDeleteClick = (event: Event): void => {
		const button = event.currentTarget;
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		const productId = Number(button.dataset.productId);
		if (!Number.isFinite(productId) || productId <= 0) {
			return;
		}

		void this.deleteProduct(productId);
	};

	private async deleteProduct(productId: number): Promise<void> {
		const product = this.products.find(
			(candidate) => candidate.id === productId,
		);
		if (!product) {
			return;
		}

		const confirmed = window.confirm(
			`Delete "${product.name}" from the catalog?`,
		);
		if (!confirmed) {
			return;
		}

		this.deletingProductId = productId;
		this.rerender();
		this.bindEvents();

		try {
			await productsApi.deleteProduct(productId);
			emitToast({
				level: "success",
				title: "Product deleted",
				message: `${product.name} was removed from the catalog.`,
			});
			await Promise.all([this.loadProducts(), this.loadDashboard()]);
		} catch (error) {
			console.error("Failed to delete product:", error);
			emitToast({
				level: "error",
				title: "Delete failed",
				message:
					error instanceof Error ? error.message : "Failed to delete product.",
			});
		} finally {
			this.deletingProductId = null;
			this.rerender();
			this.bindEvents();
		}
	}

	private renderMetricSection(
		title: string,
		description: string,
		metrics: ReadonlyArray<DashboardMetric>,
	): DocumentFragment {
		return this.tpl`
			<section class="dashboard-metrics-panel">
				<div class="dashboard-metrics-panel__header">
					<h2 class="dashboard-metrics-panel__title">${title}</h2>
					<p class="dashboard-metrics-panel__description">${description}</p>
				</div>
				<div class="dashboard-metrics" aria-label="${title}">
					${metrics.map(
						(metric) => this.tpl`
							<article class="dashboard-metric">
								<p class="dashboard-metric__label">${metric.label}</p>
								<p class="dashboard-metric__value">${metric.value}</p>
							</article>
						`,
					)}
				</div>
			</section>
		`;
	}

	private renderProductCard(product: Product): DocumentFragment {
		const isUpdating = this.updatingProductId === product.id;
		const isDeleting = this.deletingProductId === product.id;
		const isBusy = isUpdating || isDeleting;
		const imageUrl =
			product.imageUrl?.trim() || "/assets/shared/placeholder.png";
		const category = product.categoryName?.trim() || "Uncategorized";

		return this.tpl`
			<article class="dashboard-product-item">
				<div class="dashboard-product-item__media">
					<img src="${imageUrl}" alt="${product.name}" loading="lazy" />
				</div>
				<div class="dashboard-product-item__content">
					<div class="dashboard-product-item__head">
						<h3 class="dashboard-product-item__name">${product.name}</h3>
						<p class="dashboard-product-item__meta">
							#${product.id} · ${category}
						</p>
					</div>

					<form
						class="dashboard-product-item__form"
						data-admin-product-update-form
						data-product-id="${product.id}"
					>
						<label>
							<span>Price</span>
							<input
								type="number"
								name="price"
								min="0.01"
								step="0.01"
								value="${product.price.toFixed(2)}"
								${isBusy ? "disabled" : ""}
							/>
						</label>
						<label>
							<span>Stock</span>
							<input
								type="number"
								name="stockQuantity"
								min="0"
								step="1"
								value="${product.quantity}"
								${isBusy ? "disabled" : ""}
							/>
						</label>
						<label class="dashboard-product-item__field--full">
							<span>Image</span>
							<div class="dashboard-product-item__file-picker">
								<input
									class="dashboard-product-item__file-input"
									type="file"
									name="image"
									accept="image/*"
									data-admin-product-image-input-card
									${isBusy ? "disabled" : ""}
								/>
								${new Button({
									as: "button",
									type: "button",
									label: "Browse image",
									variant: "outline",
									className: "dashboard-product-item__browse",
									attrs: { disabled: isBusy },
									dataset: { adminProductImageBrowse: true },
								})}
								<span
									class="dashboard-product-item__file-name"
									data-admin-product-image-file-name
								>
									No image selected
								</span>
							</div>
						</label>
						<div class="dashboard-product-item__actions">
							${new Button({
								as: "button",
								type: "submit",
								label: isUpdating ? "Saving..." : "Save",
								variant: "solid",
								className: "dashboard-product-item__save",
								attrs: { disabled: isBusy },
							})}
							${new Button({
								as: "button",
								type: "button",
								label: isDeleting ? "Deleting..." : "Delete",
								variant: "outline",
								className: "dashboard-product-item__delete",
								attrs: { disabled: isBusy },
								dataset: { adminProductDelete: true, productId: product.id },
							})}
						</div>
					</form>
				</div>
			</article>
		`;
	}

	render(): DocumentFragment {
		const inventoryMetrics = this.buildInventoryMetrics();

		return this.tpl`
			<div class="dashboard-shell">
				<header class="dashboard-header">
					<p class="dashboard-eyebrow">Admin</p>
					<h1 class="dashboard-title">Dashboard</h1>
					<p class="dashboard-description">
						Live operations overview with product inventory controls.
					</p>
					${new Button({
						as: "button",
						type: "button",
						label: "Refresh",
						variant: "outline",
						className: "dashboard-refresh-btn",
						dataset: { dashboardRefresh: true },
					})}
				</header>

				${
					this.isLoading
						? this.tpl`
							<div class="dashboard-status-card">
								<p class="dashboard-status">Loading dashboard...</p>
							</div>
						`
						: ""
				}

				${
					!this.isLoading && this.error
						? this.tpl`
							<div class="dashboard-status-card dashboard-status-card--error">
								<p class="dashboard-status">${this.error}</p>
							</div>
						`
						: ""
				}

				<section class="dashboard-admin-tools" aria-label="Admin product tools">
					<div class="dashboard-admin-tools__header">
						<h2 class="dashboard-admin-tools__title">Add Product</h2>
						<p class="dashboard-admin-tools__description">
							Create products directly from the admin dashboard.
						</p>
					</div>
					<form class="dashboard-product-form" data-admin-add-product-form>
						<label class="dashboard-product-form__field">
							<span>Name</span>
							<input type="text" name="name" maxlength="120" required />
						</label>

						<label class="dashboard-product-form__field dashboard-product-form__field--full">
							<span>Description</span>
							<textarea name="description" rows="3" maxlength="800" required></textarea>
						</label>

						<label class="dashboard-product-form__field">
							<span>Price</span>
							<input type="number" name="price" min="0.01" step="0.01" required />
						</label>

						<label class="dashboard-product-form__field">
							<span>Stock Quantity</span>
							<input type="number" name="stockQuantity" min="0" step="1" required />
						</label>

						<label class="dashboard-product-form__field">
							<span>Brand</span>
							<input type="text" name="brand" maxlength="120" required />
						</label>

						<label class="dashboard-product-form__field">
							<span>Category</span>
							<select name="categoryId" ${this.isLoadingCategories ? "disabled" : ""} required>
								<option value="">
									${
										this.isLoadingCategories
											? "Loading categories..."
											: "Select category"
									}
								</option>
								${this.categories.map(
									(category) => this.tpl`
										<option value="${category.id}">${category.name ?? "Uncategorized"}</option>
									`,
								)}
							</select>
						</label>

						<label class="dashboard-product-form__field dashboard-product-form__field--full">
							<span>Specs JSON</span>
							<textarea
								name="specsJson"
								rows="4"
								placeholder='{"color":"black","material":"carbon"}'
							>{}</textarea>
						</label>

						<label class="dashboard-product-form__field dashboard-product-form__field--full">
							<span>Image (optional)</span>
							<div class="dashboard-product-form__file-picker">
								<input
									class="dashboard-product-form__file-input"
									type="file"
									name="image"
									accept="image/*"
									data-admin-product-image-input
								/>
								${new Button({
									as: "button",
									type: "button",
									label: "Browse",
									variant: "outline",
									className: "dashboard-product-form__browse",
									dataset: { adminImageBrowse: true },
								})}
								<span class="dashboard-product-form__file-name" data-admin-image-file-name>No file selected</span>
							</div>
						</label>

						<div class="dashboard-product-form__actions dashboard-product-form__field--full">
							${new Button({
								as: "button",
								type: "submit",
								label: this.isSubmittingProduct ? "Adding..." : "Add Product",
								variant: "solid",
								className: "dashboard-product-form__submit",
								attrs: {
									disabled: this.isSubmittingProduct,
								},
								dataset: { adminAddProductSubmit: true },
							})}
							<p class="dashboard-product-form__feedback" data-admin-form-feedback aria-live="polite"></p>
						</div>
					</form>
				</section>

				${
					!this.error
						? this.tpl`
							${this.renderMetricSection(
								"Inventory Snapshot",
								"Computed from /api/Product for live stock and pricing.",
								inventoryMetrics,
							)}
						`
						: ""
				}

				<section class="dashboard-products" aria-label="Catalog management">
					<div class="dashboard-products__header">
						<h2 class="dashboard-products__title">Catalog</h2>
						<p class="dashboard-products__description">
							Edit price and stock inline.
						</p>
					</div>

					${
						this.isLoadingProducts
							? this.tpl`
								<div class="dashboard-status-card">
									<p class="dashboard-status">Loading products...</p>
								</div>
							`
							: ""
					}

					${
						!this.isLoadingProducts && this.productsError
							? this.tpl`
								<div class="dashboard-status-card dashboard-status-card--error">
									<p class="dashboard-status">${this.productsError}</p>
								</div>
							`
							: ""
					}

					${
						!this.isLoadingProducts &&
						!this.productsError &&
						this.products.length === 0
							? this.tpl`
								<div class="dashboard-status-card">
									<p class="dashboard-status">No products found.</p>
								</div>
							`
							: ""
					}

					${
						!this.isLoadingProducts &&
						!this.productsError &&
						this.products.length > 0
							? this.tpl`
								<ul class="dashboard-products__list">
									${this.products.map(
										(product) => this.tpl`
											<li class="dashboard-products__list-item">
												${this.renderProductCard(product)}
											</li>
										`,
									)}
								</ul>
							`
							: ""
					}
				</section>
			</div>
		`;
	}
}
