import type { CleanupBag } from "@lib/cleanup";

type GalleryState = {
	currentIndex: number;
	canAdvance: boolean;
	isTransitioning: boolean;
	hasEnded: boolean;
};

function hydrateVideo(video: HTMLVideoElement): void {
	const source = video.querySelector<HTMLSourceElement>("source[data-lazy-src]");
	if (!source) return;
	const lazySrc = source.getAttribute("data-lazy-src");
	if (lazySrc && !source.getAttribute("src")) {
		source.setAttribute("src", lazySrc);
		video.load();
	}
}

export function setupVideoGallery(root: HTMLElement, cleanup: CleanupBag): void {
	const cardSet = root.querySelector<HTMLElement>("#cardSet")!;
	const cards = root.querySelectorAll<HTMLElement>(".card-container");
	const videos = root.querySelectorAll<HTMLVideoElement>(".gallery-video");
	const playPauseBtn = root.querySelector<HTMLButtonElement>("#playPauseBtn")!;
	const dotnavItems = root.querySelector<HTMLElement>("#dotnavItems")!;

	const state: GalleryState = {
		currentIndex: 0,
		canAdvance: true,
		isTransitioning: false,
		hasEnded: false,
	};

	
	videos.forEach((video) => hydrateVideo(video));

	cards.forEach((_, index) => {
		const li = document.createElement("li");
		li.className = "dotnav-item";
		if (index === 0) li.classList.add("current");

		const a = document.createElement("a");
		a.className = "dotnav-link";
		a.href = "#";
		a.setAttribute("role", "tab");
		a.style.setProperty("--progress", "0%");

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

	const dots = root.querySelectorAll<HTMLElement>(".dotnav-item");
	const dotLinks = root.querySelectorAll<HTMLElement>(".dotnav-link");

	function updateProgress(progress: number): void {
		const link = dotLinks[state.currentIndex] as HTMLElement | undefined;
		link?.style.setProperty("--progress", `${progress}%`);
	}

	function updateCarouselPosition(): void {
		const cardWidth = cards[0].offsetWidth;
		const gap = 24;
		const offset = -(state.currentIndex * (cardWidth + gap));
		cardSet.style.transform = `translateX(${offset}px)`;
	}

	function updateButtonState(): void {
		if (state.canAdvance) {
			playPauseBtn.classList.add("playing");
			playPauseBtn.classList.remove("replay");
		} else {
			playPauseBtn.classList.remove("playing");
		}
	}

	function playCurrentVideo(): void {
		videos.forEach((v) => v.pause());
		const video = videos[state.currentIndex];
		if (!video) return;

		if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
			video.play().catch(() => { /* autoplay blocked */ });
		} else {
			const onCanPlay = (): void => {
				video.removeEventListener("canplay", onCanPlay);
				if (videos[state.currentIndex] === video) {
					video.play().catch(() => { /* autoplay blocked */ });
				}
			};
			video.addEventListener("canplay", onCanPlay);
		}
	}

	function goToSlide(index: number): void {
		if (state.isTransitioning) return;
		state.isTransitioning = true;

		const prev = state.currentIndex;
		if (videos[prev]) videos[prev].currentTime = 0;

		dots[prev].classList.remove("current");
		cards[prev].classList.remove("active");
		dotLinks[prev].style.setProperty("--progress", "0%");

		dots[index].classList.add("current");
		cards[index].classList.add("active");
		state.currentIndex = index;

		updateCarouselPosition();

		window.setTimeout(() => {
			playCurrentVideo();
			state.isTransitioning = false;
		}, 800);
	}

	function handleVideoEnd(): void {
		if (state.currentIndex === cards.length - 1) {
			state.hasEnded = true;
			state.canAdvance = false;
			playPauseBtn.classList.remove("playing");
			playPauseBtn.classList.add("replay");
			playPauseBtn.setAttribute("aria-label", "Replay gallery");
		} else {
			window.setTimeout(() => goToSlide(state.currentIndex + 1), 300);
		}
	}

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
			if (index === state.currentIndex && state.canAdvance) {
				handleVideoEnd();
			}
		});

		cleanup.on(video, "timeupdate", () => {
			if (index === state.currentIndex && video.duration) {
				updateProgress((video.currentTime / video.duration) * 100);
			}
		});
	});

	cards[0].classList.add("active");
	updateButtonState();
	playCurrentVideo();
}