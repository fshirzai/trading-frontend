import test from "node:test";
import assert from "node:assert/strict";
import { cleanCart, addCartItem } from "../src/modules/public/cart.js";
import { storeTranslations } from "../src/shared/store-translations.js";
const id = "a".repeat(24);
test("cart sanitizes stored data and combines duplicate product additions", () => {
  assert.deepEqual(
    cleanCart([
      { product: id, quantity: 2, price: 1 },
      { product: "invalid", quantity: 3 },
      { product: id, quantity: 4 },
    ]),
    [{ product: id, quantity: 2 }],
  );
  assert.deepEqual(addCartItem([{ product: id, quantity: 2 }], id, 3), [
    { product: id, quantity: 5 },
  ]);
  assert.equal(cleanCart([{ product: id, quantity: -1 }]).length, 0);
});
test("public checkout and account terminology is translated in Pashto and Dari", () => {
  for (const lang of ["ps", "fa"])
    for (const key of [
      "Cart",
      "Orders",
      "Add to cart",
      "Terms & conditions",
      "Preferred payment method",
      "Visa / card via HesabPay",
      "Contact email",
      "Review your quotation",
      "Payment amount (USD)",
    ])
      assert.ok(
        storeTranslations[lang][key] && storeTranslations[lang][key] !== key,
      );
});
import { afnMinorForUsd } from "../src/modules/payments/hesabpay.js";
test("AFN conversion rounds integer minor units consistently", () => {
  assert.equal(afnMinorForUsd(100, 71), 710000);
  assert.equal(afnMinorForUsd(0.01, 70.5), 71);
  assert.equal(afnMinorForUsd(0.29, 78.123456), 2266);
  assert.ok(Number.isNaN(afnMinorForUsd("invalid", 70)));
});
