import { LazyImage } from "@components/lazyImage";
import { LazyVideo } from "@components/lazyVideo";
import { View } from "@lib/view";
import duskHeroImageSrc from "@assets/dusk/dusk_transparent.webp";
import duskHeroPosterSrc from "@assets/dusk/hero_endframe.webp";
import duskHeroVideoSrc from "@assets/dusk/hero_video.webm";

export class HomeHeroSection extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "hero"] });
	}

	render(): DocumentFragment {
		return this.tpl`
			<h1>Built for the Night</h1>
			${new LazyImage({
				src: duskHeroImageSrc,
				alt: "Dusk side profile",
				className: "hero-media",
				width: 1280,
				height: 720,
			})}
			${new LazyVideo({
				src: duskHeroVideoSrc,
				type: "video/webm",
				poster: duskHeroPosterSrc,
				className: "hero-video",
				controls: true,
				muted: true,
				playsInline: true,
			})}
		`;
	}
}
