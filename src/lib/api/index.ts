import type {
	AddCartItemDTO,
	AddProductDTO,
	AuthResponseDTO,
	CallbackDTO,
	Category,
	ConfirmPaymentDTO,
	DashboardDTO,
	PaymentResponseDTO,
	ProfileDTO,
	RefreshTokenDTO,
	RegisterDTO,
	RequestOtpDTO,
	UpdateProductDTO,
	VerifyOtpDTO,
} from "./auth.types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
	/\/+$/,
	"",
);
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

// Token storage keys
const ACCESS_TOKEN_KEY = "3am_access_token";
const REFRESH_TOKEN_KEY = "3am_refresh_token";
const REFRESH_TOKEN_EXPIRY_KEY = "3am_refresh_token_expiry";

export type Product = {
	id: number;
	name: string;
	description: string;
	price: number;
	quantity: number;
	imageUrl: string | null;
	brand: string;
	specsJson: string | Record<string, unknown>;
	categoryName: string;
};

type ApiProductRecord = Record<string, unknown>;

export type CartItem = {
	id: number;
	product_Id: number;
	product_Name: string;
	product_Price: number;
	quantity: number;
};

export type Cart = {
	id: number;
	user_Name: string;
	cartItems: CartItem[];
};

export type Order = {
	id: number;
	user_Id: number;
	user_Name: string;
	total_Price: number;
	status: string;
	payment_Status: string;
	cartItems: CartItem[];
};

type FetchOptions = {
	method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	body?: unknown;
	headers?: Record<string, string>;
	requiresAuth?: boolean;
	useRawEndpoint?: boolean;
};

const GENERIC_VALIDATION_TITLE = "one or more validation errors occurred.";

const normalizeIssueText = (value: string): string =>
	value.replace(/\s+/g, " ").replace(/\.$/, "").trim();

const isGenericValidationText = (value: string): boolean =>
	normalizeIssueText(value).toLowerCase() ===
	normalizeIssueText(GENERIC_VALIDATION_TITLE).toLowerCase();

const toMessageList = (value: unknown): string[] => {
	if (typeof value === "string") {
		const text = normalizeIssueText(value);
		return text ? [text] : [];
	}

	if (Array.isArray(value)) {
		return value.flatMap((entry) => toMessageList(entry));
	}

	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		return [
			...toMessageList(record.message),
			...toMessageList(record.Message),
			...toMessageList(record.error),
			...toMessageList(record.Error),
			...toMessageList(record.detail),
			...toMessageList(record.Detail),
		];
	}

	return [];
};

const formatValidationIssues = (payload: Record<string, unknown>): string[] => {
	const issues: string[] = [];

	const pushIssue = (field: string, message: string): void => {
		const normalizedField = field
			.trim()
			.replace(/^request\./i, "")
			.replace(/^\$\./, "");
		const normalizedMessage = normalizeIssueText(message);
		if (!normalizedMessage) {
			return;
		}
		if (normalizedField) {
			issues.push(`${normalizedField}: ${normalizedMessage}`);
			return;
		}
		issues.push(normalizedMessage);
	};

	const validationCollections = [
		payload.ValidationErrors,
		payload.validationErrors,
	];
	for (const validationErrors of validationCollections) {
		if (!Array.isArray(validationErrors)) {
			continue;
		}
		for (const item of validationErrors) {
			if (!item || typeof item !== "object") {
				continue;
			}
			const entry = item as Record<string, unknown>;
			const field =
				typeof entry.Name === "string"
					? entry.Name
					: typeof entry.name === "string"
						? entry.name
						: "";
			const messages = [
				...toMessageList(entry.Error),
				...toMessageList(entry.error),
				...toMessageList(entry.Message),
				...toMessageList(entry.message),
			];
			for (const message of messages) {
				pushIssue(field, message);
			}
		}
	}

	const aspNetErrorCollections = [payload.errors, payload.Errors];
	for (const aspNetErrors of aspNetErrorCollections) {
		if (!aspNetErrors || typeof aspNetErrors !== "object") {
			continue;
		}
		for (const [field, messages] of Object.entries(
			aspNetErrors as Record<string, unknown>,
		)) {
			for (const message of toMessageList(messages)) {
				pushIssue(field, message);
			}
		}
	}

	const deduped = Array.from(new Set(issues.map((issue) => issue.trim())));
	const specificIssues = deduped.filter(
		(issue) => !isGenericValidationText(issue.split(": ").at(-1) ?? issue),
	);

	return specificIssues.length > 0 ? specificIssues : deduped;
};

