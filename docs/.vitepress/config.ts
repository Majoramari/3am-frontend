import { defineConfig } from "vitepress";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const docsBase =
	process.env.DOCS_BASE ??
	(process.env.GITHUB_ACTIONS === "true" && repository
		? `/${repository}/`
		: "/");

export default defineConfig({
	title: "3AM Docs",
	description: "Working docs for the 3AM project codebase.",
	base: docsBase,
	cleanUrls: true,
	lastUpdated: false,
	vite: {
		publicDir: "../public",
	},
	themeConfig: {
		siteTitle: false,
		logo: "/assets/nav/logo.svg",
		docFooter: {
			prev: "Previous",
			next: "Next",
		},
		nav: [
			{ text: "Live Website", link: "https://3am.muhannad.cc" },
			{ text: "Getting Started", link: "/guide/getting-started" },
			{ text: "Library", link: "/library/ready-components" },
			{ text: "Architecture", link: "/architecture/pages" },
			{ text: "Built Systems", link: "/built/core-system" },
			{ text: "Contributing", link: "/guide/contributing" },
		],
		sidebar: [
			{
				text: "Start Here",
				items: [{ text: "Getting Started", link: "/guide/getting-started" }],
			},
			{
				text: "Core Concepts",
				items: [
					{ text: "Guidelines", link: "/guide/guidelines" },
					{ text: "View Lifecycle", link: "/reference/view-lifecycle" },
					{ text: "Templates", link: "/architecture/templates" },
				],
			},
			{
				text: "Architecture",
				items: [
					{ text: "Pages and Routing", link: "/architecture/pages" },
					{ text: "Sections", link: "/architecture/sections" },
					{ text: "Styles", link: "/architecture/styles" },
				],
			},
			{
				text: "Library",
				items: [
					{ text: "Ready Components", link: "/library/ready-components" },
					{ text: "Building Components", link: "/library/components" },
				],
			},
			{
				text: "Built Systems",
				items: [
					{ text: "Core System", link: "/built/core-system" },
					{ text: "Lazy Media System", link: "/built/lazy-media" },
					{ text: "Navbar", link: "/built/navbar" },
					{ text: "Hero Carousel", link: "/built/hero-carousel" },
				],
			},
			{
				text: "Quality",
				items: [
					{ text: "Performance", link: "/guide/performance" },
					{ text: "Testing", link: "/guide/testing" },
					{ text: "Contributing", link: "/guide/contributing" },
				],
			},
		],
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/Majoramari/3am-frontend",
			},
			{
				icon: "linkedin",
				link: "https://www.linkedin.com/in/majoramari/",
			},
		],
	},
});
