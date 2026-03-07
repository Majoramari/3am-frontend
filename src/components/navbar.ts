import { Button, type ButtonVariant } from "@components/button";
import { MediaCard, type MediaCardConfig } from "@components/mediaCard";
import { tokenHasRole } from "@lib/jwtClaims";
import { getRouter } from "@lib/router";
import { sanitizeMediaUrl, toSafeCssUrlValue } from "@lib/safeUrl";
import { View } from "@lib/view";

type NavMenuName = "dusk" | "dawn" | "gears";

type PrimaryNavItem = {
	menu: NavMenuName;
	label: string;
	href: string;
};

type SecondaryNavItem = {
	label: string;
	href: string;
	variant?: ButtonVariant;
	className?: string;
	authAction?: "sign-out";
};

type MobileNavItem = {
	label: string;
	href: string;
	variant?: ButtonVariant;
	className?: string;
	authAction?: "sign-out";
};

const PRIMARY_NAV_ITEMS: ReadonlyArray<PrimaryNavItem> = [
	{ menu: "dusk", label: "DUSK", href: "/dusk" },
	{ menu: "dawn", label: "DAWN", href: "/dawn" },
	{ menu: "gears", label: "GEARS", href: "/gears" },
];

const DEMO_DRIVE_ITEM: SecondaryNavItem = {
	label: "Demo Drive",
	href: "/demo",
	variant: "cta",
	className: "nav-link-demo-drive",
};

const DASHBOARD_ITEM: SecondaryNavItem = {
	label: "Dashboard",
	href: "/admin/dashboard",
	variant: "text",
	className: "nav-link-dashboard",
};

const AUTHENTICATED_NAV_ITEMS: ReadonlyArray<SecondaryNavItem> = [
	DEMO_DRIVE_ITEM,
	{
		label: "Sign Out",
		href: "/signin",
		variant: "text",
		className: "nav-link-sign-out",
		authAction: "sign-out",
	},
];

const AUTHENTICATED_ADMIN_NAV_ITEMS: ReadonlyArray<SecondaryNavItem> = [
	DASHBOARD_ITEM,
	{
		label: "Sign Out",
		href: "/signin",
		variant: "text",
		className: "nav-link-sign-out",
		authAction: "sign-out",
	},
];

const GUEST_NAV_ITEMS: ReadonlyArray<SecondaryNavItem> = [
	DEMO_DRIVE_ITEM,
	{ label: "Sign In", href: "/signin", variant: "outline" },
];

const MOBILE_NAV_ITEMS: ReadonlyArray<MobileNavItem> = [
	{ label: "DUSK", href: "/dusk" },
	{ label: "DAWN", href: "/dawn" },
	{ label: "GEARS", href: "/gears" },
	{ label: "DEMO DRIVE", href: "/demo" },
];

const MOBILE_NAV_ITEMS_ADMIN: ReadonlyArray<MobileNavItem> = [
	{ label: "DUSK", href: "/dusk" },
	{ label: "DAWN", href: "/dawn" },
	{ label: "GEARS", href: "/gears" },
];

const MOBILE_DASHBOARD_ITEM: MobileNavItem = {
	label: "DASHBOARD",
	href: "/admin/dashboard",
};

const MOBILE_SIGN_IN_ITEM: MobileNavItem = {
	label: "SIGN IN",
	href: "/signin",
	variant: "outline",
	className: "nav-mobile-link-sign-in",
};

const MOBILE_SIGN_OUT_ITEM: MobileNavItem = {
	label: "SIGN OUT",
	href: "/signin",
	variant: "text",
	className: "nav-mobile-link-sign-out",
	authAction: "sign-out",
};

const NAV_MEGA_PLACEHOLDER_IMAGE = "/assets/shared/placeholder.png";
const NAV_MEGA_MEDIA_SOURCES = {
	dusk: "/assets/cars/dusk/nav/dusk.webp",
	dawn: "/assets/cars/dawn/nav/dawn.webp",
} as const satisfies Record<Exclude<NavMenuName, "gears">, string>;

const hasAdminRole = (token: string | null): boolean => {
	return tokenHasRole(token, "admin");
};

