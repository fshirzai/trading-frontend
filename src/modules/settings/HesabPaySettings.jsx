"use client";
import { useEffect, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import { usePreferences } from "../../shared/i18n.jsx";
export default function HesabPaySettings({ api }) {
  const { t } = usePreferences();
  const [saved, setSaved] = useState(null),
    [form, setForm] = useState({
      label: "",
      environment: "sandbox",
      afnPerUsd: "",
      apiKey: "",
      enabled: false,
      merchantApproved: false,
    }),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  function apply(s) {
    setSaved(s);
    setForm({
      label: s.label || "",
      environment: s.environment || "sandbox",
      afnPerUsd: s.afnPerUsd || "",
      apiKey: "",
      enabled: !!s.enabled,
      merchantApproved: !!s.merchantApproved,
    });
  }
  useEffect(() => {
    let live = true;
    api
      .request("/admin/settings/hesabpay")
      .then((s) => {
        if (live) apply(s);
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api]);
  async function save(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = {
        revision: saved.revision,
        label: form.label,
        environment: form.environment,
        afnPerUsd: Number(form.afnPerUsd),
        enabled: form.enabled,
        merchantApproved: form.merchantApproved,
        ...(form.apiKey ? { apiKey: form.apiKey } : {}),
      };
      const s = await api.request("/admin/settings/hesabpay", {
        method: "PUT",
        body,
      });
      apply(s);
      setMessage(
        t(
          "Payment settings saved. Register the callback URL in your merchant portal.",
        ),
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel profile-edit payment-admin">
      <span className="eyebrow">{t("PAYMENT CONFIGURATION")}</span>
      <h2>{t("HesabPay merchant account")}</h2>
      <p>
        {t(
          "Payments settle to the merchant account that owns the API key. A Visa card number cannot select the receiving account.",
        )}
      </p>
      <ErrorBox error={error} />
      {message && (
        <p className="success-note" role="status">
          {message}
        </p>
      )}
      <form onSubmit={save}>
        <div className="fields">
          <label>
            {t("Merchant account label")}
            <input
              aria-label={t("Merchant account label")}
              required
              maxLength={120}
              value={form.label}
              disabled={busy || !saved}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </label>
          <label>
            {t("Environment")}
            <select
              value={form.environment}
              disabled={busy || !saved}
              onChange={(e) =>
                setForm({ ...form, environment: e.target.value })
              }
            >
              <option value="sandbox">{t("Sandbox — test payments")}</option>
              <option value="production">
                {t("Production — real payments")}
              </option>
            </select>
          </label>
          <label>
            {t("Merchant API key")}
            <input
              type="password"
              autoComplete="new-password"
              required={!saved?.configured}
              minLength={16}
              maxLength={500}
              value={form.apiKey}
              disabled={busy || !saved}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
            <small>
              {t(
                "Leave blank to keep the current key. Stored encrypted; never shown again.",
              )}
            </small>
          </label>
          <label>
            {t("AFN for 1 USD")}
            <input
              type="number"
              required
              min="0.000001"
              max="10000"
              step="0.000001"
              value={form.afnPerUsd}
              disabled={busy || !saved}
              onChange={(e) => setForm({ ...form, afnPerUsd: e.target.value })}
            />
            <small>
              {t(
                "The customer reviews the converted AFN amount before checkout.",
              )}
            </small>
          </label>
        </div>
        <label className="cart-consent">
          <input
            type="checkbox"
            checked={form.merchantApproved}
            disabled={busy || !saved}
            onChange={(e) =>
              setForm({ ...form, merchantApproved: e.target.checked })
            }
          />
          {t(
            "This merchant account is approved for the selected environment and international card payments.",
          )}
        </label>
        <label className="cart-consent">
          <input
            type="checkbox"
            checked={form.enabled}
            disabled={busy || !saved}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          {t("Enable HesabPay checkout")}
        </label>
        <Button type="submit" disabled={busy || !saved}>
          {t("Save payment settings")}
        </Button>
      </form>
      {saved?.webhookPath && (
        <div className="notice">
          <b>{t("Webhook setup")}</b>
          <p>
            {t(
              "Register this full path on your backend HTTPS domain in HesabPay Developer → Webhooks. Enable payment success and failure events. Keep this URL private.",
            )}
          </p>
          <code className="callback-path" dir="ltr">
            {saved.webhookPath}
          </code>
          <p>
            {t(
              "Changing merchant credentials creates a new callback URL. Keep old callbacks registered while earlier payments are pending.",
            )}
          </p>
        </div>
      )}
      <p className="muted">
        {t(
          "TT remains available. Test a successful, failed and repeated payment in sandbox before switching to production. Refunds for HesabPay must be made through the merchant portal and recorded in the return workflow.",
        )}
      </p>
      <a
        href="https://developers-sandbox.hesab.com"
        target="_blank"
        rel="noreferrer"
      >
        {t("Open sandbox merchant portal")} ↗
      </a>
    </section>
  );
}
