import { Button } from "@components/button";
import { InputField } from "@components/inputField";
import { authApi } from "@lib/api";
import { authStore } from "@lib/authStore";
import { getRouter } from "@lib/router";
import { emitToast } from "@lib/toastBus";
import { View } from "@lib/view";

type AuthStep = "email" | "otp" | "register";
const RESEND_COOLDOWN_MS = 60_000;
const PHONE_MIN_LENGTH = 8;
const PHONE_MAX_LENGTH = 11;

export class AuthPage extends View<"section"> {
	private currentStep: AuthStep = "email";
	private email = "";
	private emailField!: HTMLInputElement;
	private nameField!: HTMLInputElement;
	private phoneField!: HTMLInputElement;
	private otpField!: HTMLInputElement;
	private emailFeedback!: HTMLElement;
	private otpFeedback!: HTMLElement;
	private registerFeedback!: HTMLElement;
	private resendButton: HTMLButtonElement | null = null;
	private resendCooldownEndsAt = 0;
	private resendCooldownIntervalId: number | null = null;

	constructor() {
		super("section", { className: ["page-section", "auth-page"] });
	}

	protected override onMount(): void {
		this.bindFormHandlers();
		this.updateStepVisibility();
	}

	protected override onDestroy(): void {
		this.stopResendCooldownTicker();
	}

	private bindFormHandlers(): void {
		const form =
			this.element.querySelector<HTMLFormElement>("[data-email-form]");
		const emailField =
			form?.querySelector<HTMLInputElement>("[data-auth-email]");
		const emailFeedback = this.element.querySelector<HTMLElement>(
			"[data-auth-feedback]",
		);
		const otpFeedback = this.element.querySelector<HTMLElement>(
			"[data-otp-feedback]",
		);
		const registerFeedback = this.element.querySelector<HTMLElement>(
			"[data-register-feedback]",
		);

		if (
			!form ||
			!emailField ||
			!emailFeedback ||
			!otpFeedback ||
			!registerFeedback
		) {
			return;
		}

		this.emailField = emailField;
		this.emailFeedback = emailFeedback;
		this.otpFeedback = otpFeedback;
		this.registerFeedback = registerFeedback;

		this.cleanup.on(emailField, "input", () => this.clearError());

		this.cleanup.on(form, "submit", async (event) => {
			event.preventDefault();
			await this.handleEmailSubmit();
		});

		// OTP form
		const otpForm =
			this.element.querySelector<HTMLFormElement>("[data-otp-form]");
		const otpField =
			otpForm?.querySelector<HTMLInputElement>("[data-auth-otp]");
		const resendBtn =
			otpForm?.querySelector<HTMLButtonElement>("[data-auth-resend]");
		const backBtn =
			otpForm?.querySelector<HTMLButtonElement>("[data-auth-back]");

		if (otpField) {
			this.otpField = otpField;
			this.cleanup.on(otpField, "input", () => this.clearError());
		}

		if (otpForm) {
			this.cleanup.on(otpForm, "submit", async (event) => {
				event.preventDefault();
				await this.handleOtpSubmit();
			});
		}

		if (resendBtn) {
			this.resendButton = resendBtn;
			this.updateResendButtonState();
			this.cleanup.on(resendBtn, "click", async () => {
				await this.handleResendOtp();
			});
		}

		if (backBtn) {
			this.cleanup.on(backBtn, "click", () => {
				this.currentStep = "email";
				this.updateStepVisibility();
			});
		}

		// Register form
		const registerForm = this.element.querySelector<HTMLFormElement>(
			"[data-register-form]",
		);
		const nameField =
			registerForm?.querySelector<HTMLInputElement>("[data-auth-name]");
		const phoneField =
			registerForm?.querySelector<HTMLInputElement>("[data-auth-phone]");
		const registerBackBtn =
			registerForm?.querySelector<HTMLButtonElement>("[data-auth-back]");

		if (nameField) this.nameField = nameField;
		if (phoneField) {
			this.phoneField = phoneField;
			this.cleanup.on(phoneField, "input", () => {
				const normalizedPhone = this.normalizePhone(phoneField.value);
				if (phoneField.value !== normalizedPhone) {
					phoneField.value = normalizedPhone;
				}
				this.clearError();
			});
		}

		if (registerForm) {
			this.cleanup.on(registerForm, "submit", async (event) => {
				event.preventDefault();
				await this.handleRegisterSubmit();
			});
		}

		if (registerBackBtn) {
			this.cleanup.on(registerBackBtn, "click", () => {
				this.currentStep = "email";
				this.updateStepVisibility();
			});
		}
	}