const asRecord = (value: unknown): ApiProductRecord => {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as ApiProductRecord;
	}
	return {};
};

const asString = (value: unknown, fallback: string = ""): string => {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed || fallback;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return fallback;
};

const asNumber = (value: unknown, fallback: number = 0): number => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return fallback;
};

const asSpecs = (value: unknown): string | Record<string, unknown> => {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed || "{}";
	}
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return "{}";
};

const normalizeProduct = (raw: unknown): Product => {
	const data = asRecord(raw);
	const quantity = Math.max(
		0,
		Math.floor(
			asNumber(
				data.quantity ??
					data.stock_Quantity ??
					data.stockQuantity ??
					data.Stock_Quantity ??
					data.stock,
				0,
			),
		),
	);

	const imageUrl = asString(
		data.imageUrl ??
			data.ImageUrl ??
			data.image_URL ??
			data.Image_URL ??
			data.image,
		"",
	);

	return {
		id: asNumber(data.id ?? data.Id ?? data.product_Id ?? data.productId, 0),
		name: asString(data.name ?? data.Name, "Unnamed Product"),
		description: asString(data.description ?? data.Description, ""),
		price: asNumber(data.price ?? data.Price, 0),
		quantity,
		imageUrl: imageUrl || null,
		brand: asString(data.brand ?? data.Brand, ""),
		specsJson: asSpecs(data.specsJson ?? data.SpecsJson ?? data.specs_JSON),
		categoryName: asString(
			data.categoryName ??
				data.CategoryName ??
				data.category ??
				data.Category ??
				data.category_name,
			"General",
		),
	};
};

const toNonNegativeInteger = (value: unknown, fallback: number = 0): number =>
	Math.max(0, Math.floor(asNumber(value, fallback)));

const normalizeCartItem = (raw: unknown): CartItem => {
	const data = asRecord(raw);
	return {
		id: toNonNegativeInteger(
			data.id ?? data.Id ?? data.cartItemId ?? data.CartItemId,
			0,
		),
		product_Id: toNonNegativeInteger(
			data.product_Id ??
				data.Product_Id ??
				data.productId ??
				data.ProductId ??
				data.productID,
			0,
		),
		product_Name: asString(
			data.product_Name ??
				data.Product_Name ??
				data.productName ??
				data.ProductName ??
				data.name ??
				data.Name,
			"",
		),
		product_Price: asNumber(
			data.product_Price ??
				data.Product_Price ??
				data.productPrice ??
				data.ProductPrice ??
				data.price ??
				data.Price,
			0,
		),
		quantity: toNonNegativeInteger(data.quantity ?? data.Quantity, 0),
	};
};

const normalizeCart = (raw: unknown): Cart => {
	if (Array.isArray(raw)) {
		return {
			id: 0,
			user_Name: "",
			cartItems: raw.map((item) => normalizeCartItem(item)),
		};
	}

	const data = asRecord(raw);
	const itemsSource =
		data.cartItems ??
		data.CartItems ??
		data.cart_items ??
		data.items ??
		data.Items;

	return {
		id: toNonNegativeInteger(
			data.id ?? data.Id ?? data.cartId ?? data.CartId,
			0,
		),
		user_Name: asString(
			data.user_Name ?? data.User_Name ?? data.userName ?? data.UserName,
			"",
		),
		cartItems: Array.isArray(itemsSource)
			? itemsSource.map((item) => normalizeCartItem(item))
			: [],
	};
};

