import { html } from "@lib/template";
import { View } from "@lib/view";

type TermsSection = {
	title: string;
	paragraphs: string[];
};

const termsSections: TermsSection[] = [
	{
		title: "1. Introduction and Acceptance of These Terms",
		paragraphs: [
			"These Terms of Service govern your use of 3AM websites, apps, and related services. By accessing or using the service, you agree to these Terms.",
			"If you do not agree, do not use the service.",
		],
	},
	{
		title: "2. Mandatory Arbitration and Class Action Waiver",
		paragraphs: [
			"Any dispute that cannot be resolved informally may be handled through binding individual arbitration, except where law requires otherwise.",
			"You agree to bring claims only on an individual basis and not as part of a class, representative, or collective action.",
		],
	},
	{
		title: "3. Dispute Resolution Opt-Out Right",
		paragraphs: [
			"You may opt out of the arbitration and class action waiver by sending written notice within the period required by applicable law after first accepting these Terms.",
			"Your opt-out notice must include enough information for us to identify your account and confirm your request.",
		],
	},
	{
		title: "4. Privacy Policy",
		paragraphs: [
			"Our Privacy Policy explains how we collect, use, and protect personal data. By using the service, you acknowledge that policy.",
		],
	},
	{
		title: "5. General Terms and Conditions",
		paragraphs: [
			"You must use the service lawfully and in a way that does not interfere with others or with platform operations.",
			"We may update, suspend, or discontinue features at any time.",
		],
	},
	{
		title: "6. Electronic Communication and Signature Consent",
		paragraphs: [
			"You agree to receive agreements, notices, and disclosures electronically where permitted by law.",
			"When applicable, electronic signatures and electronic records are treated as legally valid.",
		],
	},
	{
		title: "7. Registration and User Accounts",
		paragraphs: [
			"Some features require an account. You are responsible for account activity and for keeping your credentials secure.",
			"You must provide accurate information and keep it updated.",
		],
	},
	{
		title: "8. Terms Applicable to Purchases and Other Transactions",
		paragraphs: [
			"Pricing, taxes, shipping, delivery, cancellation, and refund terms are presented at checkout or in a related transaction agreement.",
			"Separate product or service terms may also apply.",
		],
	},
	{
		title: "9. Ownership and License",
		paragraphs: [
			"3AM and its licensors retain ownership of all software, designs, trademarks, media, and content in the service.",
			"We grant you a limited, non-exclusive, revocable license to use the service for personal, non-commercial use unless otherwise stated.",
		],
	},
	{
		title: "10. Restrictions on Use",
		paragraphs: [
			"You may not reverse engineer, scrape, automate abuse, distribute malware, bypass security controls, or use the service in a way that violates law or third-party rights.",
		],
	},
	{
		title: "11. Third Party Content and Services",
		paragraphs: [
			"The service may include links or integrations with third-party websites or services. We do not control or guarantee third-party offerings.",
		],
	},
	{
		title: "12. App Terms",
		paragraphs: [
			"If you use a mobile app, your app store provider may also impose terms. You remain responsible for compliance with those terms.",
		],
	},
	{
		title: "13. Additional Terms",
		paragraphs: [
			"Certain features, campaigns, subscriptions, or products may have additional terms. Where there is a conflict, feature-specific terms control for that feature.",
		],
	},
	{
		title: "14. Feedback",
		paragraphs: [
			"If you send feedback or suggestions, you grant 3AM a worldwide, royalty-free right to use and incorporate that feedback without obligation to you.",
		],
	},
	{
		title: "15. Digital Millennium Copyright Act",
		paragraphs: [
			"We respond to valid copyright complaints and may remove or disable allegedly infringing content in accordance with applicable law.",
		],
	},
	{
		title: "16. User Indemnity",
		paragraphs: [
			"You agree to defend and indemnify 3AM and its affiliates from claims, losses, liabilities, and expenses arising from your misuse of the service or violation of these Terms.",
		],
	},
	{
		title: "17. DISCLAIMER OF WARRANTIES",
		paragraphs: [
			"THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, TO THE MAXIMUM EXTENT PERMITTED BY LAW.",
		],
	},
	{
		title: "18. LIMITATION OF LIABILITY",
		paragraphs: [
			"TO THE MAXIMUM EXTENT PERMITTED BY LAW, 3AM IS NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR GOODWILL.",
		],
	},
	{
		title: "19. Governing Law",
		paragraphs: [
			"These Terms are governed by applicable law in the jurisdiction selected by 3AM, unless mandatory consumer law requires otherwise.",
		],
	},
	{
		title: "20. Miscellaneous",
		paragraphs: [
			"If any part of these Terms is unenforceable, the remainder stays in effect. Our failure to enforce a provision is not a waiver.",
			"We may assign these Terms in connection with a merger, acquisition, or sale of assets.",
		],
	},
	{
		title: "21. Contact Us",
		paragraphs: [
			"For questions about these Terms, contact us at legal@3am.com.",
		],
	},
];

export class TermsPage extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "legal-page"] });
	}

	render(): DocumentFragment {
		return html`
			<div class="legal-page__shell">
				<h1 class="legal-page__title">Terms</h1>
				<div class="legal-page__body">
					<p><strong>Effective Date:</strong> February 28, 2026</p>
					${termsSections.map(
						(section) => html`
							<section class="legal-page__section">
								<h2>${section.title}</h2>
								${section.paragraphs.map((paragraph) => html`<p>${paragraph}</p>`)}
							</section>
						`,
					)}
				</div>
			</div>
		`;
	}
}
