// Authentication DTOs based on backend API

export type RegisterDTO = {
	name: string;
	email: string;
	phone: string;
};

export type RequestOtpDTO = {
	email: string;
};

export type VerifyOtpDTO = {
	email: string;
	otpCode: string;
};

export type RefreshTokenDTO = {
	refreshToken: string;
};

export type AuthResponseDTO = {
	accessToken: string;
	refreshToken: string;
	refreshTokenExpiry: string; // datetime
};

export type ProfileDTO = {
	name: string;
	email: string;
	phone: string;
	orders: OrderDTO[];
};

export type OrderDTO = {
	id: number;
	user_Id: number;
	user_Name: string;
	total_Price: number;
	status: string;
	payment_Status: string;
	cartItems: CartItemDTO[];
};

export type CartItemDTO = {
	id: number;
	product_Id: number;
	product_Name: string;
	product_Price: number;
	quantity: number;
};

export type CartDTO = {
	id: number;
	user_Name: string;
	cartItems: CartItemDTO[];
};

export type AddCartItemDTO = {
	product_Id: number;
	quantity: number;
};

export type ConfirmPaymentDTO = {
	method: PaymentMethod;
	frontendUrl: string;
};

export type PaymentMethod = 1 | 2;

export type PaymentResponseDTO = {
	success: boolean;
	paymentUrl: string | null;
	externalPaymentId: string | null;
	requiresRedirect: boolean;
	message: string | null;
};

export type CallbackDTO = {
	invoiceId: string;
};

export type Category = {
	id: number;
	name: string | null;
	parent_Category_Id: number | null;
};

export type AddProductDTO = {
	name: string;
	description: string;
	price: number;
	stockQuantity: number;
	brand: string;
	specsJson: string;
	categoryId: number;
	image?: File | null;
};

export type UpdateProductDTO = {
	name: string;
	description: string;
	price: number;
	stockQuantity: number;
	image?: File | null;
};

export type DashboardDTO =
	| Record<string, unknown>
	| unknown[]
	| string
	| number
	| boolean
	| null;