function getAccessToken(): string | null {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function setTokens(auth: AuthResponseDTO): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
	localStorage.setItem(REFRESH_TOKEN_EXPIRY_KEY, auth.refreshTokenExpiry);
}

function clearTokens(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_EXPIRY_KEY);
}

function isTokenExpired(): boolean {
	const expiry = localStorage.getItem(REFRESH_TOKEN_EXPIRY_KEY);
	if (!expiry) {
		return true;
	}
	return new Date(expiry) <= new Date();
}

async function refreshAccessToken(): Promise<AuthResponseDTO> {
	const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
	if (!refreshToken) {
		throw new Error("No refresh token available");
	}

	const response = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ refreshToken } as RefreshTokenDTO),
	});

	if (!response.ok) {
		clearTokens();
		throw new Error(`Token refresh failed: ${response.status}`);
	}

	const auth = (await response.json()) as AuthResponseDTO;
	setTokens(auth);
	return auth;
}

async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {},
): Promise<T> {
	const {
		method = "GET",
		body,
		headers,
		requiresAuth = false,
		useRawEndpoint = false,
	} = options;
	const requestUrl =
		ABSOLUTE_URL_PATTERN.test(endpoint) || useRawEndpoint
			? endpoint
			: `${API_BASE_URL}${endpoint}`;

	const isFormData =
		typeof FormData !== "undefined" && body instanceof FormData;
	const requestHeaders: Record<string, string> = { ...(headers ?? {}) };
	if (!isFormData && !("Content-Type" in requestHeaders)) {
		requestHeaders["Content-Type"] = "application/json";
	}

	const config: RequestInit = {
		method,
		headers: requestHeaders,
	};

	if (requiresAuth) {
		const token = getAccessToken();
		if (!token) {
			throw new Error("Authentication required");
		}
		(config.headers as Record<string, string>).Authorization =
			`Bearer ${token}`;
	}

	if (body && method !== "GET") {
		config.body = isFormData
			? body
			: (JSON.stringify(body) as RequestInit["body"]);
	}

	let response: Response;
	try {
		response = await fetch(requestUrl, config);
	} catch (error) {
		// Network error - could be CORS, offline, or server down
		const errorMessage =
			error instanceof Error ? error.message : "Network error";
		throw new Error(
			`Failed to connect to server: ${errorMessage}. Please check your internet connection.`,
		);
	}

	// Handle 401 Unauthorized - try to refresh token
	if (response.status === 401 && requiresAuth) {
		try {
			await refreshAccessToken();
			const newToken = getAccessToken();
			if (newToken) {
				(config.headers as Record<string, string>).Authorization =
					`Bearer ${newToken}`;
				response = await fetch(requestUrl, config);
			}
		} catch {
			throw new Error("Authentication failed");
		}
	}

	if (!response.ok) {
		// Try to extract the most useful error message from JSON or plain text responses.
		let errorMessage = `API Error: ${response.status} ${response.statusText}`;
		try {
			const rawBody = (await response.text()).trim();
			if (rawBody) {
				try {
					const errorData = JSON.parse(rawBody) as Record<string, unknown>;
					const dataPayload =
						errorData.Data && typeof errorData.Data === "object"
							? (errorData.Data as Record<string, unknown>)
							: errorData.data && typeof errorData.data === "object"
								? (errorData.data as Record<string, unknown>)
								: null;
					const issues = Array.from(
						new Set([
							...formatValidationIssues(errorData),
							...(dataPayload ? formatValidationIssues(dataPayload) : []),
						]),
					);
					const candidateMessages = [
						...toMessageList(errorData.message),
						...toMessageList(errorData.Message),
						...toMessageList(errorData.error),
						...toMessageList(errorData.Error),
						...toMessageList(errorData.detail),
						...toMessageList(errorData.Detail),
						...toMessageList(errorData.title),
						...toMessageList(errorData.Title),
					];
					const candidate =
						candidateMessages.find(
							(message) => !isGenericValidationText(message),
						) ??
						candidateMessages[0] ??
						"";
					if (issues.length > 0) {
						const summary = issues.slice(0, 4).join(" | ");
						const hasSpecificCandidate =
							typeof candidate === "string" &&
							candidate.trim().length > 0 &&
							!isGenericValidationText(candidate);

						errorMessage = hasSpecificCandidate
							? `${candidate}: ${summary}`
							: summary;
					} else if (candidate) {
						errorMessage = isGenericValidationText(candidate)
							? "Validation failed. Check required fields and try again."
							: candidate;
					}
				} catch {
					const firstLine = rawBody.split(/\r?\n/, 1)[0]?.trim();
					if (firstLine) {
						errorMessage = firstLine;
					}
				}
			}
		} catch {
			// Ignore body parse failures and keep fallback message
		}
		throw new Error(errorMessage);
	}

	// Handle 204 No Content
	if (response.status === 204) {
		return {} as T;
	}

	const rawBody = (await response.text()).trim();
	if (!rawBody) {
		return {} as T;
	}

	try {
		return JSON.parse(rawBody) as T;
	} catch {
		// Some endpoints return plain text on success.
		return rawBody as T;
	}
}

