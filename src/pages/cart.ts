import { View } from "@lib/view";
import { GooglePayButton } from "@components/google-pay";

// Move demo value outside render() to avoid recreating it on every render
const TOTAL_PRICE = "84995.00";

export class CartPage extends View<"div"> {
  constructor() {
    super("div", { className: "cart-page" });
  }

  render(): DocumentFragment {
    const gPayButton = new GooglePayButton(TOTAL_PRICE);

    return this.tpl`
      <section class="cart-left">
        <h1>Shopping Cart</h1>
        <div class="cart-items">
          <div class="cart-item">
            <div class="item-info">
              <h3>Dodge Challenger SRT Demon</h3>
              <p>Color: Pitch Black</p>
            </div>
            <strong class="item-price">$84,995.00</strong>
          </div>
        </div>
      </section>

      <aside class="cart-summary">
        <h2>Order Summary</h2>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>$84,995.00</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span style="color: #4caf50;">FREE</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span>$${TOTAL_PRICE}</span>
        </div>
        <div class="google-pay-container">
          ${gPayButton}
          <p class="secure-text">
            Secure Encrypted Checkout using Google Pay
          </p>
        </div>
      </aside>
    `;
  }
}
//using google pay button component in cart page protocol 443