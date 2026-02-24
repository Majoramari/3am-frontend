import { DEFAULT_PICTURE_MEDIA_QUERIES } from "@lib/media";
import { View } from "@lib/view";

type AttrValue = string | number | boolean | null | undefined;
type AttrMap = Record<string, AttrValue>;

export type LazyImageConfig = {
	src: string;
	alt: string;
	className?: string;
	placeholderSrc?: string;
	srcset?: string;
	sizes?: string;
	loading?: "lazy" | "eager";
	decoding?: "async" | "sync" | "auto";
	width?: number | string;
	height?: number | string;
	attrs?: AttrMap;
};

export type LazyImageSourceConfig = {
	src: string;
	media?: string;
	type?: string;
	sizes?: string;
	attrs?: AttrMap;
};

type LazyPictureSrcTuple = readonly [string, string, string];

type LazyPictureImageConfig = Omit<LazyImageConfig, "src"> & {
	src: string | LazyPictureSrcTuple;
};

export type LazyPictureConfig = {
	image: LazyPictureImageConfig;
	sources?: ReadonlyArray<LazyImageSourceConfig>;
	className?: string;
};

export class LazyImage extends View<"img"> {
	private static readonly DEFAULT_PLACEHOLDER_SRC =
		"/assets/shared/placeholder.png";

	constructor(config: LazyImageConfig) {
		super("img", {
			className: LazyImage.toClassName(config.className),
			attrs: LazyImage.toAttrs(config),
			dataset: LazyImage.toDataset(config),
			renderMode: "once",
		});
	}

	render(): DocumentFragment {
		return document.createDocumentFragment();
	}

	static picture(config: LazyPictureConfig): HTMLPictureElement {
		const sources = LazyImage.toPictureSources(config);

		const picture = document.createElement("picture");
		if (config.className) {
			picture.className = config.className;
		}

		for (const sourceConfig of sources) {
			picture.appendChild(
				LazyImage.toSourceNode(sourceConfig, config.image.sizes),
			);
		}

		picture.appendChild(
			new LazyImage(LazyImage.toImageConfig(config)).renderToNode(),
		);
		return picture;
	}

	private static toClassName(className: string | undefined): string {
		return ["lazy-image", className ?? ""].filter(Boolean).join(" ");
	}

	private static toAttrs(config: LazyImageConfig): AttrMap {
		const attrs: AttrMap = {
			src: config.placeholderSrc ?? LazyImage.DEFAULT_PLACEHOLDER_SRC,
			alt: config.alt,
			loading: config.loading ?? "lazy",
			decoding: config.decoding ?? "async",
			width: config.width,
			height: config.height,
		};

		if (!config.attrs) {
			return attrs;
		}

		for (const [key, value] of Object.entries(config.attrs)) {
			if (
				key === "src" ||
				key === "alt" ||
				key === "srcset" ||
				key === "sizes" ||
				key === "loading" ||
				key === "decoding"
			) {
				continue;
			}

			attrs[key] = value;
		}

		return attrs;
	}

	private static toDataset(config: LazyImageConfig): AttrMap {
		return {
			lazySrc: config.src,
			lazySrcset: config.srcset,
			lazySizes: config.sizes,
		};
	}

	private static toSourceNode(
		config: LazyImageSourceConfig,
		fallbackSizes: string | undefined,
	): HTMLSourceElement {
		const source = document.createElement("source");
		source.setAttribute("data-lazy-srcset", config.src);

		if (config.media) {
			source.setAttribute("media", config.media);
		}

		if (config.type) {
			source.setAttribute("type", config.type);
		}

		const sizes = config.sizes ?? fallbackSizes;
		if (sizes) {
			source.setAttribute("sizes", sizes);
		}

		if (!config.attrs) {
			return source;
		}

		for (const [key, value] of Object.entries(config.attrs)) {
			if (
				key === "src" ||
				key === "srcset" ||
				key === "media" ||
				key === "type" ||
				key === "sizes"
			) {
				continue;
			}

			if (value === null || value === undefined || value === false) {
				continue;
			}

			source.setAttribute(key, value === true ? "" : String(value));
		}

		return source;
	}

	private static toPictureSources(
		config: LazyPictureConfig,
	): ReadonlyArray<LazyImageSourceConfig> {
		if (config.sources && config.sources.length > 0) {
			if (Array.isArray(config.image.src)) {
				throw new Error(
					"LazyImage.picture does not support both image.src array and sources",
				);
			}
			return config.sources;
		}

		if (!Array.isArray(config.image.src)) {
			throw new Error(
				"LazyImage.picture requires sources or image.src array of [mobile, tablet, desktop]",
			);
		}

		const [mobileSrc, tabletSrc, desktopSrc] = config.image.src;
		const [mobileMedia, tabletMedia, desktopMedia] =
			DEFAULT_PICTURE_MEDIA_QUERIES;
		return [
			{
				src: mobileSrc,
				media: mobileMedia,
			},
			{
				src: tabletSrc,
				media: tabletMedia,
			},
			{
				src: desktopSrc,
				media: desktopMedia,
			},
		];
	}

	private static toImageConfig(config: LazyPictureConfig): LazyImageConfig {
		const { src, ...rest } = config.image;
		if (typeof src === "string") {
			return {
				...rest,
				src,
			};
		}

		const [, , desktopSrc] = src;
		return {
			...rest,
			src: desktopSrc,
		};
	}
}