export const productsApi = {
	getAll: (): Promise<Product[]> =>
		fetchApi<unknown[]>("/Product").then((payload) => {
			if (!Array.isArray(payload)) {
				return [];
			}
			return payload.map((item) => normalizeProduct(item));
		}),

	getById: (id: number, w?: number, h?: number): Promise<Product> => {
		const params = new URLSearchParams();
		if (w) params.set("w", String(w));
		if (h) params.set("h", String(h));
		const queryString = params.toString();
		return fetchApi<unknown>(
			`/Product/${id}${queryString ? `?${queryString}` : ""}`,
		).then((payload) => normalizeProduct(payload));
	},

	getByCategory: (categoryId: number): Promise<Product[]> =>
		fetchApi<unknown[]>(`/Product/category/${categoryId}`).then((payload) => {
			if (!Array.isArray(payload)) {
				return [];
			}
			return payload.map((item) => normalizeProduct(item));
		}),

	getCategories: (): Promise<Category[]> =>
		fetchApi<Category[]>("/Product/categories"),

	getVehicles: (): Promise<Product[]> =>
		fetchApi<unknown[]>("/Product/vehicles").then((payload) => {
			if (!Array.isArray(payload)) {
				return [];
			}
			return payload.map((item) => normalizeProduct(item));
		}),

	getAccessories: (): Promise<Product[]> =>
		fetchApi<unknown[]>("/Product/accessories").then((payload) => {
			if (!Array.isArray(payload)) {
				return [];
			}
			return payload.map((item) => normalizeProduct(item));
		}),

	addProduct: (dto: AddProductDTO): Promise<Product | undefined> => {
		const form = new FormData();
		form.set("Name", dto.name.trim());
		form.set("Description", dto.description.trim());
		form.set("Price", String(dto.price));
		form.set("Stock_Quantity", String(dto.stockQuantity));
		form.set("Brand", dto.brand.trim());
		form.set("specsJson", dto.specsJson.trim());
		form.set("Category_Id", String(dto.categoryId));
		if (dto.image) {
			form.set("ImageFile", dto.image);
			form.set("Image", dto.image);
		}

		return fetchApi<unknown>("/Product/add-product", {
			method: "POST",
			body: form,
			requiresAuth: true,
		}).then((payload) => {
			if (!payload || typeof payload !== "object") {
				return undefined;
			}
			return normalizeProduct(payload);
		});
	},

	updateProduct: (
		id: number,
		dto: UpdateProductDTO,
	): Promise<Product | undefined> => {
		const form = new FormData();
		form.set("Name", dto.name.trim());
		form.set("Description", dto.description.trim());
		form.set("Price", String(dto.price));
		form.set("Stock_Quantity", String(dto.stockQuantity));
		if (dto.image) {
			form.set("ImageFile", dto.image);
		}

		return fetchApi<unknown>(`/Product/update-product/${id}`, {
			method: "PUT",
			body: form,
			requiresAuth: true,
		}).then((payload) => {
			if (!payload || typeof payload !== "object") {
				return undefined;
			}
			return normalizeProduct(payload);
		});
	},

	deleteProduct: (id: number): Promise<void> =>
		fetchApi<void>(`/Product/delete-product/${id}`, {
			method: "DELETE",
			requiresAuth: true,
		}),
};

