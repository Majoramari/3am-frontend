import { FaqGrid, type FaqGridItem } from "@components/faqGrid";
import { InputField } from "@components/inputField";
import { LazyImage } from "@components/lazyImage";
import { View } from "@lib/view";

type DemoDriveVehicle = {
	id: string;
	name: string;
	description: string;
	imageSrc: string;
	imageAlt: string;
};

type DemoDriveLocation = {
	id: string;
	label: string;
	latitude: number;
	longitude: number;
};

type DemoDriveExpectation = {
	label: string;
};

const demoDriveVehicles: ReadonlyArray<DemoDriveVehicle> = [
	{
		id: "dusk",
		name: "DUSK",
		description: "All-electric coupe with bold performance and daily comfort.",
		imageSrc: "/assets/cars/dusk/profile/white.webp",
		imageAlt: "Dusk in profile",
	},
	{
		id: "dawn",
		name: "DAWN",
		description: "All-electric coupe crafted for smooth and confident drives.",
		imageSrc: "/assets/cars/dawn/profile/white.webp",
		imageAlt: "Dawn in profile",
	},
];

const demoDriveLocations: ReadonlyArray<DemoDriveLocation> = [
	{
		id: "cairo-center",
		label: "3AM Cairo Drive Center - New Cairo, Egypt",
		latitude: 30.04442,
		longitude: 31.235712,
	},
	{
		id: "alexandria-center",
		label: "3AM Alexandria Studio - Alexandria, Egypt",
		latitude: 31.200092,
		longitude: 29.918739,
	},
	{
		id: "port-said-center",
		label: "3AM Port Said Hub - Port Said, Egypt",
		latitude: 31.265289,
		longitude: 32.301865,
	},
];

const demoDriveTimeSlots = [
	"9:00 AM",
	"10:30 AM",
	"12:00 PM",
	"2:30 PM",
	"4:00 PM",
	"6:30 PM",
];

const expectations: ReadonlyArray<DemoDriveExpectation> = [
	{ label: "Check in with our team" },
	{ label: "Get a guided vehicle tour" },
	{ label: "Head out for a drive" },
	{ label: "See how charging works" },
];

const faqItems: ReadonlyArray<FaqGridItem> = [
	{
		question: "What can I expect during a demo drive?",
		answer:
			"Your specialist will walk you through core features, then guide you on a local drive route.",
	},
	{
		question: "Can I bring a guest to my demo drive?",
		answer:
			"Yes, you can bring one guest. They must wear a seat belt during the drive.",
	},
	{
		question: "Can I reschedule my demo drive reservation?",
		answer:
			"Yes. Open your confirmation email and use the reschedule link anytime before your slot.",
	},
	{
		question: "Can I bring my dog?",
		answer:
			"Service animals are welcome. For other pets, please check with your location first.",
	},
	{
		question: "Can my car transform into a giant robot?",
		answer: "Maybe...",
	},
	{
		question: "When can I demo drive future models?",
		answer:
			"Timing varies by market. Subscribe for updates and we will notify you when reservations open.",
	},
];

const DEFAULT_ZIP_PREVIEW = "11511";

const formatLocalIsoDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const normalizeZip = (value: string): string => value.replace(/\D/g, "").slice(0, 5);

const resolveRequestedVehicleId = (): DemoDriveVehicle["id"] | null => {
	if (typeof window === "undefined") {
		return null;
	}

	const requestedVehicle = new URLSearchParams(window.location.search)
		.get("vehicle")
		?.trim()
		.toLowerCase();
	if (!requestedVehicle) {
		return null;
	}

	return demoDriveVehicles.some((vehicle) => vehicle.id === requestedVehicle)
		? (requestedVehicle as DemoDriveVehicle["id"])
		: null;
};

