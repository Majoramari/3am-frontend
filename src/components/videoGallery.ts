import { View } from "@lib/view";
import { LazyVideo } from "@components/lazyVideo";
import { setupVideoGallery } from "./videoGalleryCarousel";
import galleryPlayIcon   from "@assets/icons/gallery-play.svg";
import galleryPauseIcon  from "@assets/icons/gallery-pause.svg";
import galleryReplayIcon from "@assets/icons/gallery-replay.svg";
export type VideoGallerySlide = {
	src: string;
	caption: string;
};

export type VideoGalleryConfig = {
	slides: ReadonlyArray<VideoGallerySlide>;
	headline?: string;
};

export class VideoGallery extends View<"section"> {
	private readonly slides: ReadonlyArray<VideoGallerySlide>;
	private readonly headline: string;

	constructor(config: VideoGalleryConfig) {
		super("section", { className: "vg-gallery" });
		this.slides = config.slides;
		this.headline = config.headline ?? "Get the highlights.";
	}

	protected override onMount(): void {
		setupVideoGallery(this.element, this.cleanup);
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="vg-gallery__header-wrapper">
				<header class="vg-gallery__header">
					<h2 class="vg-gallery__headline">${this.headline}</h2>
				</header>
			</div>

			<div class="vg-gallery__body">
				<div class="vg-gallery__controls">

					<div class="vg-gallery__dotnav">
						<span class="vg-gallery__controls-bg"></span>
						<ul role="tablist" class="vg-gallery__dotnav-list" id="vgDotnavItems"></ul>
					</div>

					<div class="vg-gallery__playpause-wrapper">
						<span class="vg-gallery__controls-bg"></span>
						<button class="vg-gallery__playpause-btn" id="vgPlayPauseBtn" aria-label="Play gallery">
							<span class="visuallyhidden">Play</span>
							<img class="vg-gallery__playpause-icon vg-gallery__playpause-icon--play"   src="${galleryPlayIcon}"   alt="" aria-hidden="true" />
<img class="vg-gallery__playpause-icon vg-gallery__playpause-icon--pause"  src="${galleryPauseIcon}"  alt="" aria-hidden="true" />
<img class="vg-gallery__playpause-icon vg-gallery__playpause-icon--replay" src="${galleryReplayIcon}" alt="" aria-hidden="true" />	</button>
					</div>

				</div>

				<div class="vg-gallery__viewport">
					<ul class="vg-gallery__track" id="vgTrack">
						${this.slides.map((slide) => this.tpl`
							<li class="vg-gallery__slide">
								<div class="vg-gallery__slide-inner">
									<div class="vg-gallery__slide-media">
										${new LazyVideo({
											src: slide.src,
											type: "video/mp4",
											muted: true,
											playsInline: true,
											preload: "none",
											className: "vg-gallery__slide-video",
										})}
										<div class="vg-gallery__slide-caption-wrapper">
											<p class="vg-gallery__slide-caption">${slide.caption}</p>
										</div>
									</div>
								</div>
							</li>
						`)}
					</ul>
				</div>
			</div>
		`;
	}
}