export const authApi = {
	register: (dto: RegisterDTO): Promise<void> =>
		fetchApi<void>("/Auth/register", {
			method: "POST",
			body: dto,
		}),

	requestOtp: (dto: RequestOtpDTO): Promise<void> =>
		fetchApi<void>("/Auth/request-otp", {
			method: "POST",
			body: dto,
		}),

	verifyOtp: (dto: VerifyOtpDTO): Promise<AuthResponseDTO> =>
		fetchApi<AuthResponseDTO>("/Auth/verify-otp", {
			method: "POST",
			body: dto,
		}).then((auth) => {
			setTokens(auth);
			return auth;
		}),

	refreshToken: (dto: RefreshTokenDTO): Promise<AuthResponseDTO> =>
		fetchApi<AuthResponseDTO>("/Auth/refresh-token", {
			method: "POST",
			body: dto,
		}).then((auth) => {
			setTokens(auth);
			return auth;
		}),

	logout: (): Promise<void> =>
		fetchApi<void>("/Auth/logout", {
			method: "POST",
			requiresAuth: true,
		}),

	getProfile: (): Promise<ProfileDTO> =>
		fetchApi<ProfileDTO>("/Account", { requiresAuth: true }),

	deleteAccount: (): Promise<void> =>
		fetchApi<void>("/Account/delete", {
			method: "DELETE",
			requiresAuth: true,
		}),

	isAuthenticated: (): boolean => {
		const token = getAccessToken();
		return token !== null && !isTokenExpired();
	},

	getStoredToken: (): string | null => getAccessToken(),

	clearAuth: (): void => clearTokens(),
};

export const cartApi = {
	getCart: (): Promise<Cart> =>
		fetchApi<unknown>("/Cart/mycart", { requiresAuth: true }).then((payload) =>
			normalizeCart(payload),
		),

	addToCart: (productId: number, quantity: number): Promise<void> =>
		fetchApi<void>("/Cart/items", {
			method: "POST",
			body: { product_Id: productId, quantity } as AddCartItemDTO,
			requiresAuth: true,
		}),

	removeFromCart: (cartItemId: number): Promise<void> =>
		fetchApi<void>(`/Cart/items/${cartItemId}`, {
			method: "DELETE",
			requiresAuth: true,
		}),

	clearCart: (): Promise<void> =>
		fetchApi<void>("/items/clear", {
			method: "DELETE",
			requiresAuth: true,
			useRawEndpoint: true,
		}),

	checkout: (): Promise<Order> =>
		fetchApi<Order>("/Cart/checkout", { requiresAuth: true }),
};

export const ordersApi = {
	viewOrders: (): Promise<Order> =>
		fetchApi<Order>("/Order/vieworder", { requiresAuth: true }),
};

export const paymentApi = {
	confirm: (dto: ConfirmPaymentDTO): Promise<PaymentResponseDTO> =>
		fetchApi<PaymentResponseDTO>("/payment/confirm", {
			method: "POST",
			body: dto,
			requiresAuth: true,
		}),

	callback: (dto: CallbackDTO): Promise<void> =>
		fetchApi<void>("/payment/callback", {
			method: "POST",
			body: dto,
		}),
};

export const dashboardApi = {
	getDashboard: (): Promise<DashboardDTO> =>
		fetchApi<DashboardDTO>("/Dashboard", { requiresAuth: true }),
};

export const weatherApi = {
	getForecast: (): Promise<void> =>
		fetchApi<void>("/WeatherForecast", { requiresAuth: true }),
};