	private clearFeedback(): void {
		for (const feedback of [
			this.emailFeedback,
			this.otpFeedback,
			this.registerFeedback,
		]) {
			if (!feedback) {
				continue;
			}
			feedback.textContent = "";
			feedback.removeAttribute("data-state");
		}
	}

	private isMissingAccountError(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}
		const message = error.message.toLowerCase();
		return (
			message.includes("email not found") ||
			message.includes("user not found") ||
			message.includes("not found") ||
			message.includes("404")
		);
	}

	private updateEmailDisplays(): void {
		const otpEmailDisplay = this.element.querySelector<HTMLElement>(
			".auth-email-display",
		);
		const registerEmailDisplay = this.element.querySelector<HTMLElement>(
			".auth-register-email-display",
		);
		if (otpEmailDisplay) {
			otpEmailDisplay.textContent = this.email;
		}
		if (registerEmailDisplay) {
			registerEmailDisplay.textContent = this.email;
		}
	}

	private clearError(): void {
		this.emailField?.removeAttribute("aria-invalid");
		this.otpField?.removeAttribute("aria-invalid");
		this.nameField?.removeAttribute("aria-invalid");
		this.phoneField?.removeAttribute("aria-invalid");
		this.clearFeedback();
	}

	private getFeedbackElement(step: AuthStep): HTMLElement | null {
		switch (step) {
			case "otp":
				return this.otpFeedback ?? null;
			case "register":
				return this.registerFeedback ?? null;
			default:
				return this.emailFeedback ?? null;
		}
	}

	private setError(message: string, step: AuthStep = this.currentStep): void {
		this.clearFeedback();
		const feedback = this.getFeedbackElement(step);
		if (!feedback) {
			return;
		}
		feedback.textContent = message;
		feedback.setAttribute("data-state", "error");
	}

	private setSuccess(message: string, step: AuthStep = this.currentStep): void {
		this.clearFeedback();
		const feedback = this.getFeedbackElement(step);
		if (!feedback) {
			return;
		}
		feedback.textContent = message;
		feedback.setAttribute("data-state", "success");
	}

	private async handleEmailSubmit(): Promise<void> {
		const email = this.emailField.value.trim();
		this.emailField.value = email;

		if (!this.emailField.checkValidity()) {
			this.emailField.setAttribute("aria-invalid", "true");
			this.setError("Enter a valid email address.");
			return;
		}

		this.emailField.removeAttribute("aria-invalid");

		try {
			await authApi.requestOtp({ email });
			this.email = email;
			this.currentStep = "otp";
			this.startResendCooldown();
			this.updateEmailDisplays();
			this.updateStepVisibility();
		} catch (error) {
			if (this.isMissingAccountError(error)) {
				this.email = email;
				this.currentStep = "register";
				this.updateEmailDisplays();
				this.updateStepVisibility();
				this.setSuccess(
					"No account found for this email. Complete your details to create one.",
					"register",
				);
				return;
			}

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.setError(
				`Failed to send verification code: ${errorMessage}`,
				"email",
			);
		}
	}

	private async handleOtpSubmit(): Promise<void> {
		const otpCode = this.otpField.value.trim();

		if (!otpCode || otpCode.length !== 6) {
			this.otpField.setAttribute("aria-invalid", "true");
			this.setError("Enter a valid 6-digit code.");
			return;
		}

		try {
			await authStore.verifyOtp(this.email, otpCode);
			const router = getRouter();
			router.navigate("/");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Invalid code";
			this.setError(message);
			emitToast({
				level: "error",
				title: "Verification failed",
				message,
			});
		}
	}

	private async handleResendOtp(): Promise<void> {
		const remainingMs = this.getResendCooldownRemainingMs();
		if (remainingMs > 0) {
			const remainingSeconds = Math.ceil(remainingMs / 1000);
			this.setError(
				`Please wait ${remainingSeconds}s before requesting another code.`,
			);
			this.updateResendButtonState();
			return;
		}

		try {
			await authApi.requestOtp({ email: this.email });
			this.setSuccess("New code sent!");
			this.startResendCooldown();
		} catch (error) {
			this.setError(
				error instanceof Error ? error.message : "Failed to resend",
			);
		}
	}

	private async handleRegisterSubmit(): Promise<void> {
		const name = this.nameField.value.trim();
		const email = this.email.trim();
		const phone = this.normalizePhone(this.phoneField.value.trim());

		this.nameField.value = name;
		this.emailField.value = email;
		this.phoneField.value = phone;

		let isValid = true;

		if (!name || name.length < 2) {
			this.nameField.setAttribute("aria-invalid", "true");
			this.setError("Please enter your full name.");
			isValid = false;
		}

		if (!email || !this.emailField.checkValidity()) {
			this.currentStep = "email";
			this.updateStepVisibility();
			this.emailField.setAttribute("aria-invalid", "true");
			this.setError("Enter a valid email address.", "email");
			isValid = false;
		}

		if (
			!phone ||
			phone.length < PHONE_MIN_LENGTH ||
			phone.length > PHONE_MAX_LENGTH
		) {
			this.phoneField.setAttribute("aria-invalid", "true");
			if (isValid) {
				this.setError(
					`Phone number must be ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits.`,
				);
			}
			isValid = false;
		}

		if (!isValid) {
			return;
		}

		try {
			await authApi.register({ name, email, phone });
			await authApi.requestOtp({ email });
			this.email = email;
			this.currentStep = "otp";
			this.startResendCooldown();
			this.updateEmailDisplays();
			this.updateStepVisibility();
		} catch (error) {
			this.setError(
				error instanceof Error
					? error.message
					: "Registration failed. Email may already be in use.",
			);
		}
	}

	private normalizePhone(value: string): string {
		return value.replace(/\D/g, "").slice(0, PHONE_MAX_LENGTH);
	}

	private updateStepVisibility(): void {
		const emailStep =
			this.element.querySelector<HTMLElement>("[data-step-email]");
		const otpStep = this.element.querySelector<HTMLElement>("[data-step-otp]");
		const registerStep = this.element.querySelector<HTMLElement>(
			"[data-step-register]",
		);

		emailStep?.style.setProperty(
			"display",
			this.currentStep === "email" ? "block" : "none",
		);
		otpStep?.style.setProperty(
			"display",
			this.currentStep === "otp" ? "block" : "none",
		);
		registerStep?.style.setProperty(
			"display",
			this.currentStep === "register" ? "block" : "none",
		);
		this.updateEmailDisplays();
		this.updateResendButtonState();
	}

	private startResendCooldown(): void {
		this.resendCooldownEndsAt = Date.now() + RESEND_COOLDOWN_MS;
		this.updateResendButtonState();
		this.startResendCooldownTicker();
	}

	private getResendCooldownRemainingMs(): number {
		return Math.max(0, this.resendCooldownEndsAt - Date.now());
	}

	private startResendCooldownTicker(): void {
		if (this.resendCooldownIntervalId !== null) {
			return;
		}

		this.resendCooldownIntervalId = window.setInterval(() => {
			this.updateResendButtonState();
			if (this.getResendCooldownRemainingMs() <= 0) {
				this.stopResendCooldownTicker();
			}
		}, 1000);
	}

	private stopResendCooldownTicker(): void {
		if (this.resendCooldownIntervalId === null) {
			return;
		}

		window.clearInterval(this.resendCooldownIntervalId);
		this.resendCooldownIntervalId = null;
	}

	private updateResendButtonState(): void {
		const resendButton = this.resendButton;
		if (!resendButton) {
			return;
		}

		const label = resendButton.querySelector<HTMLElement>(".ui-button__label");
		const remainingMs = this.getResendCooldownRemainingMs();
		if (remainingMs <= 0) {
			resendButton.disabled = false;
			if (label) {
				label.textContent = "Resend Code";
			}
			return;
		}

		const remainingSeconds = Math.ceil(remainingMs / 1000);
		resendButton.disabled = true;
		if (label) {
			label.textContent = `Resend in ${remainingSeconds}s`;
		}
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="auth-layout">
				<div class="auth-panel">
					<!-- Email Step -->
					<div data-step-email class="auth-step">
						<form class="auth-form" data-email-form novalidate>
							<h1 class="auth-title">Welcome</h1>
							<p class="auth-subtitle">I send this message to all Autobots taking refuge among the stars. We are here. We are waiting.</p>
							
							${new InputField({
								label: "Email",
								name: "email",
								type: "email",
								className: "auth-field",
								inputClassName: "auth-input",
								placeholder: "Email*",
								attrs: {
									inputmode: "email",
									autocomplete: "email",
									required: true,
								},
								dataset: { authEmail: true },
							})}
							
							${new Button({
								label: "Continue",
								as: "button",
								type: "submit",
								className: "auth-submit",
								variant: "cta",
							})}
							
							<p class="auth-legal">
								By continuing, I agree to 3AM's
								<a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.
							</p>
							
							<p class="auth-feedback" data-auth-feedback aria-live="polite"></p>
						</form>
					</div>

					<!-- OTP Step -->
					<div data-step-otp class="auth-step" style="display: none;">
						<form class="auth-form" data-otp-form novalidate>
							<h1 class="auth-title">Verification Code</h1>
							<p class="auth-info">We've sent a code to <span class="auth-email-display"></span></p>
							
							${new InputField({
								label: "OTP Code",
								name: "otp",
								type: "text",
								className: "auth-field",
								inputClassName: "auth-input",
								placeholder: "Enter 6-digit code*",
								attrs: {
									inputmode: "numeric",
									autocomplete: "one-time-code",
									required: true,
									maxlength: "6",
								},
								dataset: { authOtp: true },
							})}
							
							${new Button({
								label: "Sign In",
								as: "button",
								type: "submit",
								className: "auth-submit",
								variant: "cta",
							})}
							
							${new Button({
								label: "Resend Code",
								as: "button",
								type: "button",
								className: "auth-resend",
								variant: "text",
								dataset: { authResend: true },
							})}
							
							${new Button({
								label: "Back",
								as: "button",
								type: "button",
								className: "auth-back",
								variant: "text",
								dataset: { authBack: true },
							})}
							
							<p class="auth-feedback" data-otp-feedback aria-live="polite"></p>
						</form>
					</div>

					<!-- Register Step -->
					<div data-step-register class="auth-step" style="display: none;">
						<form class="auth-form" data-register-form novalidate>
							<h1 class="auth-title">Create Account</h1>
							<p class="auth-subtitle">
								No account found for <span class="auth-register-email-display"></span>.
								Complete your profile to continue.
							</p>
							
							${new InputField({
								label: "Full Name",
								name: "name",
								type: "text",
								className: "auth-field",
								inputClassName: "auth-input",
								placeholder: "Full Name*",
								attrs: {
									autocomplete: "name",
									required: true,
								},
								dataset: { authName: true },
							})}
							
							${new InputField({
								label: "Phone Number",
								name: "phone",
								type: "tel",
								className: "auth-field",
								inputClassName: "auth-input",
								placeholder: "Phone Number*",
								attrs: {
									inputmode: "numeric",
									autocomplete: "tel",
									required: true,
									maxlength: String(PHONE_MAX_LENGTH),
									pattern: "[0-9]*",
								},
								dataset: { authPhone: true },
							})}
							
							${new Button({
								label: "Create Account",
								as: "button",
								type: "submit",
								className: "auth-submit",
								variant: "cta",
							})}
							
							${new Button({
								label: "Back",
								as: "button",
								type: "button",
								className: "auth-back",
								variant: "text",
								dataset: { authBack: true },
							})}
							
							<p class="auth-legal">
								By registering, I agree to 3AM's
								<a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.
							</p>
							
							<p class="auth-feedback" data-register-feedback aria-live="polite"></p>
						</form>
					</div>
				</div>
			</div>
		`;
	}
}
