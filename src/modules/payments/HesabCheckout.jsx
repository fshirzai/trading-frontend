"use client";
import { afnMinorForUsd } from "./hesabpay.js";
import { useRef, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import { usePreferences } from "../../shared/i18n.jsx";
export default function HesabCheckout({ api, order, method }) {
  const { t } = usePreferences();
  const balance = (order.totalCents - order.paidCents) / 100;
  const [amount, setAmount] = useState(String(balance)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [confirmed, setConfirmed] = useState(false);
  const key = useRef(null);
  const h = method.hesabpay;
  const minor = afnMinorForUsd(amount, h.afnPerUsd);
  async function pay(e) {
    e.preventDefault();
    if (!confirmed) return;
    setError(null);
    setBusy(true);
    try {
      if (!key.current) key.current = crypto.randomUUID();
      const r = await api.request(
        "/orders/" + order._id + "/hesabpay-checkout",
        {
          method: "POST",
          headers: { "Idempotency-Key": key.current },
          body: {
            amount: Number(amount),
            expectedAccount: h.account,
            expectedAfnMinor: minor,
          },
        },
      );
      const url = new URL(r.url);
      if (
        url.protocol !== "https:" ||
        !(url.hostname === "hesab.com" || url.hostname.endsWith(".hesab.com"))
      )
        throw Error("Invalid payment destination");
      window.location.assign(url.href);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={pay} className="card-checkout panel">
      <h3>{t("Visa / card via HesabPay")}</h3>
      <p>{t("Enter your card details only on the secure hosted checkout.")}</p>
      <ErrorBox error={error} />
      <label>
        {t("Payment amount (USD)")}
        <input
          aria-label={t("Payment amount (USD)")}
          type="number"
          min="0.01"
          step="0.01"
          max={balance}
          required
          value={amount}
          disabled={busy}
          onChange={(e) => {
            setAmount(e.target.value);
            setConfirmed(false);
            key.current = null;
          }}
        />
      </label>
      <dl className="product-specs">
        <div>
          <dt>{t("Amount charged")}</dt>
          <dd dir="ltr">
            {Number.isFinite(minor) ? (minor / 100).toFixed(2) : "—"} AFN
          </dd>
        </div>
        <div>
          <dt>{t("Exchange rate")}</dt>
          <dd dir="ltr">1 USD = {h.afnPerUsd} AFN</dd>
        </div>
        <div>
          <dt>{t("Merchant")}</dt>
          <dd>
            {h.label} ·{" "}
            {h.environment === "sandbox"
              ? t("Test payment")
              : t("Live payment")}
          </dd>
        </div>
      </dl>
      <label className="cart-consent">
        <input
          type="checkbox"
          required
          checked={confirmed}
          disabled={busy}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        {t("I confirm the AFN charge shown above.")}
      </label>
      <Button
        type="submit"
        disabled={
          busy ||
          !confirmed ||
          !Number.isFinite(minor) ||
          minor < 4000 ||
          balance <= 0
        }
      >
        {t(busy ? "Opening secure checkout…" : "Continue to HesabPay")}
      </Button>
      <p className="muted">
        {t(
          "Returning from checkout does not confirm payment. Your order updates after a verified provider notification.",
        )}
      </p>
    </form>
  );
}
