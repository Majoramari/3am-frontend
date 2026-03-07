import type { CleanupBag } from "@lib/cleanup";
import { clamp } from "@lib/math";

const DUSK_FRAME_COUNT = 120;
const DRAG_PIXELS_PER_FRAME = 6;
const BASE_PREFETCH_RADIUS = 2;
const DRAG_PREFETCH_RADIUS = 8;
const INTRO_START_FRAME_NUMBER = 100;
const INTRO_END_FRAME_INDEX = 0;
const INTRO_START_TRIGGER_RATIO = 0.9;
const INTRO_END_TRIGGER_RATIO = 0.12;
const PRELOAD_INITIAL_DELAY_MS = 260;
const PRELOAD_INTERVAL_MS = 120;
const PRELOAD_ROOT_MARGIN = "900px 0px";

const normalizeFrameIndex = (value: number, frameCount: number): number => {
	const wrapped = value % frameCount;
	return wrapped >= 0 ? wrapped : wrapped + frameCount;
};

const frameUrlAt = (frameIndex: number): string =>
	`/assets/dusk/frames/${String(frameIndex + 1).padStart(4, "0")}.webp`;

const findNearestLoadedFrame = (
	frames: Array<HTMLImageElement | null>,
	targetIndex: number,
): HTMLImageElement | null => {
	const exactFrame = frames[targetIndex];
	if (exactFrame) {
		return exactFrame;
	}

	for (let distance = 1; distance < frames.length; distance += 1) {
		const backwardFrame =
			frames[normalizeFrameIndex(targetIndex - distance, frames.length)];
		if (backwardFrame) {
			return backwardFrame;
		}

		const forwardFrame =
			frames[normalizeFrameIndex(targetIndex + distance, frames.length)];
		if (forwardFrame) {
			return forwardFrame;
		}
	}

	return null;
};

const syncCanvasToImageSize = (
	canvas: HTMLCanvasElement,
	image: HTMLImageElement,
): void => {
	const width = image.naturalWidth;
	const height = image.naturalHeight;

	if (width <= 0 || height <= 0) {
		return;
	}

	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
		canvas.style.aspectRatio = `${width} / ${height}`;
	}
};

