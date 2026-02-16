
import { View } from "@lib/view";
import { html } from "@lib/template";
import { GooglePayButton } from "@components/google-pay";
export class CartPage extends View<"div"> {
    private cartData: any = null;

    constructor() {
        super("div", { className: "cart-page" });
        this.loadData();
    }
    async loadData() {
        try {
            const response = await fetch("https://api.3am-.com/cart"); 
            // ع حسب علي هيعمل شكل api ازاي هشوف شكل الداتا و اعدلها 
            this.cartData = await response.json();
            this.rerender();
        } catch (error) {
            console.error("Failed to load cart:", error);
            this.cartData = {
                carName: "Dodge Challenger SRT Demon",
                price: 84995.00,
                specs: "6.2L Supercharged V8 • 840 HP"
            };
            this.rerender();
        }
    }

    render(): DocumentFragment {
        if (!this.cartData) {
            return html`
                <div class="loading-screen">
                    <span class="brand-tag">3AM Cars</span>
                    <p>Fetching your selection...</p>
                </div>
            `;
        }

        const totalPrice = this.cartData.price.toLocaleString();
        return this.tpl`
            <div class="cart-wrapper">
                <header class="cart-header">
                    <span class="brand-tag">3AM EXCLUSIVE</span>
                    <h1>Your Selection</h1>
                </header>
                
                <section class="cart-content">
                    <div class="product-preview">
                        <div class="product-info">
                            <small>Automotive Icon</small>
                            <h2>${this.cartData.carName.split(' ')[0]} <br/> 
                                <span>${this.cartData.carName.split(' ').slice(1).join(' ')}</span>
                            </h2>
                            <p class="specs">${this.cartData.specs}</p>
                        </div>
                        <div class="product-price">
                            <span class="currency">$</span>
                            <span class="amount">${totalPrice}</span>
                        </div>
                    </div>

                    <div class="checkout-footer">
                        <div class="guarantee">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            Secure Encrypted Checkout
                        </div>
                        <div class="pay-button-wrapper">
                            ${new GooglePayButton(this.cartData.price.toString())}
                        </div>
                    </div>
                </section>
            </div>
        `;
    }
}