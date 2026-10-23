"use client";
import { useState } from "react";
import { Logo, PreferencesControls, ErrorBox } from "../../shared/ui.jsx";
import { usePreferences } from "../../shared/i18n.jsx";
import { useBranding } from "../settings/BrandingProvider.jsx";
import { useCart } from "./CartProvider.jsx";
export const publicPaths = {
  home: "/",
  products: "/products/",
  product: "/product/",
  cart: "/cart/",
  about: "/about/",
  contact: "/contact/",
  terms: "/terms/",
  privacy: "/privacy/",
  delivery: "/delivery/",
};
export default function SiteLayout({
  children,
  user,
  onNavigate,
  page = "home",
}) {
  const { t } = usePreferences(),
    { branding: b } = useBranding(),
    { items, error } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <div className="storefront">
      <div className="store-announcement">
        {t("Clear specifications. Agreed prices. Reliable handover.")}
      </div>
      <header className="store-header">
        <a className="brand-home" href="/" aria-label={t("Home")}>
          <Logo />
        </a>
        <button
          className="store-menu button secondary"
          aria-expanded={open}
          aria-controls="store-nav"
          onClick={() => setOpen(!open)}
        >
          {t(open ? "Close menu" : "Menu")}
        </button>
        <nav
          id="store-nav"
          className={open ? "is-open" : ""}
          aria-label={t("Main navigation")}
        >
          {["home", "products", "about", "contact"].map((k) => (
            <a
              key={k}
              href={publicPaths[k]}
              aria-current={page === k ? "page" : undefined}
            >
              {t(
                {
                  home: "Home",
                  products: "Products",
                  about: "About",
                  contact: "Contact",
                }[k],
              )}
            </a>
          ))}
        </nav>
        <div className="store-actions">
          <a
            className="store-cart"
            href="/cart/"
            aria-label={t("Cart") + " (" + items.length + ")"}
          >
            {t("Cart")} <b>{items.length}</b>
          </a>
          <button
            className="button secondary"
            onClick={() => onNavigate(user ? "workspace" : "login")}
          >
            {t(user ? "Trade workspace" : "Sign in")}
          </button>
        </div>
        <div className="store-preferences">
          <PreferencesControls />
        </div>
      </header>
      <main id="main-content">
        <ErrorBox error={error} />
        {children}
      </main>
      <footer className="store-footer">
        <div>
          <Logo />
          <p>{t("Agricultural trade with clear agreements at every step.")}</p>
        </div>
        <div>
          <b>{t("Explore")}</b>
          <a href="/products/">{t("Products")}</a>
          <a href="/about/">{t("About")}</a>
          <a href="/contact/">{t("Contact")}</a>
        </div>
        <div>
          <b>{t("Trade information")}</b>
          <a href="/terms/">{t("Terms & conditions")}</a>
          <a href="/delivery/">{t("Delivery & returns")}</a>
          <a href="/privacy/">{t("Privacy policy")}</a>
        </div>
        <div>
          <b>{t("Contact")}</b>
          {b.contactEmail ? (
            <a href={"mailto:" + b.contactEmail}>{b.contactEmail}</a>
          ) : (
            <a href="/contact/">{t("Contact our team")}</a>
          )}
          {b.contactPhone && <p dir="ltr">{b.contactPhone}</p>}
          <p>{b.address}</p>
        </div>
        <small>
          © {new Date().getFullYear()} {b.name}
        </small>
      </footer>
    </div>
  );
}
