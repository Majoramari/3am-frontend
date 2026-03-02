import { View } from "@lib/view";

type AttrValue = string | number | boolean | null | undefined;
type AttrMap = Record<string, AttrValue>;

export type LazyVideoSource = {
	src: string;
	type?: string;
	media?: string;
};

type LazyVideoBaseConfig = {
	sources: ReadonlyArray<LazyVideoSource>;
	className?: string;
	poster?: string;
	placeholderPoster?: string;
	preload?: "none" | "metadata" | "auto";
	controls?: boolean;
	muted?: boolean;
	loop?: boolean;
	autoPlay?: boolean;
	playsInline?: boolean;
	attrs?: AttrMap;
};

type LazyVideoSingleSourceConfig = Omit<LazyVideoBaseConfig, "sources"> & {
	src: string;
	type?: string;
	media?: string;
	sources?: never;
};

type LazyVideoMultiSourceConfig = LazyVideoBaseConfig & {
	src?: never;
	type?: never;
	media?: never;
};

export type LazyVideoConfig =
	| LazyVideoSingleSourceConfig
	| LazyVideoMultiSourceConfig;

export class LazyVideo extends View<"video"> {
	private static readonly DEFAULT_PLACEHOLDER_POSTER =
		"/assets/shared/placeholder.png";

	private readonly sources: ReadonlyArray<LazyVideoSource>;

	constructor(config: LazyVideoConfig) {
		const sources = LazyVideo.toSources(config);
		if (sources.length === 0) {
			throw new Error("LazyVideo requires at least one source");
		}

		super("video", {
			className: LazyVideo.toClassName(config.className),
			attrs: LazyVideo.toAttrs(config),
			dataset: LazyVideo.toDataset(config),
			renderMode: "once",
		});
		this.sources = sources;
	}

	render(): DocumentFragment {
		const fragment = document.createDocumentFragment();
		for (const sourceConfig of this.sources) {
			fragment.appendChild(LazyVideo.createSourceNode(sourceConfig));
		}
		return fragment;
	}

	private static toClassName(className: string | undefined): string {
		return ["lazy-video", className ?? ""].filter(Boolean).join(" ");
	}

	private static toAttrs(config: LazyVideoConfig): AttrMap {
		const attrs: AttrMap = {
			preload: config.preload ?? "none",
			controls: config.controls,
			muted: config.muted,
			loop: config.loop,
			autoplay: config.autoPlay,
			playsinline: config.playsInline,
		};

		if (config.poster) {
			attrs.poster =
				config.placeholderPoster ?? LazyVideo.DEFAULT_PLACEHOLDER_POSTER;
		}

		if (!config.attrs) {
			return attrs;
		}

		for (const [key, value] of Object.entries(config.attrs)) {
			if (
				key === "poster" ||
				key === "preload" ||
				key === "controls" ||
				key === "muted" ||
				key === "loop" ||
				key === "autoplay" ||
				key === "playsinline"
			) {
				continue;
			}

			attrs[key] = value;
		}

		return attrs;
	}

	private static toDataset(config: LazyVideoConfig): AttrMap {
		return {
			lazyPoster: config.poster,
		};
	}

	private static toSources(
		config: LazyVideoConfig,
	): ReadonlyArray<LazyVideoSource> {
		if ("sources" in config && config.sources) {
			return config.sources;
		}

		return [
			{
				src: config.src,
				type: config.type,
				media: config.media,
			},
		];
	}

	private static createSourceNode(sourceConfig: LazyVideoSource): HTMLSourceElement {
		const source = document.createElement("source");
		source.setAttribute("data-lazy-src", sourceConfig.src);

		if (sourceConfig.type) {
			source.setAttribute("type", sourceConfig.type);
		}

		if (sourceConfig.media) {
			source.setAttribute("media", sourceConfig.media);
		}

		return source;
	}
}
