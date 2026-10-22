"use client";
import ReceiptUpload from "../documents/ReceiptUpload.jsx";
import { useEffect, useState } from "react";
import { Button, ErrorBox, Modal, Badge } from "../../shared/ui.jsx";
import DataTable from "../../shared/DataTable.jsx";
import { date, money, productName, shortId } from "../../shared/format.js";
import {
  canUseAction,
  orderStages,
  orderStageIndex,
  returnEstimate,
} from "../../shared/workflows.js";
import { usePreferences } from "../../shared/i18n.jsx";
import OrderDocuments from "../documents/OrderDocuments.jsx";
import sales from "./module.js";
import returnsModule from "../returns/module.js";
export default function OrderDetail({
  api,
  id,
  user,
  onClose,
  onCommand,
  refresh,
}) {
  const { t, language } = usePreferences();
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [methods, setMethods] = useState([]),
    [tab, setTab] = useState("overview"),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    setError(null);
    Promise.all([api.request(`/orders/${id}`), api.request("/payment-methods")])
      .then(([r, m]) => {
        if (live) {
          setData(r);
          setMethods(m.methods);
        }
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api, id, refresh, reload]);
  const o = data?.order,
    cardEnabled = methods.some((m) => m.method === "VISA" && m.enabled);
  const actions = o
    ? sales.rowActions.filter((a) =>
        canUseAction(a, o, user.role, { cardEnabled }),
      )
    : [];
  const quote = o ? returnEstimate(o, data.shipments) : null;
  const stage = o ? orderStageIndex(o) : -1;
  function command(a, r = o) {
    onCommand({
      ...a,
      id: r._id,
      context: a.path.endsWith("/shipments") ? { ...r, items: o.items } : r,
      initial: a.path.endsWith("/shipments")
        ? {
            item: o.items?.[0]?._id,
            quantity: Math.max(
              0,
              (o.items?.[0]?.quantity || o.quantity) -
                data.shipments
                  .filter((s) => !o.items?.length || s.item === o.items[0]._id)
                  .reduce((n, s) => n + s.quantity, 0),
            ),
          }
        : a.path.endsWith("/payments") || a.path.endsWith("/checkout")
          ? {
              ...a.initial,
              amount: Math.max(0, (o.totalCents - o.paidCents) / 100),
            }
          : a.path.endsWith("/revise")
            ? {
                productTotal: o.productCents / 100,
                deliveryFees: o.feesCents / 100,
                border: o.border,
                splitIncluded: o.splitIncluded,
                items: o.items?.map((i) => ({
                  product: i.product,
                  quantity: i.quantity,
                  productTotal: i.productCents / 100,
                })),
              }
            : undefined,
    });
  }
  return (
    <Modal title={"Order #" + shortId(id)} onClose={onClose}>
      <div className="form-body detail-body">
        <ErrorBox error={error} />
        {o ? (
          <>
            <div className="detail-top">
              <div>
                <span className="eyebrow">
                  {o._labels?.customer || "CUSTOMER ORDER"} · {o.border}
                </span>
                <h2>{productName(o, language)}</h2>
                <p>
                  {o.items?.length > 1
                    ? `${o.items.length} product lines`
                    : `${o.quantity} ${o.productSnapshot?.unit || "units"}`}{" "}
                  · Quotation v{o.version} · {date(o.createdAt)}
                </p>
              </div>
              <Badge>{o.status}</Badge>
            </div>
            <div className="flow-steps">
              {orderStages.map((s, i) => (
                <div
                  key={s}
                  className={`flow-step ${i < stage ? "done" : i === stage ? "current" : ""}`}
                >
                  {i + 1}. {t(s)}
                </div>
              ))}
            </div>
            <div className="detail-metrics">
              {[
                ["Order total", o.totalCents],
                ["Verified paid", o.paidCents],
                ["Refunded", o.refundedCents],
                ["Outstanding", Math.max(0, o.totalCents - o.paidCents)],
              ].map(([title, value]) => (
                <div key={title}>
                  <span>{t(title)}</span>
                  <b>{money(value)}</b>
                </div>
              ))}
            </div>
            <div className="button-row">
              {actions.map((a) => (
                <Button
                  className={
                    a.path.endsWith("/accept") ? "" : "secondary small"
                  }
                  key={a.path}
                  onClick={() => command(a)}
                >
                  {t(a.title)}
                </Button>
              ))}
            </div>
            {user.role !== "customer" && (
              <div className="button-row">
                <Button
                  className="secondary small"
                  disabled={
                    !o.acceptedAt ||
                    ["Return requested", "Refunded", "Delivered"].includes(
                      o.status,
                    )
                  }
                  onClick={() =>
                    command({
                      title: "Allocate available stock",
                      path: "/orders/{id}/reserve",
                      method: "POST",
                    })
                  }
                >
                  Allocate stock
                </Button>
                {["admin", "manager", "seller"].includes(user.role) && (
                  <Button
                    className="secondary small"
                    disabled={
                      !o.acceptedAt ||
                      ["Return requested", "Refunded", "Delivered"].includes(
                        o.status,
                      )
                    }
                    onClick={() =>
                      command({
                        title: "Request procurement for shortage",
                        path: "/orders/{id}/procurement-requests",
                        method: "POST",
                      })
                    }
                  >
                    Request procurement
                  </Button>
                )}
              </div>
            )}
            <div className="detail-tabs">
              {[
                "overview",
                "payments",
                "shipments",
                "returns",
                "documents",
                "history",
                ...(user.role !== "customer"
                  ? ["reservations", "procurementRequests"]
                  : []),
              ].map((name) => (
                <button
                  key={name}
                  className={tab === name ? "active" : ""}
                  onClick={() => setTab(name)}
                >
                  {t(name[0].toUpperCase() + name.slice(1))}
                  {name !== "overview" && name !== "documents"
                    ? ` (${data[name]?.length || 0})`
                    : ""}
                </button>
              ))}
            </div>
            {tab === "overview" && (
              <section className="detail-section">
                <h3>Order products</h3>
                <DataTable
                  items={(o.items?.length
                    ? o.items
                    : [
                        {
                          _id: "legacy",
                          snapshot: o.productSnapshot,
                          quantity: o.quantity,
                          productCents: o.productCents,
                        },
                      ]
                  ).map((i) => ({
                    ...i,
                    name: i.snapshot?.name,
                    unit: i.snapshot?.unit,
                  }))}
                  columns={["name", "quantity", "unit", "productCents"]}
                />
                <h3>{t("Accepted trade terms")}</h3>
                <dl className="record-details">
                  {[
                    ["Product value", money(o.productCents)],
                    ["Delivery fees", money(o.feesCents)],
                    ["Border handover", o.border],
                    [
                      "Split deliveries included",
                      o.splitIncluded ? "Yes" : "No",
                    ],
                    [
                      "Return request window",
                      o.returnHours + " hours after first handover",
                    ],
                    [
                      "Accepted",
                      o.acceptedAt
                        ? date(o.acceptedAt)
                        : "Awaiting customer acceptance",
                    ],
                    ["Grade", o.productSnapshot?.grade || "—"],
                    ["Packaging", o.productSnapshot?.packaging || "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{t(k)}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="notice">
                  <b>{t("Return / cancellation estimate")}</b>
                  <p>
                    {t("Based on payments received and dispatch status:")}{" "}
                    retained {money(quote.retainedCents)}, estimated refund{" "}
                    {money(quote.refundCents)}. The backend confirms the final
                    amount and eligibility.
                  </p>
                  {quote.deadline && (
                    <p>
                      Return-request deadline:{" "}
                      <b>{new Date(quote.deadline).toLocaleString()}</b>
                    </p>
                  )}
                  <p>
                    Goods must pass condition inspection. Added deliveries
                    require accepted extra fees.
                  </p>
                </div>
                {o.proformaHistory?.length > 0 && (
                  <details>
                    <summary>
                      Previous quotation versions ({o.proformaHistory.length})
                    </summary>
                    {o.proformaHistory.map((h, i) => (
                      <div className="notice" key={i}>
                        Version {h.version} ·{" "}
                        {money(h.totalCents || h.productCents + h.feesCents)} ·{" "}
                        {h.reason || "Revised terms"}
                      </div>
                    ))}
                  </details>
                )}
              </section>
            )}
            {tab === "payments" && (
              <section className="detail-section">
                <h3>{t("Payments")}</h3>
                {!!o.acceptedAt &&
                  !["Return requested", "Refunded"].includes(o.status) && (
                    <ReceiptUpload
                      api={api}
                      id={id}
                      onUploaded={(receiptKey) => {
                        setReload((n) => n + 1);
                        command({
                          title: "Record TT payment",
                          path: "/orders/{id}/payments",
                          method: "POST",
                          initial: { receiptKey },
                        });
                      }}
                    />
                  )}
                <DataTable
                  items={data.payments}
                  columns={[
                    "amountCents",
                    "method",
                    "reference",
                    "status",
                    "verifiedAt",
                  ]}
                  rowActions={
                    ["admin", "manager"].includes(user.role)
                      ? [
                          {
                            title: "Verify bank funds",
                            path: "/payments/{id}/verify",
                            method: "POST",
                          },
                        ]
                      : []
                  }
                  actionFilter={(a, r) => canUseAction(a, r, user.role)}
                  onAction={command}
                />
                <p className="notice">
                  Uploading a receipt does not mark a payment as received. An
                  administrator or manager must confirm actual bank funds.
                </p>
              </section>
            )}
            {tab === "shipments" && (
              <section className="detail-section">
                <h3>{t("Shipments")}</h3>
                <DataTable
                  items={data.shipments}
                  columns={[
                    "quantity",
                    "driver",
                    "vehicle",
                    "status",
                    "handedOverAt",
                  ]}
                  rowActions={
                    ["admin", "manager", "seller"].includes(user.role)
                      ? [
                          {
                            title: "Record handover",
                            path: "/shipments/{id}/handover",
                            method: "POST",
                          },
                        ]
                      : []
                  }
                  actionFilter={(a, r) => canUseAction(a, r, user.role)}
                  onAction={command}
                />
              </section>
            )}
            {tab === "returns" && (
              <section className="detail-section">
                <h3>{t("Returns & refunds")}</h3>
                <DataTable
                  items={data.returns}
                  columns={[
                    "reason",
                    "retainedCents",
                    "refundCents",
                    "status",
                    "requestedAt",
                  ]}
                  rowActions={returnsModule.rowActions.filter((a) =>
                    a.roles.includes(user.role),
                  )}
                  actionFilter={(a, r) => canUseAction(a, r, user.role)}
                  onAction={command}
                />
              </section>
            )}
            {tab === "history" && (
              <section className="detail-section">
                <h3>Approval and action history</h3>
                <DataTable
                  items={data.history || []}
                  columns={
                    user.role === "customer"
                      ? ["action", "createdAt"]
                      : ["action", "actor", "details", "createdAt"]
                  }
                />
              </section>
            )}
            {tab === "reservations" && (
              <section className="detail-section">
                <h3>Reserved stock</h3>
                <DataTable
                  items={data.reservations || []}
                  columns={["item", "batch", "quantity", "status"]}
                />
              </section>
            )}
            {tab === "procurementRequests" && (
              <section className="detail-section">
                <h3>Linked procurement</h3>
                <DataTable
                  items={data.procurementRequests || []}
                  columns={[
                    "product",
                    "quantity",
                    "receivedQuantity",
                    "status",
                  ]}
                />
              </section>
            )}
            {tab === "documents" && (
              <OrderDocuments
                api={api}
                id={id}
                user={user}
                onCommand={onCommand}
                refresh={refresh}
                invoices={data.invoices || []}
              />
            )}
          </>
        ) : (
          !error && <div className="table-loading">{t("Loading…")}</div>
        )}
      </div>
    </Modal>
  );
}
