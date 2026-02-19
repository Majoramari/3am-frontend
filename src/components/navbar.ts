import { Button, type ButtonVariant } from "@components/button";
import { MediaCard, type MediaCardConfig } from "@components/media-card";
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
};

const PRIMARY_NAV_ITEMS: ReadonlyArray<PrimaryNavItem> = [
	{ menu: "dusk", label: "DUSK", href: "/dusk" },
	{ menu: "dawn", label: "DAWN", href: "/dawn" },
	{ menu: "gears", label: "GEARS", href: "/gears" },
];

const SECONDARY_NAV_ITEMS: ReadonlyArray<SecondaryNavItem> = [
	{
		label: "Demo Drive",
		href: "/demo",
		variant: "cta",
		className: "nav-link-demo-drive",
	},
	{ label: "Sign In", href: "/signin" },
];

/**
 * Gears card data lives in one place so updates are simple:
 * - move text with `textAnchor` + optional offsets
 * - adjust typography with `textSize`, `textColor`, and `textWeight`
 * - turn gradient readability layer on/off with `withOverlay`
 */
const GEARS_CARDS: ReadonlyArray<MediaCardConfig> = [
	{
		label: "Autonomous",
		href: "/gears/autonomous",
		className: "nav-gears-card-autonomous",
			backgroundImage: "/assets/shared/placeholder.png",
		backgroundPosition: "right 20% center",
		textAnchor: "top-center",
		textSize: "3rem",
		textWeight: "bold",
		textColor: "rgb(255 255 255)",
		withOverlay: false,
	},
	{
		label: "Services",
		href: "/gears/services",
		className: "nav-gears-card-services",
			backgroundImage: "/assets/shared/placeholder.png",
		backgroundPosition: "left 20% center",
		textAnchor: "bottom-left",
		textSize: "1.6rem",
		textColor: "rgb(255 255 255)",
		textWeight: "bold",
		withOverlay: false,
	},
	{
		label: "Chargers",
		href: "/gears/chargers",
		className: "nav-gears-card-chargers",
			backgroundImage: "/assets/shared/placeholder.png",
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
 * 2) hover/focus driven mega menus
 * 3) delayed close logic for better pointer usability
 */
class Navbar extends View<"nav"> {
	private static readonly SCROLL_THRESHOLD_PX = 12;
	private static readonly MIN_SCROLL_DELTA_PX = 6;
	private static readonly MENU_CLOSE_DELAY_MS = 100;
	private static readonly MENU_NAMES = new Set<NavMenuName>([
		"dusk",
		"dawn",
		"gears",
	]);
	private static readonly ACTIVE_PAGE_LINK_SELECTOR = [
		".nav-menu-trigger",
		".nav-link",
		".nav-mega-link",
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
	 * Currently open mega menu.
	 * Mirrored into `data-active-menu` so CSS can show matching panel declaratively.
	 */
	private activeMenu: NavMenuName | null = null;

	/**
	 * Last route path used to mark active navbar links.
	 */
	private currentPath = "";

	/**
	 * Pending close timer for delayed mega menu dismissal.
	 */
	private closeMenuTimerId: number | null = null;

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

		// Sync initial scroll state so the first paint matches current position.
		this.lastScrollY = window.scrollY;
		this.updateScrolledState();

		// Global listeners for scroll behavior and mega menu interactions.
		this.cleanup.on(window, "scroll", this.handleScroll, { passive: true });
		this.cleanup.on(this.element, "pointerover", this.handleMenuPointerOver);
		this.cleanup.on(this.element, "focusin", this.handleMenuFocusIn);
		this.cleanup.on(this.element, "click", this.handleMenuClick);
		this.cleanup.on(this.element, "pointerleave", this.handleMenuPointerLeave);
		this.cleanup.on(this.element, "focusout", this.handleMenuFocusOut);

		// Sync active-link state with the initial URL.
		this.setCurrentPath(window.location.pathname);

		// Ensure any pending timer is cleared if this view is destroyed.
		this.cleanup.add(() => this.cancelMenuClose());
	}

