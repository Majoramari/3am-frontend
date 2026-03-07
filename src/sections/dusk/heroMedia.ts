import { View } from "@lib/view";

export type VehicleHeroShowcaseItem = {
	kind: "image" | "video";
	src: string;
	alt?: string;
	poster?: string;
	label: string;
};

export type VehicleHeroMediaOptions = {
	showcaseItems?: ReadonlyArray<VehicleHeroShowcaseItem>;
	showHeroMedia?: boolean;
};

const DEFAULT_HERO_SHOWCASE_ITEMS: ReadonlyArray<VehicleHeroShowcaseItem> = [
	{
		kind: "image",
		src: "/assets/cars/dusk/showcase/0001.webp",
		alt: "Dusk front three-quarter view",
		label: "Front Profile",
	},
];

const SHOWCASE_AUTO_ADVANCE_MS = 4200;
const SHOWCASE_SWIPE_THRESHOLD_RATIO = 0.1;
const SHOWCASE_MANUAL_DURATION_MS = 620;
const SHOWCASE_AUTOPLAY_DURATION_MS = 760;
const SHOWCASE_SLIDE_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const INTERACTIVE_TARGET_SELECTOR =
	"a, button, input, select, textarea, [role='button']";

export class VehicleHeroMediaSection extends View<"section"> {
	private readonly showcaseItems: ReadonlyArray<VehicleHeroShowcaseItem>;
	private readonly showHeroMedia: boolean;

	constructor(options: VehicleHeroMediaOptions = {}) {
		const className = ["page-section", "dusk-hero"];
		if (options.showHeroMedia === false) {
			className.push("dusk-hero--showcase-only");
		}
		super("section", {
			className,
			dataset: { gaSection: "dusk-hero-media" },
		});
		this.showcaseItems = options.showcaseItems ?? DEFAULT_HERO_SHOWCASE_ITEMS;
		this.showHeroMedia = options.showHeroMedia ?? true;
	}

	protected override onMount(): void {
		this.setupShowcaseSlider();

		const media = this.element.querySelector<HTMLElement>(
			"[data-dusk-hero-media]",
		);
		const video = this.element.querySelector<HTMLVideoElement>(
			"[data-dusk-hero-video]",
		);

		if (!media || !video) {
			return;
		}

		const shouldReduceMotion =
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (shouldReduceMotion) {
			media.classList.add("is-finished");
			video.pause();
			return;
		}

		let hasFinished = false;
		let isInViewport = false;

		const resolveViewportVisibility = (): boolean => {
			const viewportHeight = Math.max(window.innerHeight, 1);
			const rect = media.getBoundingClientRect();
			const visibleBlockSize =
				Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
			const minVisibleBlockSize = Math.min(rect.height, viewportHeight) * 0.2;
			return visibleBlockSize >= minVisibleBlockSize;
		};

		const syncPlaybackState = (): void => {
			if (hasFinished) {
				return;
			}

			const shouldPlay = isInViewport && !document.hidden;
			if (!shouldPlay) {
				video.pause();
				return;
			}

			const playPromise = video.play();
			if (playPromise instanceof Promise) {
				void playPromise.catch(() => {
					// If autoplay is blocked, keep the first frame visible.
				});
			}
		};

		const revealStillImage = (): void => {
			hasFinished = true;
			media.classList.add("is-finished");
			video.pause();
		};

		this.cleanup.on(video, "ended", revealStillImage);
		this.cleanup.on(video, "error", revealStillImage);
		document.addEventListener("visibilitychange", syncPlaybackState);
		this.cleanup.add(() => {
			document.removeEventListener("visibilitychange", syncPlaybackState);
		});

		isInViewport = resolveViewportVisibility();
		syncPlaybackState();

		if (typeof IntersectionObserver === "function") {
			const observer = new IntersectionObserver(
				(entries) => {
					const entry = entries[0];
					isInViewport = Boolean(
						entry?.isIntersecting && entry.intersectionRatio >= 0.2,
					);
					syncPlaybackState();
				},
				{ threshold: [0, 0.2, 0.5] },
			);

			observer.observe(media);
			this.cleanup.add(() => observer.disconnect());
			return;
		}

		const handleViewportFallback = (): void => {
			isInViewport = resolveViewportVisibility();
			syncPlaybackState();
		};

		this.cleanup.on(window, "scroll", handleViewportFallback, {
			passive: true,
		});
		this.cleanup.on(window, "resize", handleViewportFallback, {
			passive: true,
		});
	}

