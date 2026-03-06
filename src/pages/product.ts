import { View } from "@lib/view";
import { ProductView } from "@components/productView";

export class ProductPage extends View<"div"> {
	constructor() {
		super("div", { className: "product-page" });
	}

	// قراءة الـ id من الـ URL: /gear/product?id=wall-charger-nacs
	private getProductId(): string {
		const params = new URLSearchParams(window.location.search);
		return params.get("id") ?? "";
	}

	render(): DocumentFragment {
		const productId = this.getProductId();

		// لما تربط بالـ API هتبعت productId في الـ request
		console.log("Product ID:", productId);

		return this.tpl`
			${new ProductView({
				backLabel: "Gear Shop",
				onBack: () => history.back(),
				imageSrc: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&q=80",
				imageAlt: "Rivian Wall Charger - NACS",
				name: "Rivian Wall Charger - NACS",
				price: "$800",
				description: "Start everyday ready to go. Our wall charger is the fastest and most reliable way to charge your Rivian at home.",
				features: [
					"Get up to 25 miles of range per hour",
					"Compatible with Model Year 2026+ Rivian vehicles",
					"WiFi-connected for software updates",
				],
				onAddToCart: () => {
					console.log("Add to cart:", productId);
				},
			})}
		`;
	}
}