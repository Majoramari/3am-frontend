import { View } from "@lib/view";
import { html } from "@lib/template";
declare const google: any;
export class GooglePayButton extends View<"div"> {
    private paymentsClient: any = null;
    private totalPrice: string;

    constructor(totalPrice: string) {
        super("div", { className: "gpay-button-container" });
        this.totalPrice = totalPrice;
    }

    private getPaymentsClient() {
        if (!this.paymentsClient) {
            this.paymentsClient = new google.payments.api.PaymentsClient({
                environment: 'TEST'
            });
        }
        return this.paymentsClient;
    }

    private async checkReadiness() {
        const isReadyToPayRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
                type: 'CARD',
                parameters: {
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                    allowedCardNetworks: ['VISA', 'MASTERCARD']
                }
            }]
        };

        try {
            const response = await this.getPaymentsClient().isReadyToPay(isReadyToPayRequest);
            if (response.result) {
                this.renderButton();
            }
        } catch (err) {
            console.error("Google Pay Readiness Error:", err);
        }
    }

    private renderButton() {
        this.element.innerHTML = '';
        const button = this.getPaymentsClient().createButton({
            onClick: () => this.handlePayment(),
            buttonColor: 'black',
            buttonType: 'buy',
            buttonSizeMode: 'fill'
        });
        this.element.appendChild(button);
    }

    private async handlePayment() {
        const paymentDataRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
                type: 'CARD',
                parameters: {
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                    allowedCardNetworks: ['VISA', 'MASTERCARD']
                },
                tokenizationSpecification: {
                    type: 'DIRECT',
                    parameters: { protocolVersion: 'ECv2', publicKey: 'BCf...' }
                }
            }],
            transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: this.totalPrice,
                currencyCode: 'USD',
                countryCode: 'US'
            },
            merchantInfo: {
                merchantName: '3AM Store'
            }
        };

        try {
            const paymentData = await this.getPaymentsClient().loadPaymentData(paymentDataRequest);
            console.log("Payment Success:", paymentData);
        } catch (err) {
            console.error("Payment Error:", err);
        }
    }

    render(): DocumentFragment {
        setTimeout(() => {
            if (typeof google !== 'undefined') {
                this.checkReadiness();
            } else {
                console.error("Google Pay script not loaded. Add it to index.html");
            }
        }, 500);

        return html``;
    }
}
