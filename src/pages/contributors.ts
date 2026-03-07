import { LazyImage } from "@components/lazyImage";
import { html } from "@lib/template";
import { View } from "@lib/view";

type Contributor = {
	name: string;
	github: string;
	linkedin?: string;
};

const contributors: ReadonlyArray<Contributor> = [
	{
		name: "Basma Bahaa",
		github: "https://github.com/BasmaBahaa",
		linkedin: "https://www.linkedin.com/in/basma-bahaa-417376305",
	},
	{
		name: "Muhannad Hassan",
		github: "https://github.com/Majoramari",
		linkedin: "https://www.linkedin.com/in/majoramari/",
	},
	{
		name: "Amr Mousa",
		github: "https://github.com/Amr-Mousa-333",
		linkedin: "https://www.linkedin.com/in/amormousa",
	},
	{
		name: "Ali Mustafa",
		github: "https://github.com/ali7510",
		linkedin: "https://www.linkedin.com/in/ali-mustafa-daeny",
	},
	{
		name: "Aya Mohammed",
		github: "https://github.com/Ayamohamed2",
		linkedin: "https://www.linkedin.com/in/aya--mohammed/",
	},
	{
		name: "Momen Ayman",
		github: "https://github.com/momenaymann",
	},
];

const contributorsSorted: ReadonlyArray<Contributor> = [...contributors].sort(
	(first, second) =>
		first.name.localeCompare(second.name, "en-US", { sensitivity: "base" }),
);

const getContributorInitials = (name: string): string =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");

const getGithubUsername = (href: string): string => {
	try {
		const url = new URL(href);
		const firstPathSegment = url.pathname.split("/").filter(Boolean)[0];
		return firstPathSegment ?? "";
	} catch {
		return "";
	}
};

const getGithubHandle = (href: string): string => {
	const username = getGithubUsername(href);
	return username ? `@${username}` : "@github";
};

const getGithubAvatar = (href: string): string => {
	const username = getGithubUsername(href);
	return username
		? `https://github.com/${username}.png?size=160`
		: "https://github.com/github.png?size=160";
};

export class ContributorsPage extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "contributors-page"] });
	}

	render(): DocumentFragment {
		return html`
			<div class="contributors-page__shell">
				<header class="contributors-page__header">
					<p class="contributors-page__eyebrow">THE 3AM TEAM</p>
					<h1 class="contributors-page__title">Contributors</h1>
					<p class="contributors-page__intro">
						The people who designed, built, and shipped this experience.
					</p>
				</header>
				<div class="contributors-page__grid" role="list">
					${contributorsSorted.map(
						(contributor) => html`
							<article class="contributors-page__card" role="listitem">
								<div class="contributors-page__card-head">
									<p class="contributors-page__avatar">
										${new LazyImage({
											src: getGithubAvatar(contributor.github),
											alt: contributor.name,
											className: "contributors-page__avatar-image",
										}).renderToNode()}
										<span class="contributors-page__avatar-fallback">
											${getContributorInitials(contributor.name)}
										</span>
									</p>
									<div class="contributors-page__identity">
										<h2 class="contributors-page__name">${contributor.name}</h2>
										<p class="contributors-page__handle">
											${getGithubHandle(contributor.github)}
										</p>
									</div>
								</div>
								<div class="contributors-page__links">
									<a
										class="contributors-page__link"
										href="${contributor.github}"
										target="_blank"
										rel="noreferrer"
									>
										View GitHub
									</a>
									${contributor.linkedin
										? html`
											<a
												class="contributors-page__link"
												href="${contributor.linkedin}"
												target="_blank"
												rel="noreferrer"
											>
												View LinkedIn
											</a>
										`
										: ""}
								</div>
							</article>
						`,
					)}
				</div>
			</div>
		`;
	}
}
