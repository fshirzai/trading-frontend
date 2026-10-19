"use client";
import { useEffect, useRef, useId } from "react";
import Icon from "./icons.jsx";
import { usePreferences } from "./i18n.jsx";
export function Button({ children, icon, className = "", ...props }) {
  return (
    <button className={`button ${className}`} {...props}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}
export function Badge({ children }) {
  const s = String(children || "");
  return (
    <span
      className={`badge ${/Verified|Completed|Delivered|Clean|Closed|Active|Paid|Received/i.test(s) ? "success" : /Rejected|Failed|Inactive/i.test(s) ? "danger" : "pending"}`}
    >
      {s}
    </span>
  );
}
export function ErrorBox({ error }) {
  return error ? (
    <div className="error" role="alert">
      <strong>{error.message || String(error)}</strong>
      {Array.isArray(error.details) && (
        <ul>
          {error.details.map((d, i) => (
            <li key={i}>
              {d.field}: {d.message}
            </li>
          ))}
        </ul>
      )}
      {error.requestId && <small>Reference: {error.requestId}</small>}
    </div>
  ) : null;
}
export function Empty({
  title = "No records yet",
  text = "Your records will appear here when they are created.",
}) {
  const { t } = usePreferences();
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name="box" size={30} />
      </div>
      <h3>{t(title)}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null),
    titleId = useId(),
    { t } = usePreferences();
  useEffect(() => {
    const prior = document.activeElement;
    ref.current?.showModal();
    return () => {
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="dialog"
      aria-labelledby={titleId}
    >
      <header>
        <div>
          <span className="eyebrow">SHIRZAI TRADING</span>
          <h2 id={titleId}>{t(title)}</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Close")}
        >
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function PreferencesControls() {
  const { language, setLanguage, mode, setMode, color, setColor, t } =
    usePreferences();
  return (
    <div className="preferences">
      <select
        aria-label="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="en">EN</option>
        <option value="ps">پښتو</option>
        <option value="fa">دری</option>
      </select>
      <select
        className="appearance-mode"
        aria-label="Appearance mode"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <select
        className="color-theme"
        aria-label="Color theme"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      >
        <option value="emerald">Emerald</option>
        <option value="ocean">Ocean</option>
        <option value="amber">Amber</option>
        <option value="violet">Violet</option>
        <option value="graphite">Graphite</option>
      </select>
    </div>
  );
}
export function Logo({ compact = false }) {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Icon name="leaf" size={25} />
      </span>
      {!compact && (
        <span>
          SHIRZAI<span className="logo-sub">TRADING COMPANY</span>
        </span>
      )}
    </div>
  );
}
