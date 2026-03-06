import { View } from "@lib/view";
import { FeaturedGrid } from "@components/featuredGrid";
import { CrowdFavorites } from "@components/crowdFavorites";
import { GearShopHeroSection } from "@sections/gear-shop/hero";
import { NewToShopSection } from "@sections/gear-shop/newToShop";
import { ServiceCentersSection } from "@sections/gear-shop/serviceCenters";
import { DesignedWithFriendsSection } from "@sections/gear-shop/designedWithFriends";

function navigateToProduct(id: string): void {
	window.location.href = `/gear/product?id=${id}`;
}

export class GearShopPage extends View<"div"> {
	constructor() {
		super("div", { className: "gear-shop-page" });
	}

	render(): DocumentFragment {
		return this.tpl`
			${new GearShopHeroSection()}

			${new FeaturedGrid({
				onNavigate: navigateToProduct,
				categories: [
					{
						label: "Featured",
						topRow: [
							{ id: "cargo-crossbars",  name: "Cargo Crossbars", price: "$700 - $800", imageSrc: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db" },
							{ id: "wall-charger",      name: "Wall Charger",    price: "$800",        imageSrc: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc" },
						],
						bottomRow: [
							{ id: "key-fob",        name: "Key Fob",       price: "$75",  imageSrc: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc" },
							{ id: "adventure-kit",  name: "Adventure Kit", price: "$120", imageSrc: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b" },
							{ id: "phone-mount",    name: "Phone Mount",   price: "$65",  imageSrc: "https://images.unsplash.com/photo-1519681393784-d120267933ba" },
						],
					},
					{
						label: "Charging",
						topRow: [
							{ id: "wall-charger-nacs",   name: "Wall Charger - NACS", price: "$800", imageSrc: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc" },
							{ id: "portable-charger",    name: "Portable Charger",    price: "$350", imageSrc: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7" },
						],
						bottomRow: [
							{ id: "charging-cable",   name: "Charging Cable",   price: "$45",  imageSrc: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64" },
							{ id: "charging-adapter", name: "Charging Adapter", price: "$60",  imageSrc: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5" },
							{ id: "power-bank",       name: "Power Bank",       price: "$125", imageSrc: "https://images.unsplash.com/photo-1491553895911-0055eca6402d" },
						],
					},
					{
						label: "Adventure",
						topRow: [
							{ id: "adventure-kit",   name: "Adventure Kit",  price: "$120",        imageSrc: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64" },
							{ id: "cargo-crossbars", name: "Cargo Crossbars",price: "$700 - $800", imageSrc: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db" },
						],
						bottomRow: [
							{ id: "ski-mount",        name: "Ski Mount",        price: "$400", imageSrc: "https://images.unsplash.com/photo-1519681393784-d120267933ba" },
							{ id: "all-weather-mats", name: "All-Weather Mats", price: "$250", imageSrc: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
							{ id: "camp-gear-set",    name: "Camp Gear Set",    price: "$95",  imageSrc: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b" },
						],
					},
					{
						label: "Apparel",
						topRow: [
							{ id: "key-fob",       name: "Key Fob",       price: "$75",  imageSrc: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc" },
							{ id: "rivian-jacket", name: "Rivian Jacket", price: "$150", imageSrc: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b" },
						],
						bottomRow: [
							{ id: "logo-tshirt", name: "Logo T-Shirt", price: "$40", imageSrc: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab" },
							{ id: "cap",         name: "Cap",          price: "$35", imageSrc: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3" },
							{ id: "hoodie",      name: "Hoodie",       price: "$90", imageSrc: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f" },
						],
					},
					{
						label: "Accessories",
						topRow: [
							{ id: "phone-mount",  name: "Phone Mount",  price: "$65",  imageSrc: "https://images.unsplash.com/photo-1519681393784-d120267933ba" },
							{ id: "interior-kit", name: "Interior Kit", price: "$180", imageSrc: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad" },
						],
						bottomRow: [
							{ id: "power-bank", name: "Power Bank", price: "$125", imageSrc: "https://images.unsplash.com/photo-1491553895911-0055eca6402d" },
							{ id: "floor-mats", name: "Floor Mats", price: "$250", imageSrc: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
							{ id: "roof-rack",  name: "Roof Rack",  price: "$700", imageSrc: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64" },
						],
					},
				],
			})}

			${new NewToShopSection()}
			${new ServiceCentersSection()}
			${new DesignedWithFriendsSection()}

			${new CrowdFavorites({
				onNavigate: navigateToProduct,
				items: [
					{ id: "wall-charger-nacs",  name: "Rivian Wall Charger - NACS", price: "$800",        imageSrc: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc" },
					{ id: "all-weather-mats",   name: "R1T All-Weather Floor Mats", price: "$130 - $200", imageSrc: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
					{ id: "cargo-crossbars",    name: "Cargo Crossbars",            price: "$700 - $800", imageSrc: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db" },
				],
			})}
		`;
	}
}