export const CART_KEY = "trade-cart-v1";
export function cleanCart(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .filter(
      (x) =>
        x &&
        /^[a-f\d]{24}$/.test(x.product) &&
        Number.isFinite(x.quantity) &&
        x.quantity > 0 &&
        x.quantity <= 1e6 &&
        Math.abs(x.quantity * 1000 - Math.round(x.quantity * 1000)) < 1e-6 &&
        !seen.has(x.product) &&
        seen.add(x.product),
    )
    .slice(0, 30)
    .map((x) => ({
      product: x.product,
      quantity: Math.round(x.quantity * 1000) / 1000,
    }));
}
export function addCartItem(items, id, quantity) {
  const clean = cleanCart(items);
  const found = clean.find((x) => x.product === id);
  if (!found && clean.length >= 30)
    throw Error("The cart supports up to 30 products.");
  return cleanCart(
    found
      ? clean.map((x) =>
          x.product === id
            ? {
                ...x,
                quantity: Math.round((x.quantity + quantity) * 1000) / 1000,
              }
            : x,
        )
      : [...clean, { product: id, quantity }],
  );
}
