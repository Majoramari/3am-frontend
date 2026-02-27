import type { CleanupBag } from "@lib/cleanup";
import {
	hydrateDeferredImage,
	hydrateDeferredSource,
} from "@lib/lazyMediaHydration";

const AUTOPLAY_DELAY_MS = 20_000;
const MANUAL_DURATION_MS = 820;
const AUTOPLAY_DURATION_MS = 1_280;
const SLIDE_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const SWIPE_THRESHOLD_RATIO = 0.1;
const INTERACTIVE_TARGET_SELECTOR =
	"a, button, input, select, textarea, [role='button']";

const hydrateClonedSlideMedia = (slide: HTMLDivElement): void => {
	// Loop clones are created after route-level lazy scan.
	// Hydrate clone media immediately so wrap transitions don't flash placeholders.
	for (const source of slide.querySelectorAll<HTMLSourceElement>("source")) {
		hydrateDeferredSource(source);
	}

	for (const image of slide.querySelectorAll<HTMLImageElement>("img")) {
		hydrateDeferredImage(image);
	}
};

const makeLoopClone = (slide: HTMLDivElement): HTMLDivElement => {
	const clone = slide.cloneNode(true) as HTMLDivElement;
	clone.classList.add("hero-slide--clone");
	clone.removeAttribute("id");
	clone.setAttribute("aria-hidden", "true");
	hydrateClonedSlideMedia(clone);
	return clone;
};

