import { APP_TITLE } from "@content/constants";
import { View } from "@lib/view";

const vehicleLinks = [
	{ label: "DUSK", href: "/dusk" },
	{ label: "DAWN", href: "/dawn" },
	{ label: "GEARS", href: "/gears" },
];

const contributors = [
	{ name: "Ali Mustafa", href: "https://github.com/ali7510" },
	{ name: "Amr Mousa", href: "https://github.com/Amr-Mousa-333" },
	{ name: "Aya Mohamed", href: "https://github.com/Ayamohamed2" },
	{ name: "Momen Ayman", href: "https://github.com/momenaymann" },
	{ name: "Muhannad Hassan", href: "https://github.com/Majoramari" },
];

const legalLinks = [
	{ label: "Terms", href: "/terms" },
	{ label: "Privacy", href: "/privacy" },
	{ label: "Legal", href: "/legal" },
];

export class Footer extends View<"footer"> {
	constructor() {
		super("footer", {
			className: "footer",
		});
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="footer__shell">
				<div class="footer__grid">
					<div class="footer__brand-col">
						<nav class="footer__stack" aria-label="Vehicles">
							${vehicleLinks.map((link) => this.renderLink(link.label, link.href, "footer__link--xl"))}
						</nav>
					</div>

					<section class="footer__contributors" aria-label="Contributors">
						<a class="footer__contributors-title" href="/contributors">Contributors</a>
						<div class="footer__contributors-list">
							${contributors.map(
								(contributor) =>
									this.tpl`
										<a
											class="footer__contributors-name"
											href="${contributor.href}"
											target="_blank"
											rel="noreferrer"
										>
											${contributor.name}
										</a>
									`,
							)}
						</div>
					</section>
				</div>

				<div class="footer__bottom">
					<div class="footer__bottom-left">
						<p class="footer__copyright">© ${new Date().getFullYear()} ${APP_TITLE}. All Rights Reserved.</p>
						<nav class="footer__legal" aria-label="Legal links">
							${legalLinks.map((link) => this.renderLink(link.label, link.href, "footer__link--tiny"))}
						</nav>
					</div>
				</div>
			</div>
		`;
	}

	private renderLink(
		label: string,
		href: string,
		className = "",
	): DocumentFragment {
		return this.tpl`
			<a class="footer__link ${className}" href="${href}">
				${label}
			</a>
		`;
	}
}
