import {
	LazyImage,
	type LazyImageConfig,
	type LazyPictureConfig as LazyImagePictureConfig,
	type LazyImageSourceConfig,
} from "@components/lazyImage";
import { DEFAULT_PICTURE_MEDIA_QUERIES } from "@lib/media";
import { View } from "@lib/view";

type LazyPictureDeviceSrc = {
	phone: string;
	tablet: string;
	pc: string;
};

export type LazyPictureConfig = Omit<LazyImageConfig, "src"> & {
	src: string | LazyPictureDeviceSrc;
	sources?: ReadonlyArray<LazyImageSourceConfig>;
	pictureClassName?: string;
};

export class LazyPicture extends View<"picture"> {
	private readonly config: LazyImagePictureConfig;

	constructor(config: LazyPictureConfig) {
		super("picture", {
			className: config.pictureClassName,
			renderMode: "once",
		});
		this.config = LazyPicture.toLazyImagePictureConfig(config);
	}

	render(): DocumentFragment {
		const picture = LazyImage.picture(this.config);
		const fragment = document.createDocumentFragment();
		fragment.append(...Array.from(picture.childNodes));
		return fragment;
	}

	private static toLazyImagePictureConfig(
		config: LazyPictureConfig,
	): LazyImagePictureConfig {
		const { pictureClassName, sources, src, ...imageConfig } = config;

		if (LazyPicture.isDeviceSrc(src)) {
			if (sources && sources.length > 0) {
				throw new Error(
					"LazyPicture does not support both src device object and sources",
				);
			}

			const [phoneMedia, tabletMedia, pcMedia] =
				DEFAULT_PICTURE_MEDIA_QUERIES;
			return {
				className: pictureClassName,
				image: {
					...imageConfig,
					src: src.pc,
				},
				sources: [
					{
						src: src.phone,
						media: phoneMedia,
					},
					{
						src: src.tablet,
						media: tabletMedia,
					},
					{
						src: src.pc,
						media: pcMedia,
					},
				],
			};
		}

		return {
			className: pictureClassName,
			image: {
				...imageConfig,
				src,
			},
			sources,
		};
	}

	private static isDeviceSrc(
		src: LazyPictureConfig["src"],
	): src is LazyPictureDeviceSrc {
		return typeof src === "object" && src !== null;
	}
}