/**
 * Gears card data lives in one place so updates are simple:
 * - move text with `textAnchor` + optional offsets
 * - adjust typography with `textSize`, `textColor`, and `textWeight`
 * - turn gradient readability layer on/off with `withOverlay`
 */
const GEARS_CARDS: ReadonlyArray<MediaCardConfig> = [
	{
		label: "Autonomous",
		href: "/gears",
		className: "nav-gears-card-autonomous",
		backgroundImage: "/assets/shared/item.webp",
		deferBackgroundLoad: true,
		backgroundPosition: "right 20% center",
		textAnchor: "top-center",
		textSize: "3rem",
		textWeight: "bold",
		textColor: "rgb(255 255 255)",
		withOverlay: false,
	},
	{
		label: "Services",
		href: "/gears",
		className: "nav-gears-card-services",
		backgroundImage: "/assets/shared/mats.webp",
		deferBackgroundLoad: true,
		backgroundPosition: "left 20% center",
		textAnchor: "bottom-left",
		textSize: "1.6rem",
		textColor: "rgb(255 255 255)",
		textWeight: "bold",
		withOverlay: false,
	},
	{
		label: "Chargers",
		href: "/gears",
		className: "nav-gears-card-chargers",
		backgroundImage: "/assets/shared/charger.webp",
		deferBackgroundLoad: true,
		backgroundPosition: "center",
		textAnchor: "bottom-left",
		textSize: "1.6rem",
		textColor: "rgb(255 255 255)",
		textWeight: "bold",
		withOverlay: false,
	},
];

/**
 * Global top navigation with:
 * 1) scroll-aware shell style + hide/show behavior
 * 2) hover/focus driven desktop mega menus
 * 3) mobile toggle menu under 1100px
 */
class Navbar extends View<"nav"> {
	private static readonly SCROLL_THRESHOLD_PX = 12;
	private static readonly MIN_SCROLL_DELTA_PX = 6;
	private static readonly MENU_CLOSE_DELAY_MS = 100;
	private static readonly MOBILE_BREAKPOINT_PX = 1100;
	private static readonly MOBILE_MENU_PANEL_ID = "nav-mobile-panel";
	private static readonly MENU_NAMES = new Set<NavMenuName>([
		"dusk",
		"dawn",
		"gears",
	]);
	private static readonly ACTIVE_PAGE_LINK_SELECTOR = [
		".nav-menu-trigger",
		".nav-link",
		".nav-mega-link",
		".nav-mobile-link",
		".nav-mobile-top-sign-in",
	].join(", ");

	private static isNavMenuName(
		value: string | undefined,
	): value is NavMenuName {
		return (
			typeof value === "string" && Navbar.MENU_NAMES.has(value as NavMenuName)
		);
	}

	private static normalizePath(path: string): string {
		if (!path) {
			return "/";
		}

		const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
		if (withLeadingSlash === "/" || withLeadingSlash === "") {
			return "/";
		}
		return withLeadingSlash.endsWith("/")
			? withLeadingSlash.slice(0, -1)
			: withLeadingSlash;
	}