	setCurrentPath(path: string): void {
		const normalizedPath = Navbar.toInternalPath(path) ?? "/";
		if (normalizedPath === this.currentPath) {
			return;
		}

		this.currentPath = normalizedPath;
		this.syncActivePageLinks();
	}

	/**
	 * Markup structure:
	 * - `nav-grid`: top row with left menu triggers, centered logo, right utility links.
	 * - `nav-mega-stack`: all mega panels (only one visible at a time via CSS selectors).
	 */
	render(): DocumentFragment {
		return this.tpl`
			<div class="nav-inner">
				<ul class="nav-grid">
					<!-- Left: primary triggers that open mega menus -->
					<li>
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
					<li>
						<a class="nav-logo" href="/" aria-label="3AM home">
							<img class="nav-logo-image" src="/assets/nav/logo.svg" alt="3AM" />
						</a>
					</li>

					<!-- Right: utility actions that do not open mega menus -->
					<li>
						<ul class="nav-links nav-links-end">
							${SECONDARY_NAV_ITEMS.map(
								(item) => this.tpl`
									<li>
										${new Button({
											label: item.label,
											className: ["nav-link", item.className ?? ""]
												.filter(Boolean)
												.join(" "),
											variant: item.variant ?? "text",
											href: item.href,
										})}
									</li>
								`,
							)}
						</ul>
					</li>
				</ul>

					<div class="nav-mega-stack">
						<!-- Dusk mega panel -->
						<section class="nav-mega" data-menu="dusk" aria-label="Dusk menu">
							<div class="nav-mega-links">
								<p class="nav-mega-title">Dusk</p>
								<ul class="nav-mega-list">
								<li><a class="nav-mega-link" href="/dusk/explore">Explore</a></li>
								<li><a class="nav-mega-link" href="/dusk/buy">Buy</a></li>
								<li><a class="nav-mega-link" href="/dusk/demo">Demo Drive</a></li>
							</ul>
						</div>
						<a class="nav-mega-media" href="/dusk">
							<img
								class="nav-mega-image"
								src="/assets/dusk/dusk_transparent.webp"
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
								<li><a class="nav-mega-link" href="/dawn/explore">Explore</a></li>
								<li><a class="nav-mega-link" href="/dawn/buy">Buy</a></li>
								<li><a class="nav-mega-link" href="/dawn/demo">Demo Drive</a></li>
							</ul>
						</div>
						<a class="nav-mega-media" href="/dawn">
							<img
								class="nav-mega-image"
								src="/assets/shared/placeholder.png"
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
										<a class="nav-mega-link" href="/gears/all">All</a>
									</li>
									<li>
										<a class="nav-mega-link" href="/gears/wheels">Wheels</a>
									</li>
									<li><a class="nav-mega-link" href="/gears/chargers">Chargers</a></li>
									<li><a class="nav-mega-link" href="/gears/services">Services</a></li>
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

	/**
	 * Pointer behavior:
	 * - Hovering a trigger opens that trigger's panel.
	 * - Hovering inside mega stack keeps it open.
	 * - Hovering other nav zones (logo/right links) starts delayed close.
	 */
	private readonly handleMenuPointerOver = (event: Event): void => {
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

	/**
	 * Clicking inside the mega panel closes it only for actionable targets
	 * (links/images wrapped in links), not empty panel space.
	 */
	private readonly handleMenuClick = (event: MouseEvent): void => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		if (!target.closest(".nav-mega")) {
			return;
		}

		if (!target.closest("a[href]")) {
			return;
		}

		this.clearActiveMenu();
	};

	/**
	 * Start delayed close when leaving nav with pointer.
	 */
	private readonly handleMenuPointerLeave = (): void => {
		this.scheduleMenuClose();
	};

	/**
	 * For keyboard users:
	 * close the mega menu only after focus has truly left the whole nav.
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
			// focus to <body>. Keep the panel open while the pointer is still over nav.
			if (this.element.matches(":hover")) {
				return;
			}

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
		const deltaY = currentScrollY - this.lastScrollY;
		this.lastScrollY = currentScrollY;

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
			this.element.dataset.activeMenu = menu;
			return;
		}

		delete this.element.dataset.activeMenu;
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