const drawNativeSize = (
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	image: HTMLImageElement,
): void => {
	syncCanvasToImageSize(canvas, image);

	if (canvas.width <= 0 || canvas.height <= 0) {
		return;
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
};

export const setupDuskSpinCanvas = (
	root: ParentNode,
	cleanup: CleanupBag,
): void => {
	const stage = root.querySelector<HTMLElement>(".dusk-spin-stage");
	const canvas = root.querySelector<HTMLCanvasElement>(
		"[data-dusk-spin-canvas]",
	);
	const statusNode = root.querySelector<HTMLElement>("[data-dusk-spin-status]");

	if (!stage || !canvas) {
		return;
	}

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}
	ctx.imageSmoothingEnabled = true;

	const frames: Array<HTMLImageElement | null> = Array.from(
		{ length: DUSK_FRAME_COUNT },
		() => null,
	);
	const frameRequested: boolean[] = Array.from(
		{ length: DUSK_FRAME_COUNT },
		() => false,
	);

	let activeFrame = 0;
	let loadedCount = 0;
	let rafId = 0;
	let isDragging = false;
	let dragPointerId: number | null = null;
	let dragLastX = 0;
	let dragFrameAccumulator = 0;
	let isDisposed = false;
	let hasManualControl = false;
	let preloadTimer = 0;
	let preloadCursor = 0;
	let isInViewport = false;
	let hasStartedPreload = false;

	const introStartFrameIndex = clamp(
		INTRO_START_FRAME_NUMBER - 1,
		0,
		DUSK_FRAME_COUNT - 1,
	);
	const introForwardDistance = normalizeFrameIndex(
		INTRO_END_FRAME_INDEX - introStartFrameIndex,
		DUSK_FRAME_COUNT,
	);

	const updateStatus = (): void => {
		if (!statusNode) {
			return;
		}

		if (loadedCount >= DUSK_FRAME_COUNT) {
			statusNode.textContent = `Frame ${String(activeFrame + 1).padStart(3, "0")} / ${DUSK_FRAME_COUNT}`;
			return;
		}

		statusNode.textContent = `Loading ${loadedCount} / ${DUSK_FRAME_COUNT} frames`;
	};

	const drawCurrentFrame = (): void => {
		rafId = 0;

		const image =
			frames[activeFrame] ?? findNearestLoadedFrame(frames, activeFrame);
		if (!image) {
			return;
		}

		drawNativeSize(ctx, canvas, image);
		updateStatus();
	};

	const queueDraw = (): void => {
		if (rafId !== 0) {
			return;
		}
		rafId = window.requestAnimationFrame(drawCurrentFrame);
	};

	const setFrame = (nextFrame: number): void => {
		const normalized = normalizeFrameIndex(nextFrame, DUSK_FRAME_COUNT);
		const prefetchRadius = isDragging
			? DRAG_PREFETCH_RADIUS
			: BASE_PREFETCH_RADIUS;
		requestFrame(normalized);
		for (let distance = 1; distance <= prefetchRadius; distance += 1) {
			requestFrame(
				normalizeFrameIndex(normalized - distance, DUSK_FRAME_COUNT),
			);
			requestFrame(
				normalizeFrameIndex(normalized + distance, DUSK_FRAME_COUNT),
			);
		}
		if (normalized === activeFrame) {
			return;
		}
		activeFrame = normalized;
		queueDraw();
	};

	const applyScrollIntroFrame = (): void => {
		if (hasManualControl || isDragging) {
			return;
		}

		const viewportHeight = Math.max(1, window.innerHeight);
		const stageRect = stage.getBoundingClientRect();
		const introStartY = viewportHeight * INTRO_START_TRIGGER_RATIO;
		const introEndY = viewportHeight * INTRO_END_TRIGGER_RATIO;
		const introTravel = Math.max(1, introStartY - introEndY);
		// Progress starts once stage top crosses the start trigger line
		// and finishes near the top of the viewport.
		const introProgress = clamp(
			(introStartY - stageRect.top) / introTravel,
			0,
			1,
		);
		const nextIntroFrame = normalizeFrameIndex(
			introStartFrameIndex + Math.round(introForwardDistance * introProgress),
			DUSK_FRAME_COUNT,
		);
		setFrame(nextIntroFrame);
	};

	const beginDrag = (event: PointerEvent): void => {
		if (event.pointerType === "mouse" && event.button !== 0) {
			return;
		}

		event.preventDefault();
		hasManualControl = true;
		canvas.setPointerCapture(event.pointerId);
		canvas.classList.add("is-dragging");
		isDragging = true;
		dragPointerId = event.pointerId;
		dragLastX = event.clientX;
		dragFrameAccumulator = activeFrame;
	};

	const updateDrag = (event: PointerEvent): void => {
		if (!isDragging || dragPointerId !== event.pointerId) {
			return;
		}

		const coalescedEvents =
			typeof event.getCoalescedEvents === "function"
				? event.getCoalescedEvents()
				: [];
		const motionSamples =
			coalescedEvents.length > 0 ? coalescedEvents : [event];

		for (const sample of motionSamples) {
			const dragDeltaX = sample.clientX - dragLastX;
			dragLastX = sample.clientX;
			dragFrameAccumulator += dragDeltaX / DRAG_PIXELS_PER_FRAME;
		}

		setFrame(Math.round(dragFrameAccumulator));
	};

	const endDrag = (event: PointerEvent): void => {
		if (!isDragging || dragPointerId !== event.pointerId) {
			return;
		}

		if (canvas.hasPointerCapture(event.pointerId)) {
			canvas.releasePointerCapture(event.pointerId);
		}

		canvas.classList.remove("is-dragging");
		isDragging = false;
		dragPointerId = null;
		updateStatus();
	};

	const renderFallbackFrame = (): void => {
		const nearestLoaded = findNearestLoadedFrame(frames, activeFrame);

		if (!nearestLoaded) {
			return;
		}

		drawNativeSize(ctx, canvas, nearestLoaded);
	};

	const requestFrame = (frameIndex: number): void => {
		if (frameIndex < 0 || frameIndex >= DUSK_FRAME_COUNT) {
			return;
		}
		if (frameRequested[frameIndex]) {
			return;
		}

		frameRequested[frameIndex] = true;

		const image = new Image();
		image.decoding = "async";
		image.src = frameUrlAt(frameIndex);

		const finalizeLoad = (): void => {
			if (isDisposed || frames[frameIndex]) {
				return;
			}
			frames[frameIndex] = image;
			loadedCount += 1;

			if (frameIndex === activeFrame) {
				queueDraw();
			} else {
				renderFallbackFrame();
				updateStatus();
			}
		};

		image.addEventListener("load", finalizeLoad, { once: true });
		image.addEventListener(
			"error",
			() => {
				if (isDisposed) {
					return;
				}
				frameRequested[frameIndex] = false;
				updateStatus();
			},
			{ once: true },
		);
	};

	const schedulePreload = (delayMs: number = PRELOAD_INTERVAL_MS): void => {
		if (isDisposed || !isInViewport || preloadTimer !== 0) {
			return;
		}
		preloadTimer = window.setTimeout(runPreloadStep, delayMs);
	};

	const clearPreloadTimer = (): void => {
		if (preloadTimer === 0) {
			return;
		}
		window.clearTimeout(preloadTimer);
		preloadTimer = 0;
	};

	const runPreloadStep = (): void => {
		preloadTimer = 0;
		if (isDisposed || !isInViewport) {
			return;
		}

		while (preloadCursor < DUSK_FRAME_COUNT && frameRequested[preloadCursor]) {
			preloadCursor += 1;
		}

		if (preloadCursor >= DUSK_FRAME_COUNT) {
			return;
		}

		requestFrame(preloadCursor);
		preloadCursor += 1;
		schedulePreload(PRELOAD_INTERVAL_MS);
	};

	const startProgressivePreload = (): void => {
		if (hasStartedPreload) {
			return;
		}
		hasStartedPreload = true;
		schedulePreload(PRELOAD_INITIAL_DELAY_MS);
	};

	updateStatus();
	queueDraw();

	cleanup.on(canvas, "pointerdown", (event) => beginDrag(event));
	cleanup.on(canvas, "pointermove", (event) => updateDrag(event));
	cleanup.on(canvas, "pointerup", (event) => endDrag(event));
	cleanup.on(canvas, "pointercancel", (event) => endDrag(event));
	cleanup.on(window, "scroll", () => applyScrollIntroFrame(), {
		passive: true,
	});
	cleanup.on(
		window,
		"resize",
		() => {
			applyScrollIntroFrame();
			renderFallbackFrame();
			queueDraw();
		},
		{ passive: true },
	);

	cleanup.on(canvas, "keydown", (event) => {
		if (!(event instanceof KeyboardEvent)) {
			return;
		}
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			hasManualControl = true;
			setFrame(activeFrame - 1);
			updateStatus();
			return;
		}
		if (event.key === "ArrowRight") {
			event.preventDefault();
			hasManualControl = true;
			setFrame(activeFrame + 1);
			updateStatus();
		}
	});

	cleanup.on(canvas, "blur", () => {
		if (!isDragging) {
			return;
		}
		canvas.classList.remove("is-dragging");
		isDragging = false;
		dragPointerId = null;
	});

	cleanup.add(() => {
		isDisposed = true;
		clearPreloadTimer();
		if (rafId !== 0) {
			window.cancelAnimationFrame(rafId);
		}
	});

	const firstFrame = new Image();
	firstFrame.decoding = "async";
	firstFrame.src = "/assets/dusk/dusk_transparent.webp";
	firstFrame.addEventListener(
		"load",
		() => {
			if (isDisposed || frames[activeFrame]) {
				return;
			}
			drawNativeSize(ctx, canvas, firstFrame);
		},
		{ once: true },
	);

	setFrame(introStartFrameIndex);
	applyScrollIntroFrame();

	if (typeof IntersectionObserver === "function") {
		const observer = new IntersectionObserver(
			(entries) => {
				const nextInViewport = entries.some((entry) => entry.isIntersecting);
				isInViewport = nextInViewport;
				if (nextInViewport) {
					startProgressivePreload();
					schedulePreload();
					return;
				}

				clearPreloadTimer();
			},
			{ rootMargin: PRELOAD_ROOT_MARGIN },
		);

		observer.observe(stage);
		cleanup.add(() => observer.disconnect());
	} else {
		isInViewport = true;
		startProgressivePreload();
		schedulePreload();
	}
};
