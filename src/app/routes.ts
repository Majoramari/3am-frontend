import type { RouteMap } from "@lib/router";

const createDuskBuildPage = async () => {
	const [{ VehicleBuildPage }, { DUSK_BUILD_CONFIG }] = await Promise.all([
		import("@pages/vehicleBuild"),
		import("@sections/dusk/buildJourneyConfig"),
	]);

	return new VehicleBuildPage(DUSK_BUILD_CONFIG);
};

const createDawnBuildPage = async () => {
	const [{ VehicleBuildPage }, { DAWN_BUILD_CONFIG }] = await Promise.all([
		import("@pages/vehicleBuild"),
		import("@sections/dawn/buildJourneyConfig"),
	]);

	return new VehicleBuildPage(DAWN_BUILD_CONFIG);
};

const createGearsPage = async () => {
	const { GearsPage } = await import("@pages/gears");
	return new GearsPage();
};

export const routes: RouteMap = {
	"/": {
		title: "Home",
		create: async () => {
			const { HomePage } = await import("@pages/home");
			return new HomePage();
		},
	},
	"/dusk": {
		title: "Dusk",
		create: async () => {
			const { DuskPage } = await import("@pages/dusk");
			return new DuskPage();
		},
	},
	"/dawn": {
		title: "Dawn",
		create: async () => {
			const { DawnPage } = await import("@pages/dawn");
			return new DawnPage();
		},
	},
	"/dusk/buy": {
		title: "Dusk Build",
		create: createDuskBuildPage,
	},
	"/dusk/build": {
		title: "Dusk Build",
		create: createDuskBuildPage,
	},
	"/dawn/buy": {
		title: "Dawn Build",
		create: createDawnBuildPage,
	},
	"/dawn/build": {
		title: "Dawn Build",
		create: createDawnBuildPage,
	},
	"/demo": {
		title: "Demo Drive",
		create: async () => {
			const { DemoDrivePage } = await import("@pages/demoDrive");
			return new DemoDrivePage();
		},
	},
	"/signin": {
		title: "Sign in",
		create: async () => {
			const { AuthPage } = await import("@pages/auth");
			return new AuthPage();
		},
	},
	"/register": {
		title: "Register",
		create: async () => {
			const { AuthPage } = await import("@pages/auth");
			const page = new AuthPage();
			// Start at register step if accessed via /register
			// This will be handled by the page itself
			return page;
		},
	},
	"/terms": {
		title: "Terms",
		create: async () => {
			const { TermsPage } = await import("@pages/terms");
			return new TermsPage();
		},
	},
	"/privacy": {
		title: "Privacy",
		create: async () => {
			const { PrivacyPage } = await import("@pages/privacy");
			return new PrivacyPage();
		},
	},
	"/legal": {
		title: "Legal",
		create: async () => {
			const { LegalPage } = await import("@pages/legal");
			return new LegalPage();
		},
	},
	"/contributors": {
		title: "Contributors",
		create: async () => {
			const { ContributorsPage } = await import("@pages/contributors");
			return new ContributorsPage();
		},
	},
	"/gears": {
		title: "Gears",
		create: createGearsPage,
	},
	"/gears/product/:id": {
		title: "Product",
		create: async ({ params }) => {
			const { ProductPage } = await import("@pages/product");
			const rawId = params.id ?? "";
			const parsedId = Number.parseInt(rawId, 10);
			const productId = Number.isFinite(parsedId) ? parsedId : 0;
			return new ProductPage(productId);
		},
	},
	"/checkout": {
		title: "Checkout",
		create: async () => {
			const { CheckoutPage } = await import("@pages/checkout");
			return new CheckoutPage();
		},
	},
	"/admin/dashboard": {
		title: "Admin Dashboard",
		create: async () => {
			const { DashboardPage } = await import("@pages/dashboard");
			return new DashboardPage();
		},
	},
	"/404": {
		title: "Not found",
		create: async () => {
			const { NotFoundPage } = await import("@pages/notFound");
			return new NotFoundPage();
		},
	},
};