export const setupHomeHeroCarousel = (
	root: ParentNode,
	cleanup: CleanupBag,
): void => {
	// This is intentionally hero-specific and not shared as a generic carousel.
	const wrapper = root.querySelector<HTMLDivElement>(".hero-carousel");
	const viewport = root.querySelector<HTMLDivElement>(
		".hero-carousel__viewport",
	);
	const track = root.querySelector<HTMLDivElement>(".hero-carousel__track");
	const dots = Array.from(
		root.querySelectorAll<HTMLButtonElement>(".hero-carousel__dot"),
	);

	if (!wrapper || !viewport || !track) {
		return;
	}

	const realSlides = Array.from(track.children).filter(
		(node): node is HTMLDivElement =>
			node instanceof HTMLDivElement && node.classList.contains("hero-slide"),
	);

	if (realSlides.length === 0 || dots.length === 0) {
		return;
	}

	const slideCount = realSlides.length;
	const reducedMotionQuery =
		typeof window.matchMedia === "function"
			? window.matchMedia("(prefers-reduced-motion: reduce)")
			: null;

	// Loop structure after cloning:
	// [last-clone, real-1, real-2, ... real-n, first-clone]
	const startClone = makeLoopClone(realSlides[slideCount - 1]);
	const endClone = makeLoopClone(realSlides[0]);
	track.prepend(startClone);
	track.append(endClone);

	// ===== Runtime state =====
	let activeIndex = 0;
	let trackIndex = 1;
	let slideWidth = 0;
	let autoTimerId: number | null = null;

	let isHovering = false;
	let isFocused = false;
	let isDragging = false;

	let dragPointerId: number | null = null;
	let dragStartX = 0;
	let dragStartTranslateX = 0;

	const prefersReducedMotion = (): boolean =>
		reducedMotionQuery?.matches ?? false;

	const publishActiveSlide = (): void => {
		wrapper.dataset.activeSlide = String(activeIndex);
		// Why: other hero UI parts can sync from this event without touching internals.
		wrapper.dispatchEvent(
			new CustomEvent<{ index: number }>("home-hero:slide-change", {
				detail: { index: activeIndex },
				bubbles: true,
			}),
		);
	};

	const renderDots = (): void => {
		for (const [index, dot] of dots.entries()) {
			const isActive = index === activeIndex;
			dot.classList.toggle("is-active", isActive);
			dot.setAttribute("aria-pressed", String(isActive));
			if (isActive) {
				dot.setAttribute("aria-current", "true");
				continue;
			}
			dot.removeAttribute("aria-current");
		}
	};

	const setTrackPosition = (
		animate: boolean,
		durationMs: number = MANUAL_DURATION_MS,
	): void => {
		const shouldAnimate = animate && !prefersReducedMotion();
		const translateX = Math.round(-trackIndex * slideWidth);
		track.style.transition = shouldAnimate
			? `transform ${durationMs}ms ${SLIDE_EASING}`
			: "none";
		track.style.transform = `translate3d(${translateX}px, 0, 0)`;
	};

	const jumpFromCloneToRealSlide = (): void => {
		if (trackIndex === 0) {
			trackIndex = slideCount;
			setTrackPosition(false);
			return;
		}

		if (trackIndex === slideCount + 1) {
			trackIndex = 1;
			setTrackPosition(false);
		}
	};

	const syncLayout = (): void => {
		const width = viewport.clientWidth;
		if (width <= 0) {
			return;
		}
		slideWidth = width;
		setTrackPosition(false);
	};

	const stopAutoplay = (): void => {
		if (autoTimerId === null) {
			return;
		}
		window.clearInterval(autoTimerId);
		autoTimerId = null;
	};

	const canAutoplay = (): boolean =>
		!document.hidden &&
		!prefersReducedMotion() &&
		!isHovering &&
		!isFocused &&
		!isDragging;

	const restartAutoplay = (): void => {
		stopAutoplay();
		if (!canAutoplay()) {
			return;
		}

		autoTimerId = window.setInterval(() => {
			moveBy(1, AUTOPLAY_DURATION_MS, false);
		}, AUTOPLAY_DELAY_MS);
	};

	const moveBy = (
		step: number,
		durationMs: number = MANUAL_DURATION_MS,
		restartTimer: boolean = true,
	): void => {
		const next = activeIndex + step;
		if (next < 0) {
			activeIndex = slideCount - 1;
		} else if (next >= slideCount) {
			activeIndex = 0;
		} else {
			activeIndex = next;
		}

		trackIndex += step;
		setTrackPosition(true, durationMs);
		renderDots();
		publishActiveSlide();
		if (restartTimer) {
			restartAutoplay();
		}
	};

	// Dot navigation always uses real slides (never clone indexes).
	const goToSlide = (target: number): void => {
		jumpFromCloneToRealSlide();

		if (target <= 0) {
			activeIndex = 0;
		} else if (target >= slideCount - 1) {
			activeIndex = slideCount - 1;
		} else {
			activeIndex = target;
		}

		trackIndex = activeIndex + 1;
		setTrackPosition(true);
		renderDots();
		publishActiveSlide();
		restartAutoplay();
	};

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
		if (slideWidth <= 0) {
			return;
		}

		event.preventDefault();
		jumpFromCloneToRealSlide();

		isDragging = true;
		dragPointerId = event.pointerId;
		dragStartX = event.clientX;
		dragStartTranslateX = -trackIndex * slideWidth;

		viewport.classList.add("is-dragging");
		viewport.setPointerCapture(event.pointerId);
		restartAutoplay();
	};

	// During drag we follow the pointer directly; snap happens in `endDrag`.
	const updateDrag = (event: PointerEvent): void => {
		if (!isDragging || dragPointerId !== event.pointerId) {
			return;
		}

		const minTranslate = -((slideCount + 1) * slideWidth);
		const maxTranslate = 0;
		let nextTranslate = dragStartTranslateX + (event.clientX - dragStartX);

		if (nextTranslate < minTranslate) {
			nextTranslate = minTranslate;
		} else if (nextTranslate > maxTranslate) {
			nextTranslate = maxTranslate;
		}

		nextTranslate = Math.round(nextTranslate);
		track.style.transition = "none";
		track.style.transform = `translate3d(${nextTranslate}px, 0, 0)`;
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
		const threshold = slideWidth * SWIPE_THRESHOLD_RATIO;

		if (dragDistance <= -threshold) {
			moveBy(1);
			return;
		}

		if (dragDistance >= threshold) {
			moveBy(-1);
			return;
		}

		setTrackPosition(true);
		renderDots();
		publishActiveSlide();
		restartAutoplay();
	};

	for (const dot of dots) {
		// Why: dots provide fast random access instead of step-by-step navigation.
		cleanup.on(dot, "click", () => {
			const target = Number(dot.dataset.slideIndex ?? "0");
			goToSlide(target);
		});
	}

	// Why: keyboard support is needed for accessibility parity with pointer controls.
	cleanup.on(viewport, "keydown", (event) => {
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			jumpFromCloneToRealSlide();
			moveBy(-1);
			return;
		}
		if (event.key === "ArrowRight") {
			event.preventDefault();
			jumpFromCloneToRealSlide();
			moveBy(1);
		}
	});

	// Why: start swipe gesture state and pause autoplay while user is interacting.
	cleanup.on(viewport, "pointerdown", (event) => beginDrag(event));
	// Why: provide direct visual feedback while the user drags.
	cleanup.on(viewport, "pointermove", (event) => updateDrag(event));
	// Why: finish swipe gesture and decide whether to snap or change slide.
	cleanup.on(viewport, "pointerup", (event) =>
		endDrag(event.pointerId, event.clientX),
	);
	// Why: avoid stuck drag state when OS/browser interrupts the pointer sequence.
	cleanup.on(viewport, "pointercancel", (event) =>
		endDrag(event.pointerId, event.clientX),
	);

	// Why: loop mode uses clones; transition end is the safe point to normalize index.
	cleanup.on(track, "transitionend", (event) => {
		if (event.target !== track || event.propertyName !== "transform") {
			return;
		}
		// If we landed on a clone, jump to the matching real slide without animation.
		jumpFromCloneToRealSlide();
	});

	// Why: autoplay should not fight the user while they are inspecting/interacting.
	cleanup.on(wrapper, "mouseenter", () => {
		isHovering = true;
		restartAutoplay();
	});
	// Why: resume autoplay only after user leaves the carousel interaction area.
	cleanup.on(wrapper, "mouseleave", () => {
		isHovering = false;
		restartAutoplay();
	});
	// Why: keyboard/screen-reader users need stable content while focused.
	cleanup.on(wrapper, "focusin", () => {
		isFocused = true;
		restartAutoplay();
	});
	// Why: autoplay may resume only after focus fully exits the carousel.
	cleanup.on(wrapper, "focusout", (event) => {
		const nextTarget = event.relatedTarget as Node | null;
		if (nextTarget && wrapper.contains(nextTarget)) {
			return;
		}
		isFocused = false;
		restartAutoplay();
	});
	// Why: responsive width changes would desync slide offsets without recalculation.
	cleanup.on(window, "resize", () => syncLayout());

	const onVisibilityChange = (): void => {
		if (document.hidden) {
			stopAutoplay();
			return;
		}
		restartAutoplay();
	};
	// Why: hidden tabs should not keep autoplay timers running.
	document.addEventListener("visibilitychange", onVisibilityChange);

	cleanup.add(() => {
		document.removeEventListener("visibilitychange", onVisibilityChange);
		stopAutoplay();
		startClone.remove();
		endClone.remove();
	});

	queueMicrotask(() => {
		if (!wrapper.isConnected) {
			return;
		}
		syncLayout();
		renderDots();
		publishActiveSlide();
		restartAutoplay();
	});
};
