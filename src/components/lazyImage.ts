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
}