	private setupShowcaseSlider(): void {
		const slider = this.element.querySelector<HTMLElement>(
			"[data-dusk-showcase-slider]",
		);
		if (!slider) {
			return;
		}
		const viewport = slider.querySelector<HTMLElement>(
			"[data-dusk-showcase-viewport]",
		);
		const track = slider.querySelector<HTMLElement>(
			"[data-dusk-showcase-track]",
		);
		const controls = slider.querySelector<HTMLElement>(
			".dusk-hero-slider__controls",
		);
		const toggleButton = slider.querySelector<HTMLButtonElement>(
			"[data-dusk-showcase-toggle]",
		);
		if (!viewport || !track || !toggleButton) {
			return;
		}

		const slides = Array.from(
			slider.querySelectorAll<HTMLElement>("[data-dusk-showcase-slide]"),
		);
		const dots = Array.from(
			slider.querySelectorAll<HTMLButtonElement>("[data-dusk-showcase-dot]"),
		);
		const slideCount = slides.length;
		if (slideCount === 0 || dots.length !== slideCount) {
			return;
		}
		if (slideCount === 1) {
			controls?.setAttribute("hidden", "true");
			const singleVideo = slides[0]?.querySelector<HTMLVideoElement>("video");
			if (!singleVideo) {
				return;
			}
			singleVideo.loop = true;

			const syncSingleVideoPlayback = (): void => {
				if (document.hidden) {
					singleVideo.pause();
					return;
				}
				const playPromise = singleVideo.play();
				if (playPromise instanceof Promise) {
					void playPromise.catch(() => {
						// Keep poster visible when autoplay is blocked by the browser.
					});
				}
			};

			syncSingleVideoPlayback();
			document.addEventListener("visibilitychange", syncSingleVideoPlayback);
			this.cleanup.add(() => {
				document.removeEventListener(
					"visibilitychange",
					syncSingleVideoPlayback,
				);
				singleVideo.pause();
			});
			return;
		}
		controls?.removeAttribute("hidden");

		const displaySlides = slides;

		const slideVideos = slides.map((slide) =>
			slide.querySelector<HTMLVideoElement>("video"),
		);

		let activeIndex = Math.max(
			0,
			slides.findIndex((slide) => slide.classList.contains("is-active")),
		);
		let progressRafId = 0;
		let progressElapsedMs = 0;
		let progressStartedAtMs = 0;
		let isUserPaused = false;
		let isHiddenPaused = document.hidden;
		let isDragging = false;
		let slideWidth = 0;
		let slideStride = 0;
		let visualIndex = activeIndex;
		let dragPointerId: number | null = null;
		let dragStartX = 0;
		let dragStartTranslateX = 0;

		const stopProgressAnimation = (): void => {
			if (progressRafId === 0) {
				return;
			}
			window.cancelAnimationFrame(progressRafId);
			progressRafId = 0;
		};

		const isAutoAdvanceBlocked = (): boolean => isUserPaused || isHiddenPaused;

		const setDotProgress = (value: number): void => {
			const normalizedProgress = Math.min(1, Math.max(0, value));
			dots.forEach((dot, index) => {
				dot.style.setProperty(
					"--dusk-dot-progress",
					index === activeIndex ? String(normalizedProgress) : "0",
				);
			});
		};

		const setTrackPosition = (
			animate: boolean,
			durationMs: number = SHOWCASE_MANUAL_DURATION_MS,
			targetVisualIndex: number = visualIndex,
		): void => {
			if (slideStride <= 0 || slideWidth <= 0) {
				return;
			}

			const activeSlide = displaySlides[targetVisualIndex];
			if (!activeSlide) {
				return;
			}

			const slideCenterX = activeSlide.offsetLeft + activeSlide.offsetWidth / 2;
			const viewportCenterX = viewport.clientWidth / 2;
			const translateX = viewportCenterX - slideCenterX;

			track.style.transition = animate
				? `transform ${durationMs}ms ${SHOWCASE_SLIDE_EASING}`
				: "none";
			track.style.transform = `translate3d(${translateX}px, 0, 0)`;
		};

		const syncLayout = (): void => {
			const firstRealSlide = slides[0];
			if (!firstRealSlide) {
				return;
			}

			const firstSlideWidth = firstRealSlide.offsetWidth;
			if (firstSlideWidth <= 0) {
				return;
			}
			slideWidth = firstSlideWidth;

			const secondSlide = slides[1];
			if (secondSlide) {
				const firstCenterX =
					firstRealSlide.offsetLeft + firstRealSlide.offsetWidth / 2;
				const secondCenterX =
					secondSlide.offsetLeft + secondSlide.offsetWidth / 2;
				const offsetStride = secondCenterX - firstCenterX;
				slideStride = offsetStride > 0 ? offsetStride : slideWidth;
			} else {
				slideStride = slideWidth;
			}

			setTrackPosition(false);
		};

		const syncActiveVideoPlayback = (): void => {
			slideVideos.forEach((video, index) => {
				if (!video) {
					return;
				}

				if (index !== activeIndex) {
					video.pause();
					video.currentTime = 0;
					return;
				}

				if (isAutoAdvanceBlocked()) {
					video.pause();
					return;
				}

				const playPromise = video.play();
				if (playPromise instanceof Promise) {
					void playPromise.catch(() => {
						// Keep poster visible when autoplay is blocked by the browser.
					});
				}
			});
		};

		const syncToggleButton = (): void => {
			toggleButton.setAttribute(
				"aria-pressed",
				isUserPaused ? "true" : "false",
			);
			toggleButton.setAttribute(
				"aria-label",
				isUserPaused ? "Resume showcase" : "Pause showcase",
			);
		};

		const pauseProgressClock = (): void => {
			if (progressRafId === 0) {
				return;
			}
			progressElapsedMs = Math.min(
				SHOWCASE_AUTO_ADVANCE_MS,
				progressElapsedMs + (performance.now() - progressStartedAtMs),
			);
			stopProgressAnimation();
			setDotProgress(progressElapsedMs / SHOWCASE_AUTO_ADVANCE_MS);
		};

		const runProgressClock = (): void => {
			if (isAutoAdvanceBlocked()) {
				syncActiveVideoPlayback();
				return;
			}

			stopProgressAnimation();
			progressStartedAtMs = performance.now();

			const tick = (now: number): void => {
				if (isAutoAdvanceBlocked()) {
					return;
				}

				const elapsedMs = progressElapsedMs + (now - progressStartedAtMs);
				const progress = elapsedMs / SHOWCASE_AUTO_ADVANCE_MS;
				setDotProgress(progress);

				if (progress >= 1) {
					progressElapsedMs = 0;
					setActiveSlide(activeIndex + 1, {
						durationMs: SHOWCASE_AUTOPLAY_DURATION_MS,
					});
					return;
				}

				progressRafId = window.requestAnimationFrame(tick);
			};

			progressRafId = window.requestAnimationFrame(tick);
		};

		const pauseByUser = (): void => {
			if (isUserPaused) {
				return;
			}
			isUserPaused = true;
			pauseProgressClock();
			syncToggleButton();
			syncActiveVideoPlayback();
		};

		const resumeByUser = (): void => {
			if (!isUserPaused) {
				return;
			}
			isUserPaused = false;
			syncToggleButton();
			syncActiveVideoPlayback();
			runProgressClock();
		};

		const setActiveSlide = (
			nextIndex: number,
			options: {
				resetProgress?: boolean;
				durationMs?: number;
				animate?: boolean;
			} = {},
		): void => {
			const {
				resetProgress = true,
				durationMs = SHOWCASE_MANUAL_DURATION_MS,
				animate = true,
			} = options;

			// Clamp index to valid range (no wrapping)
			const clampedIndex = Math.max(0, Math.min(slideCount - 1, nextIndex));

			if (clampedIndex === activeIndex) {
				return;
			}

			activeIndex = clampedIndex;
			visualIndex = clampedIndex;
			const shouldAnimate = animate;

			slides.forEach((slide, index) => {
				const isActive = index === activeIndex;
				slide.classList.toggle("is-active", isActive);
				slide.setAttribute("aria-hidden", isActive ? "false" : "true");
			});

			dots.forEach((dot, index) => {
				const isActive = index === activeIndex;
				dot.classList.toggle("is-active", isActive);
				dot.setAttribute("aria-pressed", isActive ? "true" : "false");
			});

			setTrackPosition(shouldAnimate, durationMs);
			syncActiveVideoPlayback();
			if (resetProgress) {
				progressElapsedMs = 0;
				setDotProgress(0);
			}
			runProgressClock();
		};

		dots.forEach((dot, index) => {
			this.cleanup.on(dot, "click", () => {
				setActiveSlide(index);
			});
		});
		this.cleanup.on(toggleButton, "click", () => {
			if (isUserPaused) {
				resumeByUser();
				return;
			}
			pauseByUser();
		});

		const beginDrag = (event: PointerEvent): void => {
			if (event.pointerType === "mouse" && event.button !== 0) {
				return;
			}
			if (
				event.target instanceof Element &&
				event.target.closest(INTERACTIVE_TARGET_SELECTOR)
			) {
				return;
			}
			if (slideStride <= 0 || slideWidth <= 0) {
				return;
			}

			const activeSlide = displaySlides[visualIndex];
			if (!activeSlide) {
				return;
			}
			const activeCenterX =
				activeSlide.offsetLeft + activeSlide.offsetWidth / 2;

			event.preventDefault();

			isDragging = true;
			dragPointerId = event.pointerId;
			dragStartX = event.clientX;
			dragStartTranslateX = viewport.clientWidth / 2 - activeCenterX;
			viewport.classList.add("is-dragging");
			viewport.setPointerCapture(event.pointerId);
			pauseProgressClock();
		};

		const updateDrag = (event: PointerEvent): void => {
			if (dragPointerId !== event.pointerId) {
				return;
			}
			const firstTrackSlide = displaySlides[0];
			const lastTrackSlide = displaySlides[displaySlides.length - 1];
			if (!firstTrackSlide || !lastTrackSlide) {
				return;
			}
			const firstCenterX =
				firstTrackSlide.offsetLeft + firstTrackSlide.offsetWidth / 2;
			const lastCenterX =
				lastTrackSlide.offsetLeft + lastTrackSlide.offsetWidth / 2;
			const firstTranslate = viewport.clientWidth / 2 - firstCenterX;
			const lastTranslate = viewport.clientWidth / 2 - lastCenterX;
			const minTranslate = Math.min(firstTranslate, lastTranslate);
			const maxTranslate = Math.max(firstTranslate, lastTranslate);
			let nextTranslate = dragStartTranslateX + (event.clientX - dragStartX);

			if (nextTranslate < minTranslate) {
				nextTranslate = minTranslate;
			} else if (nextTranslate > maxTranslate) {
				nextTranslate = maxTranslate;
			}

			track.style.transition = "none";
			track.style.transform = `translate3d(${Math.round(nextTranslate)}px, 0, 0)`;
		};

		const endDrag = (pointerId: number, endX: number): void => {
			if (!isDragging || dragPointerId !== pointerId) {
				return;
			}
			if (viewport.hasPointerCapture(pointerId)) {
				viewport.releasePointerCapture(pointerId);
			}
			isDragging = false;
			dragPointerId = null;
			viewport.classList.remove("is-dragging");

			const dragDistance = endX - dragStartX;
			const threshold = slideStride * SHOWCASE_SWIPE_THRESHOLD_RATIO;

			if (dragDistance <= -threshold) {
				setActiveSlide(activeIndex + 1);
				return;
			}
			if (dragDistance >= threshold) {
				setActiveSlide(activeIndex - 1);
				return;
			}

			setTrackPosition(true, SHOWCASE_MANUAL_DURATION_MS);
			runProgressClock();
		};

		this.cleanup.on(viewport, "pointerdown", (event) => beginDrag(event));
		this.cleanup.on(viewport, "pointermove", (event) => updateDrag(event));
		this.cleanup.on(viewport, "pointerup", (event) => {
			if (dragPointerId !== event.pointerId) {
				return;
			}
			endDrag(event.pointerId, event.clientX);
		});
		this.cleanup.on(viewport, "pointercancel", (event) => {
			if (dragPointerId !== event.pointerId) {
				return;
			}
			endDrag(event.pointerId, event.clientX);
		});

		const handleVisibilityChange = (): void => {
			if (document.hidden) {
				isHiddenPaused = true;
				pauseProgressClock();
				syncActiveVideoPlayback();
				return;
			}
			isHiddenPaused = false;
			syncActiveVideoPlayback();
			runProgressClock();
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		this.cleanup.add(() => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		});
		this.cleanup.on(window, "resize", syncLayout);

		syncLayout();
		syncToggleButton();
		setActiveSlide(activeIndex, { animate: false });
		this.cleanup.add(() => {
			stopProgressAnimation();
			viewport.classList.remove("is-dragging");
			slideVideos.forEach((video) => {
				video?.pause();
			});
		});
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="dusk-hero__shell">
				${
					this.showHeroMedia
						? this.tpl`
							<div class="dusk-hero__media" data-dusk-hero-media>
								<video
									class="dusk-hero__video"
									data-dusk-hero-video
									muted
									playsinline
									preload="auto"
									poster="/assets/dusk/hero_endframe.webp"
									aria-label="Dusk hero video"
								>
									<source src="/assets/dusk/hero_video.webm" type="video/webm" />
								</video>
								<img
									class="dusk-hero__image"
									src="/assets/dusk/hero_endframe.webp"
									alt="Dusk exterior still frame"
								/>
							</div>
						`
						: ""
				}
				<section class="dusk-hero__showcase" aria-label="Dusk showcase">
					<header class="dusk-hero__showcase-head">
						<h2 class="dusk-hero__showcase-title">Get the highlights.</h2>
					</header>
					<div class="dusk-hero-slider" data-dusk-showcase-slider>
						<div class="dusk-hero-slider__viewport" data-dusk-showcase-viewport>
							<div class="dusk-hero-slider__track" data-dusk-showcase-track>
								${this.showcaseItems.map(
									(item, index) => this.tpl`
										<figure
											class="dusk-hero-slider__item ${index === 0 ? "is-active" : ""}"
										data-dusk-showcase-slide
										aria-hidden="${index === 0 ? "false" : "true"}"
									>
									${
										item.kind === "video"
											? this.tpl`
										<video
											muted
											playsinline
											preload="auto"
											${item.poster ? `poster="${item.poster}"` : ""}
											aria-label="Dusk moving showcase"
										>
											<source src="${item.src}" type="video/webm" />
										</video>
									`
											: this.tpl`
											<img src="${item.src}" alt="${item.alt ?? "Dusk showcase"}" loading="lazy" />
									`
									}
									</figure>
								`,
								)}
							</div>
						</div>
						<div class="dusk-hero-slider__controls">
								<div class="dusk-hero-slider__control-row">
									<div class="dusk-hero-slider__dots" role="group" aria-label="Dusk showcase slides">
										${this.showcaseItems.map(
											(item, index) => this.tpl`
												<button
													type="button"
												class="dusk-hero-slider__dot ${index === 0 ? "is-active" : ""}"
												data-dusk-showcase-dot
												aria-pressed="${index === 0 ? "true" : "false"}"
											>
												<span class="visually-hidden">Show ${item.label}</span>
											</button>
										`,
										)}
								</div>
								<button
									type="button"
									class="dusk-hero-slider__toggle"
									data-dusk-showcase-toggle
									aria-pressed="false"
									aria-label="Pause showcase"
								>
									<svg
										class="dusk-hero-slider__toggle-icon dusk-hero-slider__toggle-icon--pause"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<rect x="4" y="3" width="4.5" height="14" rx="1"></rect>
										<rect x="11.5" y="3" width="4.5" height="14" rx="1"></rect>
									</svg>
									<svg
										class="dusk-hero-slider__toggle-icon dusk-hero-slider__toggle-icon--play"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<path d="M6 4.2L15.8 10L6 15.8V4.2z"></path>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</section>
			</div>
			`;
	}
}

// Backward-compatible aliases for existing imports.
export type DuskHeroShowcaseItem = VehicleHeroShowcaseItem;
export type DuskHeroMediaOptions = VehicleHeroMediaOptions;
export { VehicleHeroMediaSection as DuskHeroMediaSection };
