import type { CleanupBag } from "@lib/cleanup";

type GalleryState = {
	currentIndex: number;
	canAdvance: boolean;
	isTransitioning: boolean;
	hasEnded: boolean;
};

function hydrateAndPlay(
	video: HTMLVideoElement,
	cleanup: CleanupBag,
	isStillCurrent: () => boolean,
): void {
	const source = video.querySelector<HTMLSourceElement>("source[data-lazy-src]");
	if (source) {
		const lazySrc = source.getAttribute("data-lazy-src");
		if (lazySrc && !source.getAttribute("src")) {
			source.setAttribute("src", lazySrc);
			video.load();
		}
	}

	if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
		video.play().catch(() => { /* autoplay blocked */ });
	} else {
		cleanup.on(video, "canplay", function onCanPlay() {
			video.removeEventListener("canplay", onCanPlay);
			if (isStillCurrent()) {
				video.play().catch(() => { /* autoplay blocked */ });
			}
		});
	}
}

function initGallery(
	root: HTMLElement,
	cleanup: CleanupBag,
	track: HTMLElement,
	playPauseBtn: HTMLButtonElement,
	dotnavItems: HTMLElement,
): void {
	const slides  = root.querySelectorAll<HTMLElement>(".vg-gallery__slide");
	const videos  = root.querySelectorAll<HTMLVideoElement>(".vg-gallery__slide-video");

	if (slides.length === 0) return;

	const state: GalleryState = {
		currentIndex: 0,
		canAdvance: true,
		isTransitioning: false,
		hasEnded: false,
	};

	// ── Dots ────────────────────────────────────────────────
	slides.forEach((_, index) => {
		const li = document.createElement("li");
		li.className = "vg-gallery__dot";
		if (index === 0) li.classList.add("vg-gallery__dot--current");

		const a = document.createElement("a");
		a.className = "vg-gallery__dot-link";
		a.href = "#";
		a.setAttribute("role", "tab");
		a.setAttribute("aria-selected", index === 0 ? "true" : "false");
		a.style.setProperty("--vg-gallery-progress", "0%");

		const span = document.createElement("span");
		span.className = "visuallyhidden";
		span.textContent = `Video ${index + 1}`;

		a.appendChild(span);
		li.appendChild(a);
		dotnavItems.appendChild(li);

		cleanup.on(a, "click", (e: Event) => {
			e.preventDefault();
			state.hasEnded = false;
			goToSlide(index);
		});
	});

	const dots     = root.querySelectorAll<HTMLElement>(".vg-gallery__dot");
	const dotLinks = root.querySelectorAll<HTMLElement>(".vg-gallery__dot-link");

	// ── Helpers ─────────────────────────────────────────────
	function updateProgress(progress: number): void {
		dotLinks[state.currentIndex]?.style.setProperty("--vg-gallery-progress", `${progress}%`);
	}

	function updateTrackPosition(): void {
		const slideWidth = slides[0].offsetWidth;
		const gap = 24;
		const offset = -(state.currentIndex * (slideWidth + gap));
		track.style.transform = `translateX(${offset}px)`;
	}

	function updateButtonState(): void {
		if (state.canAdvance) {
			playPauseBtn.classList.add("vg-gallery__playpause-btn--playing");
			playPauseBtn.classList.remove("vg-gallery__playpause-btn--replay");
			playPauseBtn.setAttribute("aria-label", "Pause gallery");
		} else {
			playPauseBtn.classList.remove("vg-gallery__playpause-btn--playing");
			playPauseBtn.setAttribute("aria-label", "Play gallery");
		}
	}

	function playCurrentVideo(): void {
		videos.forEach((v) => v.pause());
		const video = videos[state.currentIndex];
		if (!video) return;
		hydrateAndPlay(video, cleanup, () => videos[state.currentIndex] === video);
	}

	// ── Navigation ───────────────────────────────────────────
	function goToSlide(index: number): void {
		if (state.isTransitioning) return;
		state.isTransitioning = true;

		const prev = state.currentIndex;
		const prevVideo = videos[prev];
		if (prevVideo) prevVideo.currentTime = 0;

		dots[prev]?.classList.remove("vg-gallery__dot--current");
		slides[prev]?.classList.remove("vg-gallery__slide--active");
		dotLinks[prev]?.style.setProperty("--vg-gallery-progress", "0%");
		dotLinks[prev]?.setAttribute("aria-selected", "false");

		dots[index]?.classList.add("vg-gallery__dot--current");
		slides[index]?.classList.add("vg-gallery__slide--active");
		dotLinks[index]?.setAttribute("aria-selected", "true");
		state.currentIndex = index;

		updateTrackPosition();

		const timerId = window.setTimeout(() => {
			playCurrentVideo();
			state.isTransitioning = false;
		}, 800);

		cleanup.add(() => window.clearTimeout(timerId));
	}

	function handleVideoEnd(): void {
		if (state.currentIndex === slides.length - 1) {
			state.hasEnded = true;
			state.canAdvance = false;
			playPauseBtn.classList.remove("vg-gallery__playpause-btn--playing");
			playPauseBtn.classList.add("vg-gallery__playpause-btn--replay");
			playPauseBtn.setAttribute("aria-label", "Replay gallery");
		} else {
			const timerId = window.setTimeout(() => goToSlide(state.currentIndex + 1), 300);
			cleanup.add(() => window.clearTimeout(timerId));
		}
	}

	// ── Swipe ────────────────────────────────────────────────
	let pointerStartX = 0;

	cleanup.on(track, "pointerdown", (e: Event) => {
		pointerStartX = (e as PointerEvent).clientX;
	});

	cleanup.on(track, "pointerup", (e: Event) => {
		const delta = (e as PointerEvent).clientX - pointerStartX;
		if (Math.abs(delta) < 50) return;
		if (delta < 0 && state.currentIndex < slides.length - 1) {
			goToSlide(state.currentIndex + 1);
		} else if (delta > 0 && state.currentIndex > 0) {
			goToSlide(state.currentIndex - 1);
		}
	});

	// ── Event listeners via cleanup ──────────────────────────
	cleanup.on(playPauseBtn, "click", () => {
		if (state.hasEnded) {
			state.hasEnded = false;
			state.canAdvance = true;
			goToSlide(0);
			updateButtonState();
			return;
		}
		state.canAdvance = !state.canAdvance;
		updateButtonState();
		const currentVideo = videos[state.currentIndex];
		if (state.canAdvance && currentVideo?.ended) handleVideoEnd();
	});

	videos.forEach((video, index) => {
		cleanup.on(video, "ended", () => {
			if (index === state.currentIndex && state.canAdvance) handleVideoEnd();
		});

		cleanup.on(video, "timeupdate", () => {
			if (index === state.currentIndex && video.duration) {
				updateProgress((video.currentTime / video.duration) * 100);
			}
		});
	});

	// ── Init ─────────────────────────────────────────────────
	slides[0]?.classList.add("vg-gallery__slide--active");
	updateButtonState();
	playCurrentVideo();
}

export function setupVideoGallery(root: HTMLElement, cleanup: CleanupBag): void {
	const track        = root.querySelector<HTMLElement>("#vgTrack");
	const playPauseBtn = root.querySelector<HTMLButtonElement>("#vgPlayPauseBtn");
	const dotnavItems  = root.querySelector<HTMLElement>("#vgDotnavItems");

	if (!track || !playPauseBtn || !dotnavItems) return;

	initGallery(root, cleanup, track, playPauseBtn, dotnavItems);
}