const toMapEmbedSrc = (latitude: number, longitude: number): string => {
	const delta = 0.28;
	const left = (longitude - delta).toFixed(6);
	const bottom = (latitude - delta).toFixed(6);
	const right = (longitude + delta).toFixed(6);
	const top = (latitude + delta).toFixed(6);
	const markerLat = latitude.toFixed(6);
	const markerLng = longitude.toFixed(6);

	return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${markerLat}%2C${markerLng}`;
};

const findLocationById = (
	locationId: string | null | undefined,
): DemoDriveLocation => {
	return (
		demoDriveLocations.find((location) => location.id === locationId) ??
		demoDriveLocations[0]
	);
};

export class DemoDriveBookingSection extends View<"section"> {
	constructor() {
		super("section", {
			className: ["page-section", "demo-drive-booking"],
			dataset: { gaSection: "demo-drive-booking" },
		});
	}

	protected override onMount(): void {
		const form = this.$<HTMLFormElement>("[data-demo-drive-form]");
		const zipInput = this.$<HTMLInputElement>("[data-demo-drive-zip]");
		const zipPreview = this.$<HTMLElement>("[data-demo-drive-zip-preview]");
		const dateInput = this.$<HTMLInputElement>("[data-demo-drive-date]");
		const submitButton = this.$<HTMLButtonElement>("[data-demo-drive-submit]");
		const feedback = this.$<HTMLElement>("[data-demo-drive-feedback]");
		const locationSelect = this.$<HTMLSelectElement>("[data-demo-drive-location]");
		const mapFrame = this.$<HTMLIFrameElement>("[data-demo-drive-map]");
		const mapLocationLabel = this.$<HTMLElement>("[data-demo-drive-map-location]");

		const requestedVehicleId = resolveRequestedVehicleId();
		if (requestedVehicleId) {
			const vehicleInput = form.querySelector<HTMLInputElement>(
				`input[name="vehicle"][value="${requestedVehicleId}"]`,
			);
			if (vehicleInput) {
				vehicleInput.checked = true;
			}
		}

		dateInput.min = formatLocalIsoDate(new Date());

		const syncZipPreview = (): void => {
			const normalized = normalizeZip(zipInput.value);
			if (zipInput.value !== normalized) {
				zipInput.value = normalized;
			}
			zipPreview.textContent = normalized || DEFAULT_ZIP_PREVIEW;
		};

		const syncMapLocation = (): void => {
			const selectedLocation = findLocationById(locationSelect.value);
			mapFrame.src = toMapEmbedSrc(
				selectedLocation.latitude,
				selectedLocation.longitude,
			);
			mapLocationLabel.textContent = selectedLocation.label;
		};

		const syncSubmitState = (): void => {
			submitButton.disabled = !form.checkValidity();
		};

		const clearFeedback = (): void => {
			if (!feedback.hasAttribute("data-state")) {
				return;
			}
			feedback.textContent = "";
			feedback.removeAttribute("data-state");
		};

		const syncFormUi = (): void => {
			syncZipPreview();
			syncMapLocation();
			syncSubmitState();
			clearFeedback();
		};

		syncFormUi();
		this.cleanup.on(form, "input", syncFormUi);
		this.cleanup.on(form, "change", syncFormUi);

		this.cleanup.on(form, "submit", (event) => {
			event.preventDefault();

			if (!form.checkValidity()) {
				feedback.textContent = "Please complete all required fields.";
				feedback.setAttribute("data-state", "error");
				form.reportValidity();
				syncSubmitState();
				return;
			}

			const formData = new FormData(form);
			const firstName = String(formData.get("firstName") ?? "").trim();
			const date = String(formData.get("date") ?? "");
			const time = String(formData.get("timeSlot") ?? "");
			const vehicleId = String(formData.get("vehicle") ?? "");
			const selectedLocation = findLocationById(String(formData.get("location")));
			const vehicleLabel =
				demoDriveVehicles.find((vehicle) => vehicle.id === vehicleId)?.name ??
				"DUSK";

			feedback.textContent = `Thanks ${firstName}. Your ${vehicleLabel} demo drive is requested for ${date} at ${time} (${selectedLocation.label}).`;
			feedback.setAttribute("data-state", "success");
		});
	}

	render(): DocumentFragment {
		const defaultLocation = demoDriveLocations[0];

		return this.tpl`
			<div class="demo-drive-book">
				<form class="demo-drive-form" data-demo-drive-form novalidate>
					<section class="demo-drive-section demo-drive-section--vehicle">
						<h1 class="demo-drive-title">Pick your vehicle</h1>
						<div class="demo-drive-vehicle-grid">
							${demoDriveVehicles.map((vehicle, index) =>
								this.renderVehicleCard(vehicle, index === 0),
							)}
						</div>
					</section>

					<section class="demo-drive-section demo-drive-section--details">
						<h2 class="demo-drive-title">Add your details to get started</h2>
						<p class="demo-drive-copy">
							We'll use your information as described in our
							<a href="/privacy">Data Privacy Notice</a>.
						</p>

						<div class="demo-drive-fields">
							${new InputField({
								label: "First name",
								name: "firstName",
								type: "text",
								className: "demo-drive-input-field demo-drive-input-field--half",
								inputClassName: "demo-drive-input",
								placeholder: "First Name *",
								attrs: {
									required: true,
									autocomplete: "given-name",
								},
							})}
							${new InputField({
								label: "Last name",
								name: "lastName",
								type: "text",
								className: "demo-drive-input-field demo-drive-input-field--half",
								inputClassName: "demo-drive-input",
								placeholder: "Last name *",
								attrs: {
									required: true,
									autocomplete: "family-name",
								},
							})}
							${new InputField({
								label: "Email",
								name: "email",
								type: "email",
								className: "demo-drive-input-field demo-drive-input-field--full",
								inputClassName: "demo-drive-input",
								placeholder: "Email *",
								attrs: {
									required: true,
									autocomplete: "email",
									inputmode: "email",
								},
							})}
							${new InputField({
								label: "Phone number",
								name: "phone",
								type: "tel",
								className: "demo-drive-input-field demo-drive-input-field--full",
								inputClassName: "demo-drive-input",
								placeholder: "Phone number *",
								attrs: {
									required: true,
									autocomplete: "tel",
								},
							})}
							${new InputField({
								label: "Zip code",
								name: "zip",
								type: "text",
								className: "demo-drive-input-field demo-drive-input-field--full",
								inputClassName: "demo-drive-input",
								placeholder: "Zip code *",
								attrs: {
									required: true,
									inputmode: "numeric",
									pattern: "[0-9]{4,5}",
									autocomplete: "postal-code",
									title: "Enter a 4 or 5 digit ZIP code",
								},
								dataset: { demoDriveZip: true },
							})}
						</div>
					</section>

					<section class="demo-drive-section demo-drive-section--location">
						<h2 class="demo-drive-title">Choose a location</h2>
						<p class="demo-drive-copy">
							Locations near
							<strong data-demo-drive-zip-preview>${DEFAULT_ZIP_PREVIEW}</strong>
						</p>

						<div class="demo-drive-location-layout">
								<div class="demo-drive-location-copy">
									<h3 class="demo-drive-subtitle">Choose your preferred center</h3>
									<p class="demo-drive-copy">
										Select any available 3AM location in Egypt that works best for your demo drive.
									</p>
								<label class="demo-drive-control-field">
									<span class="demo-drive-control-label">Available locations</span>
									<select
										class="demo-drive-control"
										name="location"
										data-demo-drive-location
										required
									>
										${demoDriveLocations.map((location, index) =>
											this.tpl`
												<option
													value="${location.id}"
													${index === 0 ? "selected" : ""}
												>
													${location.label}
												</option>
											`,
										)}
									</select>
								</label>
							</div>

								<div class="demo-drive-map-card">
									<iframe
										class="demo-drive-map-frame"
										data-demo-drive-map
										src="${toMapEmbedSrc(
										defaultLocation.latitude,
										defaultLocation.longitude,
									)}"
									title="Interactive map for demo drive locations"
										loading="lazy"
										referrerpolicy="no-referrer-when-downgrade"
									></iframe>
								</div>
							</div>
							<p class="demo-drive-map-location" data-demo-drive-map-location>
								${defaultLocation.label}
						</p>
					</section>

					<section class="demo-drive-section demo-drive-section--schedule">
						<h2 class="demo-drive-title">Choose a date and time</h2>
						<p class="demo-drive-copy">
							Need help booking or have questions about the demo drive experience?
							<a href="/legal">Learn more in the Support Center</a>
							, or reach us directly via chat at (888) 748-4261.
						</p>

						<div class="demo-drive-schedule-fields">
							<label class="demo-drive-control-field">
								<span class="demo-drive-control-label">Date</span>
								<input
									class="demo-drive-control"
									data-demo-drive-date
									type="date"
									name="date"
									required
								/>
							</label>
							<label class="demo-drive-control-field">
								<span class="demo-drive-control-label">Time</span>
								<select class="demo-drive-control" name="timeSlot" required>
									<option value="" selected disabled>Select time</option>
									${demoDriveTimeSlots.map(
										(timeSlot) =>
											this.tpl`<option value="${timeSlot}">${timeSlot}</option>`,
									)}
								</select>
							</label>
						</div>
					</section>

					<section class="demo-drive-section demo-drive-section--complete">
						<h2 class="demo-drive-title">Complete your booking</h2>
						<p class="demo-drive-copy">
							By clicking "Finish booking", I authorize 3AM to contact me at the phone number provided
							about my demo drive and to share more information about products, news, and events.
						</p>
						<p class="demo-drive-copy">
							By clicking "Finish booking", I agree to the
							<a href="/terms">3AM Terms of Use</a>
							and acknowledge the
							<a href="/privacy">Data Privacy Notice</a>.
						</p>
						<button
							class="demo-drive-submit"
							type="submit"
							data-demo-drive-submit
							disabled
						>
							Finish booking
						</button>
						<p class="demo-drive-feedback" data-demo-drive-feedback aria-live="polite"></p>
					</section>
				</form>

				<section class="demo-drive-section demo-drive-section--expect">
					<div class="demo-drive-expect-layout">
						<div class="demo-drive-expect-copy">
							<h2 class="demo-drive-title demo-drive-title--expect">Get excited for your drive</h2>
							<h3 class="demo-drive-subtitle">What to expect</h3>
							<ul class="demo-drive-expect-list">
								${expectations.map((expectation) =>
									this.tpl`
										<li class="demo-drive-expect-item">
											<span class="demo-drive-expect-icon" aria-hidden="true"></span>
											<span>${expectation.label}</span>
										</li>
									`,
								)}
							</ul>
						</div>
						<div class="demo-drive-expect-media">
							${new LazyImage({
								src: "/assets/demo-drive/expect-drive.png",
								alt: "Team preparing a demo drive vehicle indoors",
								className: "demo-drive-expect-image",
							})}
						</div>
					</div>
				</section>

				${new FaqGrid({
					title: "Frequently asked questions",
					items: faqItems,
					columns: 2,
					className: "demo-drive-faq",
				})}
			</div>
		`;
	}

	private renderVehicleCard(
		vehicle: DemoDriveVehicle,
		checked: boolean,
	): DocumentFragment {
		return this.tpl`
			<label class="demo-drive-vehicle">
				<input
					class="demo-drive-vehicle__input"
					type="radio"
					name="vehicle"
					value="${vehicle.id}"
					${checked ? "checked" : ""}
					required
				/>
				<span class="demo-drive-vehicle__card">
					<span class="demo-drive-vehicle__media">
						${new LazyImage({
							src: vehicle.imageSrc,
							alt: vehicle.imageAlt,
							className: "demo-drive-vehicle__image",
						})}
					</span>
					<span class="demo-drive-vehicle__meta">
						<span class="demo-drive-vehicle__name">${vehicle.name}</span>
						<span class="demo-drive-vehicle__description">${vehicle.description}</span>
					</span>
				</span>
			</label>
		`;
	}
}
