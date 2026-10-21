"use client";
import { Localized } from "../../shared/i18n.jsx";
import { useEffect, useState } from "react";
import {
  Button,
  Empty,
  ErrorBox,
  Logo,
  PreferencesControls,
} from "../../shared/ui.jsx";
import Icon from "../../shared/icons.jsx";
import { ProductGallery } from "../catalog/ProductImages.jsx";
import { productName, recordId } from "../../shared/format.js";
import { usePreferences } from "../../shared/i18n.jsx";
export default function PublicSite({ api, onNavigate, user, onInquiry }) {
  const { t, language } = usePreferences();
  const [catalog, setCatalog] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [search, setSearch] = useState(""),
    [cursor, setCursor] = useState(""),
    [next, setNext] = useState(null),
    [category, setCategory] = useState("All products");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .request("/catalog?limit=25" + (cursor ? "&cursor=" + cursor : ""), {
        signal: controller.signal,
      })
      .then((r) => {
        setCatalog(r.items);
        setNext(r.nextCursor);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, cursor]);
  const visible = catalog.filter(
    (p) =>
      (category === "All products" || p.category === category) &&
      [productName(p, language), p.category, p.origin]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <Localized>
      <div className="public-site">
        <div className="announcement">
          <span>AGRICULTURAL TRADE, CONNECTED</span>
          <span>Clear terms. Reliable handover.</span>
        </div>
        <header className="public-header">
          <Logo />
          <nav>
            <a href="#products">{t("Products")}</a>
            <a href="#process">How we trade</a>
            <a href="#terms">Trade terms</a>
          </nav>
          <div className="header-actions">
            <PreferencesControls />
            <Button
              className="secondary"
              onClick={() => onNavigate(user ? "workspace" : "login")}
            >
              {t(user ? "Trade workspace" : "Sign in")}
            </Button>
          </div>
        </header>
        <main>
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="tiny-dot" /> ROOTED IN AFGHANISTAN. CONNECTED
                TO TRADE.
              </span>
              <h1>
                From good origins.
                <br />
                <em>To new possibilities.</em>
              </h1>
              <p>
                Wholesale agricultural products for businesses that value
                quality, clear agreements, and a dependable route to the border.
              </p>
              <div className="hero-buttons">
                <a className="button" href="#products">
                  {t("Browse products")}
                  <Icon name="arrow" />
                </a>
                <Button
                  className="subtle"
                  onClick={() => onNavigate(user ? "workspace" : "login")}
                >
                  Open your workspace <Icon name="arrow" />
                </Button>
              </div>
              <div className="hero-trust">
                <span>
                  <Icon name="shield" /> Transparent terms
                </span>
                <span>
                  <Icon name="truck" /> Border handover
                </span>
                <span>
                  <Icon name="globe" /> Import & export
                </span>
              </div>
            </div>
            <div
              className="hero-art"
              aria-label="Illustration of agricultural produce and trade routes"
              role="img"
            >
              <div className="art-grid" />
              <div className="origin-label">
                <span className="tiny-dot" /> AFGHANISTAN{" "}
                <small>Origin, quality & opportunity</small>
              </div>
              <svg
                className="grain-art"
                viewBox="0 0 520 390"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 330C140 210 220 340 520 170V390H0Z"
                  fill="#d9c398"
                />
                <path
                  d="M0 360C170 260 320 350 520 265V390H0Z"
                  fill="#b9b48a"
                />
                <path
                  d="M45 388C155 310 365 332 480 390"
                  stroke="#f9edd2"
                  strokeWidth="18"
                />
                <g stroke="#365c49" strokeWidth="4" strokeLinecap="round">
                  <path d="M236 340 208 110M300 340l30-205M265 340l-6-260" />
                  <path
                    d="M208 180c-45-7-50-41-15-32 25 7 28 21 15 32Zm0-22c30-23 43-42 11-40-25 1-29 20-11 40ZM216 235c-43-5-49-34-15-33 26 3 30 24 15 33Zm0-18c31-21 43-40 14-41-26 0-34 24-14 41ZM259 144c-43-10-40-41-12-32 23 8 24 24 12 32Zm0-22c30-20 43-43 12-40-26 4-27 28-12 40ZM263 203c-38-10-46-37-15-34 26 5 32 21 15 34Zm0-22c27-21 44-38 13-39-25 4-29 19-13 39ZM320 200c-25-24-17-48 6-27 14 12 9 27-6 27Zm0-24c31-8 44-26 18-29-23-1-29 15-18 29ZM310 255c-23-21-20-44 4-30 19 11 21 29-4 30Zm0-22c35-5 49-21 21-29-27-1-34 16-21 29Z"
                    fill="#d6ac64"
                  />
                </g>
                <circle cx="424" cy="76" r="36" fill="#ead4a4" />
              </svg>
              <div className="quality-card">
                <span className="quality-icon">
                  <Icon name="leaf" size={27} />
                </span>
                <div>
                  <b>Source. Agree. Deliver.</b>
                  <small>Every step, clearly connected.</small>
                </div>
              </div>
              <div className="art-caption">
                THE JOURNEY STARTS WITH QUALITY <span>01 / 03</span>
              </div>
            </div>
          </section>
          <div className="value-strip">
            <span>Wholesale quantities</span>
            <span>USD agreements</span>
            <span>Multiple warehouses</span>
            <span>Documented deliveries</span>
          </div>
          <section id="products" className="catalog-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">OUR PRODUCT RANGE</span>
                <h2>Find your next opportunity.</h2>
                <p>
                  Explore available products and request a quotation tailored to
                  your order.
                </p>
              </div>
              <span className="outline-tag">BULK & WHOLESALE</span>
            </div>
            <div className="catalog-toolbar">
              <div className="tabs">
                <button
                  className={category === "All products" ? "active" : ""}
                  onClick={() => setCategory("All products")}
                >
                  {t("All products")}
                </button>
                {[
                  ...new Set(catalog.map((p) => p.category).filter(Boolean)),
                ].map((c) => (
                  <button
                    className={category === c ? "active" : ""}
                    onClick={() => setCategory(c)}
                    key={c}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <label className="search-box">
                <Icon name="search" />
                <input
                  aria-label={t("Search")}
                  placeholder="Search this page"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            <ErrorBox error={error} />
            {loading ? (
              <div className="skeleton-grid">
                {[0, 1, 2].map((i) => (
                  <div className="skeleton" key={i} />
                ))}
              </div>
            ) : visible.length ? (
              <div className="product-grid">
                {visible.map((p, i) => (
                  <article className="product-card" key={recordId(p)}>
                    <ProductGallery product={p} />
                    <div className="product-info">
                      <div>
                        <span className="eyebrow">
                          {p.origin || "Origin on quotation"}
                        </span>
                        <h3>{productName(p, language)}</h3>
                        <p>
                          {[p.grade, p.packaging].filter(Boolean).join(" · ") ||
                            "Specifications supplied with your quotation"}
                        </p>
                      </div>
                      <div className="product-footer">
                        <small>
                          MOQ <b>{p.moq || 0} tonnes</b>
                        </small>
                        <Button
                          className="secondary"
                          onClick={() =>
                            user ? onInquiry(p) : onNavigate("login")
                          }
                        >
                          {t("Request a quote")}
                          <Icon name="arrow" size={16} />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title={error ? "Products unavailable" : "No records yet"}
                text={
                  error
                    ? "Start your local backend to load the live product catalog."
                    : "Products added by your team will appear here."
                }
              />
            )}
            <div className="pagination">
              <Button
                className="secondary"
                disabled={!cursor}
                onClick={() => setCursor("")}
              >
                First page
              </Button>
              <Button
                className="secondary"
                disabled={!next}
                onClick={() => {
                  setCursor(next);
                  setCategory("All products");
                }}
              >
                {t("Next page")}
              </Button>
            </div>
          </section>
          <section id="process" className="process-section">
            <div>
              <span className="eyebrow">A CLEAR WAY TO TRADE</span>
              <h2>
                Less uncertainty.
                <br />
                More opportunity.
              </h2>
              <p>
                From your first inquiry to border handover, follow every stage
                in your workspace.
              </p>
              <Button
                className="secondary"
                onClick={() => onNavigate("register")}
              >
                {t("Create account")}
                <Icon name="arrow" />
              </Button>
            </div>
            <div className="steps">
              {[
                [
                  "01",
                  "Tell us what you need",
                  "Choose a product, quantity, and destination.",
                ],
                [
                  "02",
                  "Agree on the details",
                  "Review your quotation, delivery fees, and payment terms.",
                ],
                [
                  "03",
                  "Track the journey",
                  "Submit payment evidence and follow dispatch through handover.",
                ],
              ].map(([n, title, text]) => (
                <article key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <Icon name="arrow" />
                </article>
              ))}
            </div>
          </section>
          <section id="terms" className="terms-section">
            <span className="eyebrow">KNOW YOUR TERMS</span>
            <h2>Clarity before commitment.</h2>
            <div className="terms-grid">
              <article>
                <Icon name="wallet" />
                <h3>Payments</h3>
                <p>
                  50% before dispatch, with the remaining balance at border
                  handover. TT payments require confirmation of received bank
                  funds.
                </p>
              </article>
              <article>
                <Icon name="truck" />
                <h3>Split deliveries</h3>
                <p>
                  Delivery fees included in the accepted deal remain part of the
                  price. Later deliveries require an agreed additional fee.
                </p>
              </article>
              <article>
                <Icon name="refresh" />
                <h3>Returns & refunds</h3>
                <p>
                  After dispatch, 25% of the total order is retained. Fully paid
                  orders qualify for a 75% refund, subject to the agreed return
                  window and condition inspection.
                </p>
              </article>
            </div>
            <p className="terms-footnote">
              Review the specific return window and full terms on your quotation
              before acceptance.
            </p>
          </section>
        </main>
        <footer className="public-footer">
          <Logo />
          <p>Good origins. Clear agreements. Connected trade.</p>
          <div>
            <button onClick={() => onNavigate("login")}>{t("Sign in")}</button>
            <a href="#terms">Trade terms</a>
            <span>© {new Date().getFullYear()} Shirzai Trading</span>
          </div>
        </footer>
      </div>
    </Localized>
  );
}
