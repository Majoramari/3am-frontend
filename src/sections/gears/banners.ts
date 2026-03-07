import { View } from "@lib/view";

export class GearsBannersSection extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "gears-banners"] });
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="gears-banners__newsletter">
				<div class="gears-banners__newsletter-content">
					<h3 class="gears-banners__newsletter-title">Stay in the Loop</h3>
					<p class="gears-banners__newsletter-description">
						Subscribe for exclusive deals, new arrivals, and expert tips.
					</p>
					<form class="gears-banners__newsletter-form" action="/gears/newsletter/subscribe" method="POST">
						<div class="gears-banners__newsletter-inputs">
							<input
								type="email"
								name="email"
								class="gears-banners__newsletter-email"
								placeholder="Enter your email"
								required
								aria-label="Email address"
							/>
							<button type="submit" class="gears-banners__newsletter-submit">
								Subscribe
							</button>
						</div>
						<p class="gears-banners__newsletter-disclaimer">
							By subscribing, you agree to our Terms & Privacy Policy.
						</p>
					</form>
				</div>
			</div>
		`;
	}

	protected override onMount(): void {
		this.bindFormEvents();
	}

	private bindFormEvents(): void {
		const form = this.element.querySelector<HTMLFormElement>(
			".gears-banners__newsletter-form",
		);
		if (!form) return;

		this.cleanup.on(form, "submit", this.handleNewsletterSubmit);
	}

	private readonly handleNewsletterSubmit = (event: SubmitEvent): void => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const emailInput = form.querySelector<HTMLInputElement>(
			".gears-banners__newsletter-email",
		);
		const email = emailInput?.value;

		if (!email) return;

		const submitEvent = new CustomEvent("gears:newsletter-subscribe", {
			bubbles: true,
			detail: { email },
		});
		this.element.dispatchEvent(submitEvent);

		form.classList.add("is-submitted");
		emailInput.value = "";

		setTimeout(() => {
			form.classList.remove("is-submitted");
		}, 3000);
	};
}
