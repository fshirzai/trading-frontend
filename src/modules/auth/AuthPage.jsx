"use client";
import { Localized } from "../../shared/i18n.jsx";
import { useEffect, useState } from "react";
import {
  Button,
  ErrorBox,
  Logo,
  PreferencesControls,
} from "../../shared/ui.jsx";
import { usePreferences } from "../../shared/i18n.jsx";
export default function AuthPage({ mode, api, onLogin, onNavigate }) {
  const { t } = usePreferences();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [message, setMessage] = useState(""),
    [token, setToken] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href);
    setToken(url.searchParams.get("token") || "");
    if (url.searchParams.has("token")) {
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, []);
  const titles = {
    login: "Sign in",
    register: "Create account",
    "forgot-password": "Reset your password",
    "reset-password": "Choose a new password",
    "verify-email": "Verify your email",
    "resend-verification": "Resend verification",
  };
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data.confirmPassword !== undefined) {
      if (data.password !== data.confirmPassword) {
        setError(Error("Passwords do not match"));
        setBusy(false);
        return;
      }
      delete data.confirmPassword;
    }
    if (["reset-password", "verify-email"].includes(mode)) data.token = token;
    if (!data.mfaCode) delete data.mfaCode;
    try {
      const r = await api.request("/auth/" + mode, {
        method: "POST",
        body: data,
      });
      if (mode === "login") {
        api.setToken(r.accessToken);
        onLogin(r.user);
      } else {
        setMessage(
          r?.message || "Completed successfully. You can now sign in.",
        );
        e.target.reset();
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Localized>
      <main className="auth-page">
        <aside className="auth-story">
          <Logo />
          <div>
            <span className="eyebrow">FROM ORIGIN TO OPPORTUNITY</span>
            <h1>
              Good trade begins
              <br />
              with trust.
            </h1>
            <p>
              A clear view of your products, payments, and deliveries. All in
              one place.
            </p>
            <div className="trust-line">
              <span>
                <b>01</b> Source with care
              </span>
              <span>
                <b>02</b> Agree with clarity
              </span>
              <span>
                <b>03</b> Deliver with confidence
              </span>
            </div>
          </div>
          <small>Agricultural trade · Border delivery · USD</small>
        </aside>
        <section className="auth-panel">
          <div className="auth-top">
            <Button className="subtle" onClick={() => onNavigate("home")}>
              {t("Home")}
            </Button>
            <PreferencesControls />
          </div>
          <div className="auth-card">
            <span className="eyebrow">YOUR TRADE, CONNECTED</span>
            <h2>{t(titles[mode] || "Sign in")}</h2>
            <p>
              {mode === "login"
                ? "Access your customer portal or staff workspace."
                : "Email links expire after five minutes."}
            </p>
            <form onSubmit={submit}>
              {mode === "register" && (
                <label>
                  {t("Full name")}
                  <input
                    name="name"
                    required
                    maxLength={200}
                    autoComplete="name"
                  />
                </label>
              )}
              {!["reset-password", "verify-email"].includes(mode) && (
                <label>
                  {t("Email")}
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    dir="ltr"
                  />
                </label>
              )}
              {["register", "login", "reset-password"].includes(mode) && (
                <label>
                  {t("Password")}
                  <input
                    name="password"
                    aria-label={t("Password")}
                    type="password"
                    required
                    minLength={mode === "login" ? 1 : 12}
                    maxLength={mode === "login" ? 256 : 128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  {mode !== "login" && (
                    <small>Use a unique password of 12–128 characters.</small>
                  )}
                </label>
              )}
              {["register", "reset-password"].includes(mode) && (
                <label>
                  {t("Confirm password")}
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </label>
              )}
              {mode === "register" && (
                <label>
                  {t("Country")}
                  <input
                    name="country"
                    autoComplete="country-name"
                    maxLength={200}
                  />
                </label>
              )}
              {mode === "login" && (
                <>
                  <label>
                    Authenticator or recovery code <small>(if enabled)</small>
                    <input
                      name="mfaCode"
                      autoComplete="one-time-code"
                      dir="ltr"
                      maxLength={24}
                    />
                  </label>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onNavigate("forgot-password")}
                  >
                    {t("Forgot password?")}
                  </button>
                </>
              )}
              {["reset-password", "verify-email"].includes(mode) && !token && (
                <p className="notice">
                  Open the link from your email to provide the verification
                  token.
                </p>
              )}
              <ErrorBox error={error} />
              {message && (
                <p className="success-note" role="status">
                  {message}
                </p>
              )}
              <Button
                className="full"
                type="submit"
                disabled={
                  busy ||
                  (["reset-password", "verify-email"].includes(mode) && !token)
                }
              >
                {busy
                  ? t("Loading…")
                  : mode === "verify-email"
                    ? t("Submit")
                    : t(titles[mode] || "Submit")}
              </Button>
            </form>
            <div className="auth-links">
              {mode === "login" ? (
                <>
                  <span>New to Shirzai Trading?</span>
                  <button onClick={() => onNavigate("register")}>
                    {t("Create account")}
                  </button>
                  <button onClick={() => onNavigate("resend-verification")}>
                    Resend verification email
                  </button>
                </>
              ) : (
                <button onClick={() => onNavigate("login")}>
                  {t("Sign in")}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </Localized>
  );
}
