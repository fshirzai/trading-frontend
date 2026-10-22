"use client";
import { useEffect, useState } from "react";
import Icon from "../../shared/icons.jsx";
import { Badge, Button, ErrorBox } from "../../shared/ui.jsx";
import { Empty } from "../../shared/ui.jsx";
import { money, productName, shortId, date } from "../../shared/format.js";
import { usePreferences } from "../../shared/i18n.jsx";
export default function Dashboard({
  api,
  user,
  onNavigate,
  onView,
  onCommand,
  refresh,
}) {
  const { t, language } = usePreferences();
  const [data, setData] = useState(null),
    [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    setError(null);
    api
      .request("/workspace/summary")
      .then((r) => {
        if (live) setData(r);
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api, refresh]);
  const totals = data?.totals;
  const active = (data?.stages || [])
    .filter((s) => !["Delivered", "Refunded", "Cancelled"].includes(s._id))
    .reduce((n, s) => n + s.count, 0);
  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 29 + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, ...data?.daily.find((x) => x._id === key) };
  });
  const max = Math.max(1, ...daily.map((x) => x.valueCents || 0));
  if (user.role === "procurement")
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">PROCUREMENT WORKSPACE</span>
            <h1>Welcome back, {user.name?.split(" ")[0]}</h1>
            <p>
              Review shortages, purchase stock and receive it into the right
              warehouse.
            </p>
          </div>
        </div>
        <ErrorBox error={error} />
        <div className="metric-grid">
          {[
            [
              "Open procurement requests",
              data?.procurement?.requests,
              "procurementRequests",
            ],
            [
              "Purchases awaiting receipt",
              data?.procurement?.purchases,
              "procurement",
            ],
            ["Active warehouses", data?.procurement?.warehouses, "warehouses"],
          ].map(([title, value, key]) => (
            <article className="metric" key={key}>
              <span>{title}</span>
              <strong>{value ?? "..."}</strong>
              <Button onClick={() => onNavigate(key)}>Open</Button>
            </article>
          ))}
        </div>
        <div className="button-row">
          <Button onClick={() => onNavigate("inventory")}>
            Warehouse stock
          </Button>
          <Button onClick={() => onNavigate("catalog")}>
            Products and media
          </Button>
        </div>
      </>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            LIVE OPERATIONS · {data?.scope || "Loading"}
          </span>
          <h1>
            {t("Welcome back")}, {user.name?.split(" ")[0]}
            <span className="heading-dot">.</span>
          </h1>
          <p>
            {t(
              "Your orders, payments and deliveries, connected to your company database.",
            )}
          </p>
        </div>
        <Button
          icon="plus"
          onClick={() =>
            onNavigate(
              user.role === "procurement" ? "procurement" : "inquiries",
            )
          }
        >
          {t(user.role === "procurement" ? "Purchases" : "Inquiries")}
        </Button>
      </div>
      <ErrorBox error={error} />
      <div className="metric-grid">
        {[
          ["box", "Total orders", totals?.orders],
          ["wallet", "Order value", totals ? money(totals.totalCents) : null],
          [
            "check",
            "Verified payments",
            totals ? money(totals.paidCents) : null,
          ],
          ["truck", "Active orders", totals ? active : null],
        ].map(([icon, title, value]) => (
          <article className="metric" key={title}>
            <div>
              <span>{t(title)}</span>
              <Icon name={icon} />
            </div>
            <strong>{value ?? "—"}</strong>
            <small>{data?.scope || "Loading database totals"}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t("Recent orders")}</h2>
              <p>{t("Latest orders from your database")}</p>
            </div>
            <Button className="subtle" onClick={() => onNavigate("sales")}>
              {t("View all")}
              <Icon name="arrow" size={16} />
            </Button>
          </div>
          {!data && !error ? (
            <div className="table-loading">{t("Loading…")}</div>
          ) : data?.recent.length ? (
            <div className="order-list">
              {data.recent.map((o, i) => (
                <article key={o._id}>
                  <div className={`order-product tone-${i % 3}`}>
                    <Icon name="leaf" size={25} />
                  </div>
                  <div className="order-main">
                    <b>{productName(o, language) || shortId(o)}</b>
                    <small>
                      {o._labels?.customer || "#" + shortId(o)} · {o.quantity} t
                      · {o.border}
                    </small>
                  </div>
                  <div className="order-amount">
                    <b>{money(o.totalCents)}</b>
                    <Badge>{o.status}</Badge>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={t("View order")}
                    onClick={() => onView(o)}
                  >
                    <Icon name="arrow" size={18} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="No orders yet"
              text="Create an inquiry to start your first trade."
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t("Trade activity")}</h2>
              <p>{t("Order value over the last 30 days · USD")}</p>
            </div>
            <Icon name="chart" />
          </div>
          <div className="form-body">
            <div className="trend-chart" aria-label="Daily order value chart">
              {daily.map((d) => (
                <div
                  key={d.date}
                  className="trend-bar"
                  style={{
                    height: d.valueCents
                      ? `${Math.max(3, (d.valueCents / max) * 100)}%`
                      : "2px",
                    opacity: d.valueCents ? 0.8 : 0.15,
                  }}
                  title={`${d.date}: ${money(d.valueCents || 0)} · ${d.orders || 0} orders`}
                />
              ))}
            </div>
            <div className="trend-axis">
              <span>{date(daily[0].date)}</span>
              <span>{date(daily.at(-1).date)}</span>
            </div>
            <div className="detail-metrics">
              <div>
                <span>{t("Outstanding balance")}</span>
                <b>{totals ? money(totals.outstandingCents) : "—"}</b>
              </div>
              <div>
                <span>{t("Refunded")}</span>
                <b>{totals ? money(totals.refundedCents) : "—"}</b>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t("Order progress")}</h2>
              <p>{t("All orders in your permitted scope")}</p>
            </div>
          </div>
          <div className="stage-list">
            {(data?.stages || []).map((s, i) => (
              <div key={s._id}>
                <div>
                  <span>
                    <i className={`stage-dot stage-${i % 5}`} />
                    {t(s._id)}
                  </span>
                  <b>{s.count}</b>
                </div>
                <div className="stage-track">
                  <span
                    className={`stage-${i % 5}`}
                    style={{
                      width: `${totals?.orders ? (s.count / totals.orders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {data && !data.stages.length && (
              <p className="muted">No orders yet.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>{t("Needs attention")}</h2>
            <Icon name="bell" />
          </div>
          <div className="activity-feed">
            <article>
              <Icon name="file" />
              <div>
                <p>
                  <b>{data?.newInquiries ?? "—"}</b>{" "}
                  {t("inquiries waiting for quotation")}
                </p>
                <Button
                  className="subtle small"
                  onClick={() => onNavigate("inquiries")}
                >
                  {t("Inquiries")}
                </Button>
              </div>
            </article>
            {data?.pendingPayments !== null && (
              <article>
                <Icon name="wallet" />
                <div>
                  <p>
                    <b>{data?.pendingPayments ?? "—"}</b>{" "}
                    {t("payments waiting for bank verification")}
                  </p>
                  <Button
                    className="subtle small"
                    onClick={() => onNavigate("payments")}
                  >
                    {t("Payments")}
                  </Button>
                </div>
              </article>
            )}
            {data?.inventory && (
              <article>
                <Icon name="box" />
                <div>
                  <p>
                    <b>{Number(data.inventory.quantity.toFixed(3))} t</b>{" "}
                    {t("available across warehouses")}
                  </p>
                  <small>{data.inventory.batches} stock batches</small>
                  <Button
                    className="subtle small"
                    onClick={() => onNavigate("inventory")}
                  >
                    {t("Inventory")}
                  </Button>
                </div>
              </article>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
