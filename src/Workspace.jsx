"use client";
import SystemSettings from "./modules/settings/SystemSettings.jsx";
import ProfileImage from "./modules/auth/ProfileImage.jsx";
import { useBranding } from "./modules/settings/BrandingProvider.jsx";
import ProductVideo from "./modules/catalog/ProductVideo.jsx";
import ProductStock from "./modules/inventory/ProductStock.jsx";
import { useEffect, useState } from "react";
import { allowedModules } from "./modules/registry.js";
import {
  Button,
  Empty,
  ErrorBox,
  Logo,
  Modal,
  PreferencesControls,
} from "./shared/ui.jsx";
import Icon from "./shared/icons.jsx";
import {
  label,
  money,
  productName,
  recordId,
  shortId,
} from "./shared/format.js";
import DataTable, { display } from "./shared/DataTable.jsx";
import { usePreferences } from "./shared/i18n.jsx";
import { canUseAction } from "./shared/workflows.js";
import Dashboard from "./modules/dashboard/Dashboard.jsx";
import OrderDetail from "./modules/sales/OrderDetail.jsx";
import StatementDetail from "./modules/reconciliation/StatementDetail.jsx";
import Reports from "./modules/reports/Reports.jsx";
import Settings from "./modules/auth/AccountSettings.jsx";
import ProductImages, {
  ProductGallery,
  ProductImage,
} from "./modules/catalog/ProductImages.jsx";
export default function Workspace({
  api,
  user,
  active = "dashboard",
  onNavigate,
  onExit,
  onCommand,
  onLogout,
  refresh,
  onProfileChanged,
}) {
  const { branding } = useBranding();
  const { t, language } = usePreferences(),
    allowed = allowedModules(user.role),
    module = allowed.find((m) => m.key === active) || allowed[0];
  const [mobile, setMobile] = useState(false),
    [rows, setRows] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(null),
    [cursor, setCursor] = useState(""),
    [history, setHistory] = useState([]),
    [next, setNext] = useState(null),
    [search, setSearch] = useState(""),
    [warehouse, setWarehouse] = useState(""),
    [warehouseChoices, setWarehouseChoices] = useState([]),
    [querySearch, setQuerySearch] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [detail, setDetail] = useState(null),
    [pendingDetail, setPendingDetail] = useState(null),
    [reload, setReload] = useState(0),
    [layout, setLayout] = useState("table"),
    [cardEnabled, setCardEnabled] = useState(false);
  const [imageProduct, setImageProduct] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setCursor("");
      setHistory([]);
      setQuerySearch(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    setCursor("");
    setHistory([]);
  }, [status, warehouse]);
  useEffect(() => {
    if (user.role !== "customer")
      api
        .request("/records/warehouse?limit=100")
        .then((r) => setWarehouseChoices(r.items))
        .catch(() => {});
  }, [api, user.role]);
  useEffect(() => {
    function openLinkedOrder() {
      const parts = window.location.hash.split("/");
      if (active === "sales" && /^[a-f\d]{24}$/.test(parts[2] || ""))
        setDetail({ _id: parts[2] });
    }
    openLinkedOrder();
    window.addEventListener("hashchange", openLinkedOrder);
    return () => window.removeEventListener("hashchange", openLinkedOrder);
  }, [active]);
  function navigate(key) {
    if (!allowed.some((m) => m.key === key)) return;
    onNavigate(key);
    setMobile(false);
  }
  useEffect(() => {
    setCursor("");
    setHistory([]);
    setSearch("");
    setStatus("All statuses");
    const linked = window.location.hash.split("/")[2];
    setDetail(
      active === "sales"
        ? pendingDetail ||
            (/^[a-f\d]{24}$/.test(linked || "") ? { _id: linked } : null)
        : null,
    );
    if (active === "sales") setPendingDetail(null);
  }, [active]);
  useEffect(() => {
    let live = true;
    api
      .request("/payment-methods")
      .then((r) => {
        if (live)
          setCardEnabled(
            r.methods.some((m) => m.method === "VISA" && m.enabled),
          );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [api]);
  useEffect(() => {
    if (!module.path) {
      setRows([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .request(
        module.path +
          "?limit=25" +
          (cursor ? "&cursor=" + cursor : "") +
          (querySearch ? "&search=" + encodeURIComponent(querySearch) : "") +
          (status !== "All statuses"
            ? "&status=" + encodeURIComponent(status)
            : "") +
          (module.key === "inventory" && warehouse
            ? "&warehouse=" + warehouse
            : ""),
        { signal: controller.signal },
      )
      .then((r) => {
        if (!controller.signal.aborted) {
          setRows(Array.isArray(r) ? r : r.items || []);
          setNext(r.nextCursor);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setRows([]);
          setError(e);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [
    api,
    module.path,
    cursor,
    refresh,
    reload,
    querySearch,
    status,
    warehouse,
  ]);
  const visible = rows.filter(
    (r) =>
      (status === "All statuses" || r.status === status) &&
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );
  const actions = (module.actions || []).filter((a) =>
    a.roles.includes(user.role),
  );
  const rowActions = (module.rowActions || []).filter((a) =>
    a.roles.includes(user.role),
  );
  if (
    module.key === "catalog" &&
    ["admin", "manager", "procurement"].includes(user.role)
  )
    rowActions.push({
      title: "Manage images & video",
      path: "product-images",
      method: "IMAGES",
    });
  if (
    module.key === "catalog" &&
    ["admin", "manager", "procurement"].includes(user.role)
  )
    rowActions.push({
      title: "Upload / replace video",
      path: "product-video",
      method: "IMAGES",
      mediaTab: "video",
    });
  function action(a, row) {
    if (a.fromRequest) {
      onCommand({
        ...a,
        initial: {
          request: recordId(row),
          product: row.product,
          quantity: row.quantity - row.receivedQuantity,
        },
        context: row,
      });
      return;
    }
    if (a.method === "IMAGES") {
      setImageProduct({ ...row, mediaTab: a.mediaTab || "images" });
      return;
    }
    onCommand({
      ...a,
      id: recordId(row),
      initial:
        a.method === "PATCH"
          ? {
              ...row,
              ...(row.salaryCents !== undefined
                ? { salary: row.salaryCents / 100 }
                : {}),
            }
          : undefined,
      context: row,
    });
  }
  function view(item) {
    if (
      module.key === "notifications" &&
      typeof item.href === "string" &&
      /^\/#workspace\/[A-Za-z]+(?:\/[a-f\d]{24})?$/.test(item.href)
    ) {
      window.location.hash = item.href.slice(2);
      return;
    }
    setDetail(item);
  }
  const navGroups = [
    ["workspace", "WORKSPACE", ["dashboard", "sales", "inquiries", "catalog"]],
    [
      "operations",
      "OPERATIONS",
      [
        "contacts",
        "inventory",
        "warehouses",
        "procurement",
        "procurementRequests",
        "logistics",
        "payments",
        "returns",
      ],
    ],
    [
      "finance",
      "FINANCE",
      [
        "accounting",
        "accounts",
        "expenses",
        "reconciliation",
        "payroll",
        "reports",
      ],
    ],
    [
      "administration",
      "ADMINISTRATION",
      [
        "audit",
        "notifications",
        "notificationDelivery",
        "systemSettings",
        "users",
        "auth",
      ],
    ],
  ];
  return (
    <div className="workspace">
      <button
        className={`sidebar-backdrop ${mobile ? "visible" : ""}`}
        onClick={() => setMobile(false)}
        aria-label="Close navigation"
      />
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button className="logo-button" onClick={onExit}>
          <Logo />
        </button>
        <div className="workspace-label">
          {t("Trade workspace")}
          <span>USD</span>
        </div>
        <nav aria-label="Workspace modules">
          {navGroups.map(([key, title, keys]) => {
            const entries = allowed.filter((m) => keys.includes(m.key));
            return entries.length ? (
              <div key={key}>
                <span className="nav-group">{t(title)}</span>
                {entries.map((m) => (
                  <button
                    key={m.key}
                    className={module.key === m.key ? "active" : ""}
                    onClick={() => navigate(m.key)}
                  >
                    <Icon name={m.icon} size={19} />
                    <span>{t(m.title)}</span>
                    {module.key === m.key && <i />}
                  </button>
                ))}
              </div>
            ) : null;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <Icon name="shield" />
            <div>
              <b>{t("Connected to your backend")}</b>
              <small>{t("Live records · Server permissions")}</small>
            </div>
          </div>
          <div className="user-card">
            <button
              className="profile-shortcut"
              aria-label="Open my profile"
              onClick={() => navigate("auth")}
            >
              <ProfileImage api={api} user={user} />
            </button>
            <div>
              <b>{user.name}</b>
              <small>{user.role}</small>
            </div>
            <button
              className="icon-button"
              aria-label={t("Sign out")}
              onClick={onLogout}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Icon name="menu" />
            </button>
            <span>{t("Trade workspace")}</span>
            <span>/</span>
            <b>{t(module.title)}</b>
          </div>
          <div className="header-actions">
            <PreferencesControls />
            <button
              className="icon-button notification-button"
              aria-label={t("Notifications")}
              onClick={() => navigate("notifications")}
            >
              <Icon name="bell" />
            </button>
          </div>
        </header>
        <main className="workspace-content">
          {module.key === "dashboard" ? (
            <Dashboard
              api={api}
              user={user}
              onNavigate={navigate}
              onView={(item) => {
                setPendingDetail(item);
                onNavigate("sales");
              }}
              onCommand={onCommand}
              refresh={refresh}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">LIVE COMPANY WORKSPACE</span>
                  <h1>
                    {t(module.title)}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>
                    {t(
                      descriptions[module.key] ||
                        "Manage your records and move the next step forward.",
                    )}
                  </p>
                </div>
                <div className="button-row">
                  {module.key !== "auth" &&
                    actions.map((a) => (
                      <Button
                        key={a.path}
                        icon="plus"
                        onClick={() => onCommand(a)}
                      >
                        {t(a.title)}
                      </Button>
                    ))}
                </div>
              </div>
              <ErrorBox error={error} />
              {module.key === "reports" ? (
                <Reports api={api} />
              ) : module.key === "auth" ? (
                <Settings
                  user={user}
                  api={api}
                  onCommand={onCommand}
                  onProfileChanged={onProfileChanged}
                />
              ) : module.key === "systemSettings" ? (
                <SystemSettings api={api} user={user} />
              ) : module.path ? (
                <>
                  <section className="panel">
                    <div className="list-toolbar">
                      <label className="search-box">
                        <Icon name="search" />
                        <input
                          aria-label={t("Search")}
                          placeholder={t("Search records")}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </label>
                      <div className="workspace-controls">
                        {rows.some((r) => r.status) && (
                          <select
                            aria-label="Status filter"
                            className="status-filter"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                          >
                            <option>All statuses</option>
                            {[
                              ...new Set(
                                rows.map((r) => r.status).filter(Boolean),
                              ),
                            ].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        )}
                        {["sales", "catalog"].includes(module.key) && (
                          <div className="view-tabs">
                            <button
                              className={layout === "table" ? "active" : ""}
                              onClick={() => setLayout("table")}
                            >
                              {t("Table")}
                            </button>
                            <button
                              className={layout === "cards" ? "active" : ""}
                              onClick={() => setLayout("cards")}
                            >
                              {t(module.key === "sales" ? "Board" : "Cards")}
                            </button>
                          </div>
                        )}
                        <Button
                          className="subtle small"
                          disabled={loading}
                          icon="refresh"
                          onClick={() => setReload((n) => n + 1)}
                        >
                          {t("Refresh")}
                        </Button>
                      </div>
                    </div>
                    {layout === "cards" && module.key === "sales" ? (
                      loading ? (
                        <div className="table-loading">Loading orders…</div>
                      ) : (
                        <div className="form-body">
                          <OrderBoard
                            items={visible}
                            onView={view}
                            language={language}
                          />
                        </div>
                      )
                    ) : layout === "cards" && module.key === "catalog" ? (
                      <div className="form-body">
                        <div className="product-grid">
                          {visible.map((p, i) => (
                            <article className="product-card" key={p._id}>
                              <ProductGallery product={p} api={api} />
                              <div className="product-info">
                                <div className="product-card-top">
                                  <h3>{productName(p, language)}</h3>
                                  <span>
                                    {p.active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <p>
                                  {[p.grade, p.origin, p.packaging]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                                <small>
                                  Minimum order: <b>{p.moq} t</b>
                                </small>
                                <div className="product-card-actions">
                                  <Button
                                    className="secondary small"
                                    onClick={() => view(p)}
                                  >
                                    {t("Details")}
                                  </Button>
                                  {rowActions.map((a) => (
                                    <Button
                                      key={a.path}
                                      className="secondary small"
                                      onClick={() => action(a, p)}
                                    >
                                      {t(a.title)}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                        {!visible.length && <Empty />}
                      </div>
                    ) : (
                      <DataTable
                        renderCell={(item, key) =>
                          key === "locations" ? (
                            <div className="button-row">
                              {item.locations?.map((l) => (
                                <Button
                                  key={l.warehouse}
                                  className="subtle small"
                                  onClick={() => setWarehouse(l.warehouse)}
                                >
                                  {l.name}: {l.quantity}
                                </Button>
                              ))}
                            </div>
                          ) : key === "images" ? (
                            <ProductImage
                              className="table-product-image"
                              product={item}
                              image={item.images?.[0]}
                              api={api}
                              thumbnail
                            />
                          ) : undefined
                        }
                        items={visible}
                        columns={module.columns || []}
                        rowActions={rowActions}
                        actionFilter={(a, r) =>
                          canUseAction(a, r, user.role, { cardEnabled })
                        }
                        onAction={action}
                        onView={view}
                        loading={loading}
                      />
                    )}
                    {module.key === "inventory" && (
                      <label>
                        Warehouse
                        <select
                          aria-label="Warehouse filter"
                          value={warehouse}
                          onChange={(e) => setWarehouse(e.target.value)}
                        >
                          <option value="">All warehouses</option>
                          {warehouseChoices.map((w) => (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="pagination">
                      <span>
                        {visible.length} records · Page {history.length + 1}
                      </span>
                      <Button
                        className="secondary small"
                        disabled={!history.length || loading}
                        onClick={() => {
                          setCursor(history.at(-1));
                          setHistory(history.slice(0, -1));
                        }}
                      >
                        {t("Previous page")}
                      </Button>
                      <Button
                        className="secondary small"
                        disabled={!next || loading}
                        onClick={() => {
                          setHistory([...history, cursor]);
                          setCursor(next);
                        }}
                      >
                        {t("Next page")}
                      </Button>
                    </div>
                  </section>
                </>
              ) : (
                <Empty />
              )}
            </>
          )}
          <footer className="workspace-footer">
            <span>{branding.name}</span>
            <span>USD · LIVE DATABASE · {new Date().getFullYear()}</span>
          </footer>
        </main>
      </div>
      {imageProduct && (
        <ProductImages
          api={api}
          product={imageProduct}
          initialTab={imageProduct.mediaTab}
          onClose={() => setImageProduct(null)}
          onUpdated={(product) => {
            setRows((rows) =>
              rows.map((row) =>
                recordId(row) === recordId(product) ? product : row,
              ),
            );
            setDetail((item) =>
              item && recordId(item) === recordId(product) ? product : item,
            );
          }}
        />
      )}
      {detail && module.key === "sales" ? (
        <OrderDetail
          api={api}
          id={recordId(detail)}
          user={user}
          onClose={() => setDetail(null)}
          onCommand={onCommand}
          refresh={refresh}
        />
      ) : detail && module.key === "reconciliation" ? (
        <StatementDetail
          api={api}
          id={recordId(detail)}
          onClose={() => setDetail(null)}
          onCommand={onCommand}
          refresh={refresh}
        />
      ) : (
        detail && (
          <Modal
            title={productName(detail, language) || "Record details"}
            onClose={() => setDetail(null)}
          >
            <div className="form-body">
              {module.key === "catalog" && (
                <>
                  <ProductGallery product={detail} api={api} large />
                  <ProductVideo
                    product={detail}
                    api={api}
                    editable={["admin", "manager", "procurement"].includes(
                      user.role,
                    )}
                    onUpdated={(p) => {
                      setDetail(p);
                      setReload((n) => n + 1);
                    }}
                  />
                  {user.role !== "customer" && (
                    <ProductStock api={api} id={recordId(detail)} />
                  )}
                </>
              )}
              <dl className="record-details">
                {Object.entries(detail)
                  .filter(
                    ([k]) => !["__v", "_labels", "lines", "images"].includes(k),
                  )
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt>{t(k === "_id" ? "Record ID" : label(k))}</dt>
                      <dd>
                        {typeof v === "object" &&
                        v !== null &&
                        !detail._labels?.[k] ? (
                          <pre className="detail-json">
                            {JSON.stringify(v, null, 2)}
                          </pre>
                        ) : (
                          display(detail._labels?.[k] ?? v, k, language)
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
              {detail.lines && (
                <DataTable
                  items={detail.lines}
                  columns={["account", "debitCents", "creditCents"]}
                />
              )}
              <div className="button-row" style={{ marginTop: 25 }}>
                {rowActions
                  .filter((a) =>
                    canUseAction(a, detail, user.role, { cardEnabled }),
                  )
                  .map((a) => (
                    <Button key={a.path} onClick={() => action(a, detail)}>
                      {t(a.title)}
                    </Button>
                  ))}
              </div>
            </div>
          </Modal>
        )
      )}
    </div>
  );
}
const descriptions = {
  sales: "Review quotations, collect payments and track every delivery.",
  inquiries: "Turn customer requirements into clear, accepted quotations.",
  catalog:
    "Manage translated product details, grades, packaging and minimum quantities.",
  inventory:
    "Track stock by product, batch and warehouse. Transfer with an audit trail.",
  payments:
    "Review TT evidence and confirm actual bank funds before fulfillment.",
  returns: "Inspect returned goods and complete the confirmed refund.",
  users: "Create verified staff accounts and manage their access.",
  auth: "Manage your account protection and personalize your workspace.",
  accounting:
    "Review balanced journals, post entries and close accounting periods.",
  reconciliation:
    "Import bank statements and match every transaction with the ledger.",
};
function OrderBoard({ items, onView, language }) {
  const groups = [
    ["Quotation", ["Awaiting acceptance"]],
    ["Payment", ["Deposit pending", "Ready to ship"]],
    ["Delivery", ["In transit", "Partially delivered"]],
    [
      "Closed / return",
      ["Delivered", "Return requested", "Refunded", "Cancelled"],
    ],
  ];
  return (
    <div className="board">
      {groups.map(([title, states]) => {
        const rows = items.filter((o) => states.includes(o.status));
        return (
          <section className="board-column" key={title}>
            <div className="board-heading">
              {title}
              <b>{rows.length}</b>
            </div>
            {rows.map((o) => (
              <button
                className="order-tile"
                key={o._id}
                onClick={() => onView(o)}
              >
                <small>
                  #{shortId(o)} · {o.status}
                </small>
                <h3>{productName(o, language)}</h3>
                <small>
                  {o._labels?.customer || o.border} · {o.quantity} t
                </small>
                <div className="payment-track">
                  <i
                    style={{
                      width: `${Math.min(100, (o.paidCents / o.totalCents) * 100)}%`,
                    }}
                  />
                </div>
                <small>{money(o.paidCents)} verified</small>
                <div className="order-tile-footer">
                  <span>{o.border}</span>
                  <span className="tile-amount">{money(o.totalCents)}</span>
                </div>
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}