	private static toInternalPath(href: string): string | null {
		if (!href) {
			return null;
		}

		try {
			const url = new URL(href, window.location.origin);
			if (url.origin !== window.location.origin) {
				return null;
			}
			return Navbar.normalizePath(url.pathname);
		} catch {
			const [pathOnly = "/"] = href.split(/[?#]/, 1);
			return Navbar.normalizePath(pathOnly);
		}
	}

	private static isPathActive(currentPath: string, linkPath: string): boolean {
		if (linkPath === "/") {
			return currentPath === "/";
		}
		return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);
	}

	/**
	 * Scroll-derived visual state.
	 * - `isScrolled`: toggles `is-scrolled` class for CSS variables.
	 * - `isHidden`: toggles `is-hidden` class to slide nav out while scrolling down.
	 */
	private isScrolled = false;
	private isHidden = false;

	/**
	 * Last observed Y offset used to compute scroll direction and delta.
	 */
	private lastScrollY = 0;

	/**
	 * Currently open desktop mega menu.
	 */
	private activeMenu: NavMenuName | null = null;

	/**
	 * Mobile menu expanded state.
	 */
	private isMobileMenuOpen = false;

	/**
	 * Last route path used to mark active navbar links.
	 */
	private currentPath = "";

	/**
	 * Authentication state
	 */
	private isAuthenticated = false;
	private isAdmin = false;

	/**
	 * Pending close timer for delayed mega menu dismissal.
	 */
	private closeMenuTimerId: number | null = null;
	private readonly loadedMenuMedia = new Set<NavMenuName>();
	private suppressDesktopHoverUntilPointerLeave = false;

	constructor() {
		super("nav", { className: "nav-shell" });
	}

	/**
	 * `override` means we intentionally replace the base `View.mount` behavior
	 * while still calling `super.mount(parent)` first to keep default mounting.
	 */
	override mount(parent: HTMLElement): void {
		// Render + attach `<nav>` into the parent element.
		super.mount(parent);

		// Subscribe to auth state changes
		this.subscribeToAuthState();

		// Sync initial scroll state so the first paint matches current position.
		this.lastScrollY = window.scrollY;
		this.updateScrolledState();
		this.syncMobileMenuUi();

		// Global listeners for scroll behavior and menu interactions.
		this.cleanup.on(window, "scroll", this.handleScroll, { passive: true });
		this.cleanup.on(window, "resize", this.handleResize, { passive: true });
		this.cleanup.on(this.element, "pointerover", this.handleMenuPointerOver);
		this.cleanup.on(this.element, "focusin", this.handleMenuFocusIn);
		this.cleanup.on(this.element, "pointerleave", this.handleMenuPointerLeave);
		this.cleanup.on(this.element, "focusout", this.handleMenuFocusOut);
		this.bindClickHandlers();

		// Sync active-link state with the initial URL.
		this.setCurrentPath(window.location.pathname);
	}

	private subscribeToAuthState(): void {
		void import("@lib/authStore")
			.then(({ authStore }) => {
				const unsubscribe = authStore.subscribe((state) => {
					const wasAuthenticated = this.isAuthenticated;
					const wasAdmin = this.isAdmin;
					this.isAuthenticated = state.isAuthenticated;
					this.isAdmin = state.isAuthenticated
						? hasAdminRole(state.accessToken)
						: false;

					// Re-render nav items when auth state changes
					if (
						wasAuthenticated !== this.isAuthenticated ||
						wasAdmin !== this.isAdmin
					) {
						this.updateAuthNavItems();
					}
				});

				// Cleanup subscription on destroy
				this.cleanup.add(unsubscribe);
			})
			.catch(() => {
				// Ignore auth-store load errors in isolated test environments.
			});
	}

	private updateAuthNavItems(): void {
		// Update desktop nav items
		const navLinksEnd = this.element.querySelector(".nav-links-end");
		if (navLinksEnd) {
			navLinksEnd.innerHTML = "";
			for (const item of this.getAuthNavItems()) {
				const li = document.createElement("li");
				const button = new Button({
					label: item.label,
					className: ["nav-link", item.className ?? ""]
						.filter(Boolean)
						.join(" "),
					variant: item.variant ?? "text",
					href: item.href,
					dataset:
						item.authAction === "sign-out"
							? { authAction: item.authAction }
							: undefined,
				});
				li.appendChild(button.renderToNode());
				navLinksEnd.appendChild(li);
			}
			// Rebind click handlers
			this.bindClickHandlers();
		}

		// Update mobile nav items
		const mobileAuthItem = this.getMobileAuthItem();
		const mobileNavList = this.element.querySelector(".nav-mobile-list");
		if (mobileNavList) {
			// Keep main items and replace only the auth action row.
			const existingAuthItem = mobileNavList.querySelector(
				".nav-mobile-auth-item",
			);
			if (existingAuthItem) {
				existingAuthItem.remove();
			}

			const li = document.createElement("li");
			li.className = "nav-mobile-auth-item";
			const button = new Button({
				label: mobileAuthItem.label,
				className: ["nav-mobile-link", mobileAuthItem.className ?? ""]
					.filter(Boolean)
					.join(" "),
				variant: mobileAuthItem.variant ?? "outline",
				href: mobileAuthItem.href,
				dataset:
					mobileAuthItem.authAction === "sign-out"
						? { authAction: mobileAuthItem.authAction }
						: undefined,
			});
			li.appendChild(button.renderToNode());
			mobileNavList.appendChild(li);
			this.bindClickHandlers();
		}

		// Update top-right mobile auth button.
		const mobileTopAuthButton = this.element.querySelector(
			".nav-mobile-top-sign-in",
		);
		if (mobileTopAuthButton?.parentElement) {
			const button = new Button({
				label: mobileAuthItem.label,
				className: [
					"nav-mobile-top-sign-in",
					mobileAuthItem.authAction === "sign-out"
						? "nav-mobile-top-sign-out"
						: "",
				]
					.filter(Boolean)
					.join(" "),
				variant: mobileAuthItem.variant ?? "outline",
				href: mobileAuthItem.href,
				dataset:
					mobileAuthItem.authAction === "sign-out"
						? { authAction: mobileAuthItem.authAction }
						: undefined,
			});
			mobileTopAuthButton.replaceWith(button.renderToNode());
			this.bindClickHandlers();
		}
	}

	private getAuthNavItems(): ReadonlyArray<SecondaryNavItem> {
		if (!this.isAuthenticated) {
			return GUEST_NAV_ITEMS;
		}

		return this.isAdmin
			? AUTHENTICATED_ADMIN_NAV_ITEMS
			: AUTHENTICATED_NAV_ITEMS;
	}

	private getMobileNavItems(): ReadonlyArray<MobileNavItem> {
		if (!this.isAuthenticated || !this.isAdmin) {
			return MOBILE_NAV_ITEMS;
		}

		return [...MOBILE_NAV_ITEMS_ADMIN, MOBILE_DASHBOARD_ITEM];
	}

	private getMobileAuthItem(): MobileNavItem {
		return this.isAuthenticated ? MOBILE_SIGN_OUT_ITEM : MOBILE_SIGN_IN_ITEM;
	}

	setCurrentPath(path: string): void {
		const normalizedPath = Navbar.toInternalPath(path) ?? "/";
		if (normalizedPath !== this.currentPath) {
			this.currentPath = normalizedPath;
			this.syncActivePageLinks();
		}

		this.setMobileMenuOpen(false);
	}

	/**
	 * Markup structure:
	 * - `nav-grid`: top row with desktop links and mobile toggle.
	 * - `nav-mobile-panel`: mobile expanded menu content.
	 * - `nav-mega-stack`: desktop mega panels.
	 */
	render(): DocumentFragment {
		const mobileAuthItem = this.getMobileAuthItem();

		return this.tpl`
			<div class="nav-inner">
				<ul class="nav-grid">
					<!-- Left: mobile toggle + desktop primary triggers -->
					<li class="nav-grid-start">
						<button
							class="nav-mobile-toggle"
							type="button"
							aria-label="Open navigation menu"
							aria-expanded="false"
							aria-controls="${Navbar.MOBILE_MENU_PANEL_ID}"
						>
							<span class="nav-mobile-toggle-icon" aria-hidden="true">
								<span class="nav-mobile-toggle-line"></span>
								<span class="nav-mobile-toggle-line"></span>
							</span>
						</button>

						<ul class="nav-links nav-links-primary">
							${PRIMARY_NAV_ITEMS.map(
								(item) => this.tpl`
									<li class="nav-item" data-menu="${item.menu}">
										${new Button({
											label: item.label,
											className: "nav-menu-trigger",
											variant: "text",
											href: item.href,
										})}
									</li>
								`,
							)}
						</ul>
					</li>

					<!-- Center: brand/logo -->
					<li class="nav-grid-center">
						<a class="nav-logo" href="/" aria-label="3AM home">
							<img class="nav-logo-image" src="/assets/nav/logo.svg" alt="3AM" />
						</a>
					</li>

					<!-- Right: desktop utility actions -->
					<li class="nav-grid-end">
						<ul class="nav-links nav-links-end">
							${this.getAuthNavItems().map(
								(item) => this.tpl`
									<li>
										${new Button({
											label: item.label,
											className: ["nav-link", item.className ?? ""]
												.filter(Boolean)
												.join(" "),
											variant: item.variant ?? "text",
											href: item.href,
											dataset:
												item.authAction === "sign-out"
													? { authAction: item.authAction }
													: undefined,
										})}
									</li>
								`,
							)}
						</ul>
							${new Button({
								label: mobileAuthItem.label,
								className: "nav-mobile-top-sign-in",
								variant: mobileAuthItem.variant ?? "outline",
								href: mobileAuthItem.href,
								dataset:
									mobileAuthItem.authAction === "sign-out"
										? { authAction: mobileAuthItem.authAction }
										: undefined,
							})}
						</li>
					</ul>

				<div
					class="nav-mobile-panel"
					id="${Navbar.MOBILE_MENU_PANEL_ID}"
					aria-hidden="true"
				>
					<ul class="nav-mobile-list">
						${this.getMobileNavItems().map(
							(item) => this.tpl`
								<li>
									${new Button({
										label: item.label,
										className: "nav-mobile-link",
										variant: "text",
										href: item.href,
									})}
								</li>
							`,
						)}
						<li class="nav-mobile-auth-item">
							${new Button({
								label: mobileAuthItem.label,
								className: ["nav-mobile-link", mobileAuthItem.className ?? ""]
									.filter(Boolean)
									.join(" "),
								variant: mobileAuthItem.variant ?? "outline",
								href: mobileAuthItem.href,
								dataset:
									mobileAuthItem.authAction === "sign-out"
										? { authAction: mobileAuthItem.authAction }
										: undefined,
							})}
						</li>
					</ul>
				</div>

				<div class="nav-mega-stack">
					<!-- Dusk mega panel -->
					<section class="nav-mega" data-menu="dusk" aria-label="Dusk menu">
						<div class="nav-mega-links">
							<p class="nav-mega-title">Dusk</p>
							<ul class="nav-mega-list">
								<li><a class="nav-mega-link" href="/dusk">Explore</a></li>
								<li><a class="nav-mega-link" href="/dusk/build">Buy</a></li>
								<li><a class="nav-mega-link" href="/demo?vehicle=dusk">Demo Drive</a></li>
							</ul>
						</div>
						<a class="nav-mega-media" href="/dusk">
							<img
								class="nav-mega-image"
								src="${NAV_MEGA_PLACEHOLDER_IMAGE}"
								data-deferred-src="${NAV_MEGA_MEDIA_SOURCES.dusk}"
								alt="Dusk showcase"
								loading="lazy"
							/>
							<div class="nav-mega-overlay" aria-hidden="true">
								<span class="nav-mega-overlay-model">
									<span class="nav-mega-overlay-model-label">MODEL</span>
									<span class="nav-mega-overlay-model-name">DUSK</span>
								</span>
								<span class="nav-mega-overlay-price">
									<span class="nav-mega-overlay-price-label">Starting at</span>
									<span class="nav-mega-overlay-price-value">$82,990</span>
								</span>
							</div>
						</a>
					</section>

					<!-- Dawn mega panel -->
					<section class="nav-mega" data-menu="dawn" aria-label="Dawn menu">
						<div class="nav-mega-links">
							<p class="nav-mega-title">Dawn</p>
							<ul class="nav-mega-list">
								<li><a class="nav-mega-link" href="/dawn">Explore</a></li>
								<li><a class="nav-mega-link" href="/dawn/build">Buy</a></li>
								<li><a class="nav-mega-link" href="/demo?vehicle=dawn">Demo Drive</a></li>
							</ul>
						</div>
						<a class="nav-mega-media" href="/dawn">
							<img
								class="nav-mega-image"
								src="${NAV_MEGA_PLACEHOLDER_IMAGE}"
								data-deferred-src="${NAV_MEGA_MEDIA_SOURCES.dawn}"
								alt="Dawn showcase"
								loading="lazy"
							/>
							<div class="nav-mega-overlay" aria-hidden="true">
								<span class="nav-mega-overlay-model">
									<span class="nav-mega-overlay-model-label">MODEL</span>
									<span class="nav-mega-overlay-model-name">DAWN</span>
								</span>
								<span class="nav-mega-overlay-price">
									<span class="nav-mega-overlay-price-label">Starting at</span>
									<span class="nav-mega-overlay-price-value">$45,000</span>
								</span>
							</div>
						</a>
					</section>

					<!-- Gears mega panel -->
					<section class="nav-mega" data-menu="gears" aria-label="Gears menu">
						<div class="nav-mega-links">
							<p class="nav-mega-title">Gears</p>
								<ul class="nav-mega-list">
									<li>
										<a class="nav-mega-link" href="/gears">All</a>
									</li>
									<li>
										<a class="nav-mega-link" href="/gears">Wheels</a>
									</li>
									<li><a class="nav-mega-link" href="/gears">Chargers</a></li>
									<li><a class="nav-mega-link" href="/gears">Services</a></li>
								</ul>
						</div>

						<!-- Card-based media area for gears -->
						<div class="nav-gears-grid" aria-label="Featured gear cards">
							${GEARS_CARDS.map((card) => new MediaCard(card))}
						</div>
					</section>
				</div>
			</div>
		`;
	}

	/**
	 * One scroll handler updates both visual "scrolled" state and hide/show state.
	 */
	private readonly handleScroll = (): void => {
		this.updateScrolledState();
		this.updateVisibilityState();
	};

	private readonly handleResize = (): void => {
		if (this.isDesktopViewport()) {
			this.setMobileMenuOpen(false);
		}
	};

	/**
	 * Pointer behavior:
	 * - Hovering a trigger opens that trigger's panel.
	 * - Hovering inside mega stack keeps it open.
	 * - Hovering other nav zones (logo/right links) starts delayed close.
	 */
	private readonly handleMenuPointerOver = (event: Event): void => {
		if (!this.isDesktopViewport()) {
			return;
		}

		if (this.suppressDesktopHoverUntilPointerLeave) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const menuTrigger = target.closest<HTMLElement>(".nav-item[data-menu]");
		if (menuTrigger) {
			const menu = menuTrigger.dataset.menu;
			if (!Navbar.isNavMenuName(menu)) {
				return;
			}

			this.cancelMenuClose();
			this.setActiveMenu(menu);
			return;
		}

		const insideMega = target.closest(".nav-mega-stack");
		if (insideMega) {
			this.cancelMenuClose();
			return;
		}

		this.scheduleMenuClose();
	};

	/**
	 * Keyboard accessibility:
	 * focusing any trigger opens the same mega panel as pointer hover.
	 */
	private readonly handleMenuFocusIn = (event: FocusEvent): void => {
		if (!this.isDesktopViewport()) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const menuTrigger = target.closest<HTMLElement>(".nav-item[data-menu]");
		if (!menuTrigger) {
			return;
		}

		const menu = menuTrigger.dataset.menu;
		if (!Navbar.isNavMenuName(menu)) {
			return;
		}

		this.cancelMenuClose();
		this.setActiveMenu(menu);
	};

	private bindClickHandlers(): void {
		const mobileToggle = this.$<HTMLButtonElement>(".nav-mobile-toggle");
		this.cleanup.on(mobileToggle, "click", this.handleMobileToggleClick);

		const navLinks =
			this.element.querySelectorAll<HTMLAnchorElement>("a[href]");
		for (const link of navLinks) {
			this.cleanup.on(link, "click", this.handleNavLinkClick);
		}
	}

	private readonly handleMobileToggleClick = (): void => {
		this.setMobileMenuOpen(!this.isMobileMenuOpen);
	};

	private readonly handleNavLinkClick = (event: MouseEvent): void => {
		const link = event.currentTarget;
		if (!(link instanceof HTMLAnchorElement)) {
			return;
		}

		if (link.dataset.authAction === "sign-out") {
			event.preventDefault();
			event.stopPropagation();
			void this.handleSignOut();
			return;
		}

		if (event.detail > 0) {
			// Prevent persistent :focus-within styling after mouse clicks.
			link.blur();
		}

		// Always collapse expanded nav surfaces after any navbar navigation click.
		this.setMobileMenuOpen(false);
		this.clearActiveMenu();

		// Desktop hover menus should stay closed until pointer exits and re-enters nav.
		if (this.isDesktopViewport()) {
			this.suppressDesktopHoverUntilPointerLeave = true;
		}
	};

	private readonly handleSignOut = async (): Promise<void> => {
		this.setMobileMenuOpen(false);
		this.clearActiveMenu();

		try {
			const { authStore } = await import("@lib/authStore");
			await authStore.logout();
		} catch (error) {
			console.error("Failed to sign out cleanly:", error);
		}

		try {
			getRouter().navigate("/signin");
		} catch {
			window.location.href = "/signin";
		}
	};

	/**
	 * Start delayed close when leaving nav with pointer.
	 */
	private readonly handleMenuPointerLeave = (): void => {
		if (!this.isDesktopViewport()) {
			return;
		}

		this.suppressDesktopHoverUntilPointerLeave = false;
		this.scheduleMenuClose();
	};

	/**
	 * For keyboard users:
	 * close menus only after focus has truly left the whole nav.
	 */
	private readonly handleMenuFocusOut = (event: FocusEvent): void => {
		const relatedTarget = event.relatedTarget;
		if (relatedTarget instanceof Node && this.element.contains(relatedTarget)) {
			return;
		}

		// Wait one microtask so `document.activeElement` points to the new focused node.
		queueMicrotask(() => {
			if (this.element.contains(document.activeElement)) {
				return;
			}

			// Pointer clicks on non-focusable space inside the mega panel can move
			// focus to <body>. Keep desktop panel open while the pointer is still over nav.
			if (this.isDesktopViewport() && this.element.matches(":hover")) {
				return;
			}

			this.setMobileMenuOpen(false);
			this.clearActiveMenu();
		});
	};

	/**
	 * Adds/removes the `is-scrolled` class after crossing the configured threshold.
	 */
	private updateScrolledState(): void {
		const scrolled = window.scrollY > Navbar.SCROLL_THRESHOLD_PX;
		if (scrolled === this.isScrolled) {
			return;
		}

		this.isScrolled = scrolled;
		this.element.classList.toggle("is-scrolled", scrolled);
	}

	/**
	 * Hide while scrolling down, reveal while scrolling up.
	 */
	private updateVisibilityState(): void {
		const currentScrollY = window.scrollY;
		if (this.isBuilderRoute()) {
			this.lastScrollY = currentScrollY;
			this.setHidden(currentScrollY > Navbar.SCROLL_THRESHOLD_PX);
			return;
		}

		const deltaY = currentScrollY - this.lastScrollY;
		this.lastScrollY = currentScrollY;

		if (this.isMobileMenuOpen) {
			this.setHidden(false);
			return;
		}

		// At top of page, navbar is always visible.
		if (currentScrollY <= Navbar.SCROLL_THRESHOLD_PX) {
			this.setHidden(false);
			return;
		}

		// Ignore micro movements to avoid flicker.
		if (Math.abs(deltaY) < Navbar.MIN_SCROLL_DELTA_PX) {
			return;
		}

		// Positive delta means user is moving downward.
		this.setHidden(deltaY > 0);
	}

	/**
	 * Centralized hidden-state mutation keeps DOM class toggling in one place.
	 */
	private setHidden(hidden: boolean): void {
		if (hidden === this.isHidden) {
			return;
		}

		this.isHidden = hidden;
		this.element.classList.toggle("is-hidden", hidden);
	}

	/**
	 * Reflect active menu into both JS state and root dataset.
	 * CSS selectors read `data-active-menu` to show the correct panel.
	 */
	private setActiveMenu(menu: NavMenuName | null): void {
		if (this.activeMenu === menu) {
			return;
		}

		this.activeMenu = menu;
		if (menu) {
			this.ensureMenuMediaLoaded(menu);
			this.element.dataset.activeMenu = menu;
			return;
		}

		delete this.element.dataset.activeMenu;
	}

	private ensureMenuMediaLoaded(menu: NavMenuName): void {
		if (this.loadedMenuMedia.has(menu)) {
			return;
		}

		const megaPanel = this.element.querySelector<HTMLElement>(
			`.nav-mega[data-menu="${menu}"]`,
		);
		if (!megaPanel) {
			this.loadedMenuMedia.add(menu);
			return;
		}

		const deferredImages = megaPanel.querySelectorAll<HTMLImageElement>(
			"img[data-deferred-src]",
		);
		for (const image of deferredImages) {
			const deferredSrc = image.dataset.deferredSrc;
			if (!deferredSrc) {
				continue;
			}

			const safeSrc = sanitizeMediaUrl(deferredSrc);
			if (safeSrc) {
				image.src = safeSrc;
			}
			delete image.dataset.deferredSrc;
		}

		const deferredBackgroundNodes = megaPanel.querySelectorAll<HTMLElement>(
			"[data-deferred-bg-src]",
		);
		for (const node of deferredBackgroundNodes) {
			const deferredBackgroundSrc = node.dataset.deferredBgSrc;
			if (!deferredBackgroundSrc) {
				continue;
			}

			const safeCssUrl = toSafeCssUrlValue(deferredBackgroundSrc);
			if (safeCssUrl) {
				node.style.setProperty("--media-card-bg-image", safeCssUrl);
			}
			delete node.dataset.deferredBgSrc;
		}

		this.loadedMenuMedia.add(menu);
	}

	/**
	 * Close immediately and clear pending close timer.
	 */
	private readonly clearActiveMenu = (): void => {
		this.cancelMenuClose();
		this.setActiveMenu(null);
	};

	/**
	 * Schedules a delayed close so users can move the cursor naturally
	 * without the panel disappearing instantly.
	 */
	private scheduleMenuClose(): void {
		this.cancelMenuClose();
		this.closeMenuTimerId = window.setTimeout(() => {
			this.clearActiveMenu();
		}, Navbar.MENU_CLOSE_DELAY_MS);
	}

	/**
	 * Cancels any in-flight delayed close timeout.
	 */
	private cancelMenuClose(): void {
		if (this.closeMenuTimerId === null) {
			return;
		}

		window.clearTimeout(this.closeMenuTimerId);
		this.closeMenuTimerId = null;
	}

	private setMobileMenuOpen(open: boolean): void {
		if (open && this.isDesktopViewport()) {
			return;
		}

		if (open === this.isMobileMenuOpen) {
			return;
		}

		this.isMobileMenuOpen = open;
		this.element.classList.toggle("is-mobile-open", open);
		if (open) {
			this.setHidden(false);
			this.clearActiveMenu();
		}

		this.syncMobileMenuUi();
	}

	private syncMobileMenuUi(): void {
		const toggle = this.$<HTMLButtonElement>(".nav-mobile-toggle");
		toggle.setAttribute("aria-expanded", String(this.isMobileMenuOpen));
		toggle.setAttribute(
			"aria-label",
			this.isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu",
		);

		const panel = this.$<HTMLElement>(".nav-mobile-panel");
		panel.setAttribute("aria-hidden", String(!this.isMobileMenuOpen));
	}

	private isDesktopViewport(): boolean {
		return window.innerWidth >= Navbar.MOBILE_BREAKPOINT_PX;
	}

	private isBuilderRoute(): boolean {
		return (
			this.currentPath.startsWith("/dusk/build") ||
			this.currentPath.startsWith("/dusk/buy") ||
			this.currentPath.startsWith("/dawn/build") ||
			this.currentPath.startsWith("/dawn/buy")
		);
	}

	private syncActivePageLinks(): void {
		const links = this.element.querySelectorAll<HTMLAnchorElement>(
			Navbar.ACTIVE_PAGE_LINK_SELECTOR,
		);
		for (const link of links) {
			const href = link.getAttribute("href");
			const linkPath = href ? Navbar.toInternalPath(href) : null;
			if (!linkPath) {
				continue;
			}

			const isActivePage = Navbar.isPathActive(this.currentPath, linkPath);
			link.classList.toggle("is-active-page", isActivePage);

			if (isActivePage) {
				link.setAttribute("aria-current", "page");
				continue;
			}
			link.removeAttribute("aria-current");
		}
	}
}

export default Navbar;
