import { Button } from "@components/button";
import { LazyPicture } from "@components/lazyPicture";
import { View } from "@lib/view";
import { setupHomeHeroCarousel } from "./heroCarousel";

const slideOneMobile = "/assets/hero/slide-1-520.png";
const slideOneTablet = "/assets/hero/slide-1-1024.png";
const slideOneDesktop = "/assets/hero/slide-1-1440.png";
const slideTwoMobile = "/assets/hero/slide-2-520.png";
const slideTwoTablet = "/assets/hero/slide-2-1024.png";
const slideTwoDesktop = "/assets/hero/slide-2-1440.png";

export class HomeHeroSection extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "hero"] });
	}

	protected override onMount(): void {
		// Behavior needs the rendered DOM tree.
		setupHomeHeroCarousel(this.element, this.cleanup);
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="hero-carousel">
				<div
					class="hero-carousel__viewport"
					role="region"
					aria-roledescription="carousel"
					aria-label="Featured Rivian gallery"
					tabindex="0"
				>
					<div class="hero-carousel__track">
						<div class="hero-slide hero-slide--1" id="slide-1" aria-label="Slide 1 of 2">
							${new LazyPicture({
								pictureClassName: "hero-slide-picture",
								src: {
									phone: slideOneMobile,
									tablet: slideOneTablet,
									pc: slideOneDesktop,
								},
								alt: "Blue Rivian truck parked on rocky terrain by a mountain lake",
								sizes: "100vw",
								className: "hero-slide-image",
							})}
							<div class="hero-content">
								<h2 class="hero-layer hero-layer--title">Chase the Light</h2>
								<p class="hero-layer hero-layer--description">
									Experience the transition. Seamless electric performance meets brutalist elegance in our most refined silhouette yet.
								</p>
								<div class="hero-content__actions">
									${new Button({
										label: "Build Yours",
										variant: "solid",
										href: "/build",
										className: "hero-layer hero-layer--primary",
									})}
									${new Button({
										label: "View Specs",
										variant: "outline",
										href: "/specs",
										className: "hero-layer hero-layer--secondary",
									})}
								</div>
							</div>
						</div>

						<!-- Slide 2: edit image, text, and buttons here -->
						<div class="hero-slide hero-slide--2" id="slide-2" aria-label="Slide 2 of 2">
							${new LazyPicture({
								pictureClassName: "hero-slide-picture",
								src: {
									phone: slideTwoMobile,
									tablet: slideTwoTablet,
									pc: slideTwoDesktop,
								},
								alt: "Rivian truck parked near the waterfront at sunset",
								sizes: "100vw",
								className: "hero-slide-image",
							})}
							<div class="hero-content">
								<h2 class="hero-layer hero-layer--title">Comfort That Moves Quietly</h2>
								<p class="hero-layer hero-layer--description">
									Clean interior lines, premium materials, and instant response made for daily use.
								</p>
								<div class="hero-content__actions">
									${new Button({
										label: "Book a Demo",
										variant: "solid",
										href: "/demo-drive",
										className: "hero-layer hero-layer--primary",
									})}
									${new Button({
										label: "Compare Models",
										variant: "outline",
										href: "/models",
										className: "hero-layer hero-layer--secondary",
									})}
								</div>
							</div>
						</div>

					</div>
				</div>
				<!-- Slider pill indicator -->
				<div
					class="hero-carousel__nav"
					role="tablist"
					aria-label="Hero carousel navigation"
				>
					<button
						type="button"
						class="hero-carousel__dot is-active"
						data-slide-index="0"
						aria-label="Go to slide 1 of 2"
						aria-current="true"
						aria-pressed="true"
					></button>
					<button
						type="button"
						class="hero-carousel__dot"
						data-slide-index="1"
						aria-label="Go to slide 2 of 2"
						aria-pressed="false"
					></button>
				</div>
			</div>
		`;
	}
}
