"use client";
import { useEffect, useRef, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import { usePreferences } from "../../shared/i18n.jsx";
import { useBranding, publicAsset } from "../settings/BrandingProvider.jsx";
import { ProductGallery } from "../catalog/ProductImages.jsx";
import ProductVideo from "../catalog/ProductVideo.jsx";
import { productName } from "../../shared/format.js";
import { useCart } from "./CartProvider.jsx";
import SiteLayout from "./SiteLayout.jsx";
export function companyPhoto(image) {
  return image?.id === "starter-field"
    ? "/images/fields.jpg"
    : image?.id === "starter-grain"
      ? "/images/grain.jpg"
      : image?.id
        ? publicAsset("/settings/photos/" + image.id)
        : "/images/fields.jpg";
}
function ProductCard({ product: p }) {
  const { language, t } = usePreferences(),
    { add } = useCart();
  const [added, setAdded] = useState(false);
  const image = p.images?.[0];
  return (
    <article className="store-product">
      <a className="store-product-image" href={"/product/?id=" + p._id}>
        {image ? (
          <img
            loading="lazy"
            alt={productName(p, language)}
            src={publicAsset(`/catalog/${p._id}/images/${image.id}/thumb`)}
          />
        ) : (
          <div className="product-placeholder">
            <span>◈</span>
            <small>{t("Agricultural product")}</small>
          </div>
        )}
      </a>
      <div className="store-product-copy">
        <span className="eyebrow">{p.category || t("Wholesale")}</span>
        <h2>
          <a href={"/product/?id=" + p._id}>{productName(p, language)}</a>
        </h2>
        <p>
          {[p.origin, p.grade && t("Grade") + " " + p.grade, p.packaging]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="store-product-bottom">
          <small>
            {t("Minimum order")}: {p.moq || 1} {t(p.unit || "tonne")}
          </small>
          <Button
            className="small"
            onClick={() => {
              if (add(p._id, p.moq || 1)) setAdded(true);
            }}
          >
            {t(added ? "Added to cart" : "Add to cart")}
          </Button>
        </div>
      </div>
    </article>
  );
}
function Catalog({ api, featured = false }) {
  const { t } = usePreferences();
  const [products, setProducts] = useState([]),
    [filters, setFilters] = useState({
      categories: [],
      origins: [],
      grades: [],
    }),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [origin, setOrigin] = useState(""),
    [grade, setGrade] = useState(""),
    [cursor, setCursor] = useState(""),
    [next, setNext] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    setCursor("");
  }, [query, category, origin, grade]);
  useEffect(() => {
    const c = new AbortController();
    api
      .request("/catalog/filters", { signal: c.signal })
      .then(setFilters)
      .catch(() => {});
    return () => c.abort();
  }, [api, retry]);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: featured ? "3" : "12" });
    for (const [k, v] of Object.entries({
      search: query,
      category,
      origin,
      grade,
      cursor,
    }))
      if (v) params.set(k, v);
    api
      .request("/catalog?" + params, { signal: c.signal })
      .then((r) => {
        if (!c.signal.aborted) {
          setProducts(r.items);
          setNext(r.nextCursor);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [api, featured, query, category, origin, grade, cursor, retry]);
  return (
    <section className="store-section" aria-label={t("Product catalog")}>
      <div className="store-section-heading">
        <div>
          <span className="eyebrow">{t("OUR SELECTION")}</span>
          <h1>
            {t(
              featured
                ? "Products for your next order"
                : "Find the right products",
            )}
          </h1>
          <p>
            {t(
              "Browse specifications, choose quantities and request one quotation for your cart.",
            )}
          </p>
        </div>
        {featured && (
          <a className="text-link" href="/products/">
            {t("View all products")} →
          </a>
        )}
      </div>
      {!featured && (
        <div className="catalog-filters">
          <label>
            {t("Search products")}
            <input
              type="search"
              maxLength={100}
              placeholder={t("Product name or SKU")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {[
            ["category", "Category", category, setCategory, filters.categories],
            ["origin", "Origin", origin, setOrigin, filters.origins],
            ["grade", "Grade", grade, setGrade, filters.grades],
          ].map(([key, label, value, set, options]) => (
            <label key={key}>
              {t(label)}
              <select value={value} onChange={(e) => set(e.target.value)}>
                <option value="">{t("All")}</option>
                {options.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <Button
            className="secondary"
            onClick={() => {
              setSearch("");
              setQuery("");
              setCategory("");
              setOrigin("");
              setGrade("");
              setCursor("");
            }}
          >
            {t("Clear filters")}
          </Button>
        </div>
      )}
      <ErrorBox error={error} />
      {error && (
        <Button onClick={() => setRetry((x) => x + 1)}>{t("Try again")}</Button>
      )}
      {loading ? (
        <p role="status" className="store-loading">
          {t("Loading products…")}
        </p>
      ) : products.length ? (
        <div className="store-product-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="store-empty">
            <h2>{t("No matching products")}</h2>
            <p>{t("Try another search or clear the filters.")}</p>
          </div>
        )
      )}
      {!featured && (
        <div className="catalog-pagination">
          <Button
            className="secondary"
            disabled={!cursor || loading}
            onClick={() => setCursor("")}
          >
            {t("First page")}
          </Button>
          <Button disabled={!next || loading} onClick={() => setCursor(next)}>
            {t("Next page")}
          </Button>
        </div>
      )}
    </section>
  );
}
function ProductPage({ api }) {
  const { t, language } = usePreferences(),
    { add } = useCart();
  const [product, setProduct] = useState(null),
    [quantity, setQuantity] = useState("1"),
    [error, setError] = useState(null),
    [added, setAdded] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!/^[a-f\d]{24}$/.test(id || "")) {
      setError(Error(t("Product not found")));
      return;
    }
    const c = new AbortController();
    api
      .request("/catalog/" + id, { signal: c.signal })
      .then((p) => {
        setProduct(p);
        setQuantity(String(p.moq || 1));
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      });
    return () => c.abort();
  }, [api]);
  function submit(e) {
    e.preventDefault();
    const q = Number(quantity);
    if (
      !Number.isFinite(q) ||
      q < (product.moq || 0) ||
      q <= 0 ||
      q > 1e6 ||
      Math.abs(q * 1000 - Math.round(q * 1000)) > 1e-5
    ) {
      setError(
        Error(t("Enter a valid quantity at or above the minimum order.")),
      );
      return;
    }
    try {
      if (add(product._id, q)) setAdded(true);
      setError(null);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <section className="store-section">
      <nav className="breadcrumbs">
        <a href="/products/">{t("Products")}</a>
        <span>/</span>
        <span>
          {product ? productName(product, language) : t("Product details")}
        </span>
      </nav>
      <ErrorBox error={error} />
      {product ? (
        <div className="product-detail-layout">
          <div className="product-detail-gallery">
            <ProductGallery product={product} />
            <ProductVideo product={product} />
          </div>
          <div>
            <span className="eyebrow">
              {product.category || t("Wholesale agriculture")}
            </span>
            <h1>{productName(product, language)}</h1>
            <p className="store-lead">
              {t(
                "Review the specification and add the quantity your business needs.",
              )}
            </p>
            <dl className="product-specs">
              {[
                ["Grade", product.grade],
                ["Origin", product.origin],
                ["Packaging", product.packaging],
                ["Unit", t(product.unit || "tonne")],
                ["Minimum order", product.moq || 1],
                ["SKU", product.sku],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{t(k)}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
            <form className="product-order-box" onSubmit={submit}>
              <label>
                {t("Quantity")} ({t(product.unit || "tonne")})
                <input
                  aria-label={t("Quantity")}
                  type="number"
                  min={product.moq || 0.001}
                  max="1000000"
                  step="0.001"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
              <Button type="submit">{t("Add to cart")}</Button>
              {added && (
                <p role="status">
                  {t("Added to cart")}. <a href="/cart/">{t("Review cart")}</a>
                </p>
              )}
              <p className="muted">
                {t(
                  "The final price and availability are confirmed in your quotation.",
                )}
              </p>
            </form>
            <a className="text-link" href="/delivery/">
              {t("Read delivery and return terms")} →
            </a>
          </div>
        </div>
      ) : (
        !error && <p role="status">{t("Loading products…")}</p>
      )}
    </section>
  );
}
function CartPage({ api, user, onNavigate }) {
  const { t, language } = usePreferences(),
    { items, setQuantity, remove, clear, ready } = useCart();
  const [products, setProducts] = useState({}),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [destination, setDestination] = useState(""),
    [method, setMethod] = useState("TT"),
    [accepted, setAccepted] = useState(false),
    [result, setResult] = useState(null),
    [reload, setReload] = useState(0);
  const key = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const c = new AbortController();
    Promise.all(
      items.map((x) =>
        api
          .request("/catalog/" + x.product, { signal: c.signal })
          .then((p) => [x.product, p])
          .catch((e) => {
            if (e.name === "AbortError") throw e;
            return [x.product, { unavailable: true }];
          }),
      ),
    )
      .then((rows) => {
        if (!c.signal.aborted) setProducts(Object.fromEntries(rows));
      })
      .catch(() => {});
    return () => c.abort();
  }, [api, ready, items.map((x) => x.product).join(","), reload]);
  function change(id, value) {
    key.current = null;
    if (value !== "" && Number(value) > 0) setQuantity(id, Number(value));
  }
  useEffect(() => {
    try {
      const draft = JSON.parse(
        sessionStorage.getItem("trade-cart-draft") || "null",
      );
      if (draft) {
        setDestination(draft.destination || "");
        setMethod(draft.method === "VISA" ? "VISA" : "TT");
      }
    } catch {}
  }, []);
  function signIn() {
    try {
      localStorage.setItem("trade-after-login", "cart");
      sessionStorage.setItem(
        "trade-cart-draft",
        JSON.stringify({ destination, method }),
      );
    } catch {}
    onNavigate("login");
  }
  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!user) {
      signIn();
      return;
    }
    if (user.role !== "customer") {
      setError(Error(t("Use a customer account to send a cart request.")));
      return;
    }
    if (
      !items.length ||
      items.some(
        (x) =>
          !products[x.product] ||
          products[x.product].unavailable ||
          x.quantity < (products[x.product].moq || 0),
      )
    ) {
      setError(
        Error(t("Remove unavailable products and check minimum quantities.")),
      );
      return;
    }
    if (!accepted) return;
    setBusy(true);
    try {
      if (!key.current) key.current = crypto.randomUUID();
      const first = items[0];
      const r = await api.request("/inquiries", {
        method: "POST",
        headers: { "Idempotency-Key": key.current },
        body: {
          product: first.product,
          quantity: first.quantity,
          items,
          destination,
          source: "website",
          preferredPayment: method,
        },
      });
      setResult(r);
      try {
        sessionStorage.removeItem("trade-cart-draft");
      } catch {}
      clear();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="store-section">
      <span className="eyebrow">{t("YOUR SELECTION")}</span>
      <h1>{t("Review your cart")}</h1>
      <p className="store-lead">
        {t(
          "One product or several: choose each quantity and send one quotation request.",
        )}
      </p>
      <ErrorBox error={error} />
      {result ? (
        <div className="cart-success">
          <span>✓</span>
          <h2>{t("Request received")}</h2>
          <p>
            {t(
              "Your sales team will prepare a quotation. Review and accept it before payment.",
            )}
          </p>
          <p>
            {t("Reference")}: {result._id}
          </p>
          <Button onClick={() => onNavigate("workspace", "inquiries")}>
            {t("View my inquiries")}
          </Button>
          <a href="/products/">{t("Continue browsing")}</a>
        </div>
      ) : items.length ? (
        <form onSubmit={submit} className="cart-layout">
          <div className="cart-items">
            {items.map((x) => {
              const p = products[x.product];
              return (
                <article className="cart-row" key={x.product}>
                  <div>
                    <h2>
                      <a href={"/product/?id=" + x.product}>
                        {p && !p.unavailable
                          ? productName(p, language)
                          : t(
                              p?.unavailable
                                ? "Unavailable product"
                                : "Loading…",
                            )}
                      </a>
                    </h2>
                    <p>
                      {p?.packaging} · {p?.unit && t(p.unit)}
                    </p>
                    {p?.unavailable && (
                      <p className="error">
                        {t(
                          "This product is no longer available. Remove it to continue.",
                        )}
                      </p>
                    )}
                    <small>
                      {t("Minimum order")}: {p?.moq || 1}
                    </small>
                  </div>
                  <label>
                    {t("Quantity")}
                    <input
                      aria-label={
                        t("Quantity") +
                        " " +
                        (p ? productName(p, language) : x.product)
                      }
                      type="number"
                      required
                      step="0.001"
                      min={p?.moq || 0.001}
                      max="1000000"
                      value={x.quantity}
                      disabled={busy}
                      onChange={(e) => change(x.product, e.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    className="subtle"
                    disabled={busy}
                    onClick={() => {
                      key.current = null;
                      remove(x.product);
                    }}
                  >
                    {t("Remove")}
                  </Button>
                </article>
              );
            })}
          </div>
          <aside className="cart-summary">
            <h2>{t("Quotation request")}</h2>
            <p>
              {t(
                "Prices, stock allocation and delivery fees are confirmed by the sales team.",
              )}
            </p>
            <label>
              {t("Delivery place")}
              <textarea
                required
                minLength={3}
                maxLength={200}
                value={destination}
                disabled={busy}
                onChange={(e) => {
                  setDestination(e.target.value);
                  key.current = null;
                }}
              />
            </label>
            <label>
              {t("Preferred payment method")}
              <select
                value={method}
                disabled={busy}
                onChange={(e) => {
                  setMethod(e.target.value);
                  key.current = null;
                }}
              >
                <option value="TT">{t("TT bank transfer")}</option>
                <option value="VISA">{t("Visa / card via HesabPay")}</option>
              </select>
            </label>
            <p className="muted">
              {t(
                "Payment becomes available after you accept the quotation. Card availability depends on the merchant account.",
              )}
            </p>
            <label className="cart-consent">
              <input
                type="checkbox"
                required
                checked={accepted}
                disabled={busy}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                {t("I have read the trade and return terms.")}{" "}
                <a href="/terms/" target="_blank" rel="noreferrer">
                  {t("Read terms")}
                </a>
              </span>
            </label>
            <Button
              type={user ? "submit" : "button"}
              onClick={!user ? signIn : undefined}
              disabled={busy}
            >
              {t(
                busy
                  ? "Sending…"
                  : user
                    ? "Send quotation request"
                    : "Sign in to continue",
              )}
            </Button>
          </aside>
        </form>
      ) : (
        <div className="store-empty">
          <h2>{t("Your cart is empty")}</h2>
          <p>{t("Add products from the catalog to start your request.")}</p>
          <a className="button" href="/products/">
            {t("Browse products")}
          </a>
        </div>
      )}
    </section>
  );
}
const tradeSections = [
  [
    "Quotation and acceptance",
    "Your cart is a request for a quotation. Prices, specifications, quantities, payment terms and the delivery point become binding only when the quotation is accepted.",
  ],
  [
    "Payment",
    "Pay by TT bank transfer with receipt verification, or by card through an enabled hosted payment provider. Dispatch requires at least 50% of the product value.",
  ],
  [
    "Cancellation before dispatch",
    "All verified money paid is refunded before dispatch.",
  ],
  [
    "Cancellation after dispatch",
    "25% of the order total is retained after dispatch. The refund is calculated from verified money received, subject to the agreed return conditions.",
  ],
  [
    "Returns",
    "The return window is stated in the accepted quotation and starts at the first handover, including split deliveries. Products must be returned in acceptable condition, without damage or rust. Partial item returns are not currently supported.",
  ],
  [
    "Split deliveries",
    "Additional delivery fees must be included in the accepted quotation or separately accepted before the additional delivery.",
  ],
  [
    "Delivery point",
    "Delivery is to the agreed handover point. Review the address, transport details and delivery documents in your order.",
  ],
];
function ContentPage({ page }) {
  const { t, language } = usePreferences(),
    { branding: b } = useBranding();
  const localized = b.translations?.[language] || {};
  const text = (k) => localized[k] || b[k];
  const about = page === "about",
    contact = page === "contact";
  const title = about
    ? text("aboutTitle")
    : t(
        {
          contact: "Contact our team",
          terms: "Terms & conditions",
          privacy: "Privacy policy",
          delivery: "Delivery & returns",
        }[page],
      );
  const photos = b.aboutImages || [
    { id: "starter-field" },
    { id: "starter-grain" },
  ];
  return (
    <>
      <section className="content-hero">
        <div>
          <span className="eyebrow">{b.name}</span>
          <h1>{title}</h1>
          <p>
            {t(
              about
                ? "Good products begin with care. Good trade begins with trust."
                : contact
                  ? "Tell us what your business needs. We will help you take the next step."
                  : "Clear information for confident decisions.",
            )}
          </p>
        </div>
        {about && photos[0] && (
          <img
            src={companyPhoto(photos[0])}
            alt={photos[0].alt || t("Agricultural fields")}
          />
        )}
      </section>
      <section className="store-section">
        {about ? (
          <>
            <div className="about-story">
              <div>
                <span className="eyebrow">{t("OUR APPROACH")}</span>
                <h2>{t("Connected from selection to handover")}</h2>
                <p className="company-copy">{text("aboutBody")}</p>
              </div>
              {photos[1] && (
                <img
                  loading="lazy"
                  src={companyPhoto(photos[1])}
                  alt={photos[1].alt || t("Harvested grain")}
                />
              )}
            </div>
            <div className="about-values">
              {[
                [
                  "Clear specifications",
                  "Review grade, origin, packaging and quantity before agreeing to an order.",
                ],
                [
                  "Transparent agreements",
                  "Keep quotation, payments and delivery documents connected in one place.",
                ],
                [
                  "Careful coordination",
                  "Follow your order from acceptance through delivery and any agreed return.",
                ],
              ].map(([a, c]) => (
                <article key={a}>
                  <span>◈</span>
                  <h3>{t(a)}</h3>
                  <p>{t(c)}</p>
                </article>
              ))}
            </div>
            {photos.length > 2 && (
              <div className="about-extra">
                {photos.slice(2).map((p) => (
                  <img
                    key={p.id}
                    loading="lazy"
                    src={companyPhoto(p)}
                    alt={p.alt}
                  />
                ))}
              </div>
            )}
            <div className="store-callout">
              <h2>{t("Let us prepare your next quotation.")}</h2>
              <a className="button" href="/products/">
                {t("Browse products")}
              </a>
            </div>
          </>
        ) : contact ? (
          <div className="contact-layout">
            <div>
              <h2>{t("Start a conversation")}</h2>
              <p>
                {t(
                  "For product requirements and pricing, add products to your cart and send a quotation request.",
                )}
              </p>
              <a className="button" href="/products/">
                {t("Browse products")}
              </a>
            </div>
            <dl className="contact-cards">
              {[
                ["Contact email", b.contactEmail],
                ["Contact phone", b.contactPhone],
                ["Office address", b.address],
                ["Working hours", b.workingHours],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{t(k)}</dt>
                    <dd>
                      {k === "Contact email" ? (
                        <a href={"mailto:" + v}>{v}</a>
                      ) : k === "Contact phone" ? (
                        <a dir="ltr" href={"tel:" + v.replace(/[^+\d]/g, "")}>
                          {v}
                        </a>
                      ) : (
                        v
                      )}
                    </dd>
                  </div>
                ))}
              {!b.contactEmail && !b.contactPhone && !b.address && (
                <p>
                  {t(
                    "Send a quotation request through your account to contact the sales team.",
                  )}
                </p>
              )}
            </dl>
          </div>
        ) : (
          <div className="policy-layout">
            <aside>
              {["terms", "delivery", "privacy"].map((p) => (
                <a
                  aria-current={page === p ? "page" : undefined}
                  key={p}
                  href={"/" + p + "/"}
                >
                  {t(
                    {
                      terms: "Terms & conditions",
                      delivery: "Delivery & returns",
                      privacy: "Privacy policy",
                    }[p],
                  )}
                </a>
              ))}
            </aside>
            <article className="policy-copy">
              {text(page + "Body") ? (
                <p className="company-copy">{text(page + "Body")}</p>
              ) : page === "privacy" ? (
                <>
                  {[
                    [
                      "Information used",
                      "We use account details, inquiries, orders, payment references and uploaded documents to operate your trading account and fulfill agreed services.",
                    ],
                    [
                      "Payment information",
                      "Card details are entered on the payment provider’s hosted checkout. This system stores payment references and amounts, not card numbers or security codes.",
                    ],
                    [
                      "Access and retention",
                      "Business records are accessible to the customer and authorized staff according to their role. Contact the company with questions about access, corrections or retention.",
                    ],
                  ].map(([a, c]) => (
                    <section key={a}>
                      <h2>{t(a)}</h2>
                      <p>{t(c)}</p>
                    </section>
                  ))}
                </>
              ) : (
                tradeSections.map(([a, c]) => (
                  <section key={a}>
                    <h2>{t(a)}</h2>
                    <p>{t(c)}</p>
                  </section>
                ))
              )}
            </article>
          </div>
        )}
      </section>
    </>
  );
}
export default function Storefront({ api, user, onNavigate, page = "home" }) {
  const { t } = usePreferences(),
    { branding: b } = useBranding();
  return (
    <SiteLayout user={user} onNavigate={onNavigate} page={page}>
      {page === "home" ? (
        <>
          <section className="store-hero">
            <img
              className="store-hero-image"
              src={companyPhoto(b.aboutImages?.[0])}
              alt=""
              fetchPriority="high"
            />
            <div className="store-hero-shade" />
            <div className="store-hero-copy">
              <span className="eyebrow">
                {t("ROOTED IN AGRICULTURE. READY FOR TRADE.")}
              </span>
              <h1>{t("Good origins. Clear agreements.")}</h1>
              <p>
                {t(
                  "Discover agricultural products, build your selection and trade with confidence from quotation to handover.",
                )}
              </p>
              <div className="button-row">
                <a className="button" href="/products/">
                  {t("Explore products")}
                </a>
                <a className="button hero-outline" href="/about/">
                  {t("Meet our company")}
                </a>
              </div>
            </div>
            <div className="hero-caption">
              {t("Selection · Quality · Coordination")}
            </div>
          </section>
          <div className="store-promises">
            {[
              "Clear product specifications",
              "One cart, multiple products",
              "TT and secure card checkout",
              "Track every agreed step",
            ].map((x) => (
              <span key={x}>✓ {t(x)}</span>
            ))}
          </div>
          <Catalog api={api} featured />
          <section className="store-process store-section">
            <span className="eyebrow">{t("HOW IT WORKS")}</span>
            <h2>{t("From your selection to an agreed delivery")}</h2>
            <div>
              {[
                [
                  "01",
                  "Choose your products",
                  "Add products and quantities to your cart.",
                ],
                [
                  "02",
                  "Review your quotation",
                  "Confirm the price, delivery point and terms.",
                ],
                [
                  "03",
                  "Pay and follow your order",
                  "Use TT or an enabled card checkout and follow the handover.",
                ],
              ].map(([n, a, c]) => (
                <article key={n}>
                  <span>{n}</span>
                  <h3>{t(a)}</h3>
                  <p>{t(c)}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : page === "products" ? (
        <Catalog api={api} />
      ) : page === "product" ? (
        <ProductPage api={api} />
      ) : page === "cart" ? (
        <CartPage api={api} user={user} onNavigate={onNavigate} />
      ) : (
        <ContentPage page={page} />
      )}
    </SiteLayout>
  );
}
