"use client";
import { Localized } from "../../shared/i18n.jsx";
import { useState } from "react";
import { reportCsv } from "../../shared/csv.js";
import DataTable from "../../shared/DataTable.jsx";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import { label, money } from "../../shared/format.js";
export default function Reports({ api }) {
  const [kind, setKind] = useState("income-statement"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [order, setOrder] = useState(""),
    [data, setData] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function load(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const qs = new URLSearchParams();
      if (
        from &&
        !["balance-sheet", "trial-balance", "order-profit"].includes(kind)
      )
        qs.set("from", from);
      if (to && !["trial-balance", "order-profit"].includes(kind))
        qs.set("to", to);
      const path =
        kind === "order-profit"
          ? `/reports/orders/${order}/profit`
          : `/reports/${kind}`;
      setData(await api.request(path + (qs.size ? "?" + qs : "")));
    } catch (e) {
      setData(null);
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  function exportReport() {
    const reportRows = Array.isArray(data)
      ? data
      : data?.rows || [
          Object.fromEntries(
            Object.entries(data || {}).filter(([, v]) => typeof v !== "object"),
          ),
        ];
    const url = URL.createObjectURL(
      new Blob([reportCsv(reportRows)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = kind + "-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const rows = Array.isArray(data) ? data : data?.rows || [];
  return (
    <Localized>
      <section className="panel">
        <form className="report-form" onSubmit={load}>
          <label>
            Report
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setData(null);
              }}
            >
              {[
                ["income-statement", "Income statement"],
                ["balance-sheet", "Balance sheet"],
                ["cash-movements", "Cash movements"],
                ["trial-balance", "Trial balance (all time)"],
                ["order-profit", "Order profitability"],
              ].map(([v, title]) => (
                <option value={v} key={v}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          {kind === "order-profit" ? (
            <label>
              Order ID
              <input
                value={order}
                required
                pattern="[a-fA-F0-9]{24}"
                onChange={(e) => setOrder(e.target.value)}
              />
            </label>
          ) : (
            kind !== "trial-balance" && (
              <>
                {kind !== "balance-sheet" && (
                  <label>
                    From
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </label>
                )}
                <label>
                  To
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
              </>
            )
          )}
          <Button disabled={busy}>
            {busy ? "Loading…" : "Generate report"}
          </Button>
        </form>
        <div className="form-body">
          {data && (
            <div className="button-row" style={{ marginBottom: 20 }}>
              <Button className="secondary small" onClick={exportReport}>
                Export CSV
              </Button>
              <Button
                className="secondary small"
                onClick={() => window.print()}
              >
                Print report
              </Button>
            </div>
          )}
          <ErrorBox error={error} />
          {data && (
            <>
              <div className="detail-metrics">
                {Object.entries(data)
                  .filter(([k]) => /Cents$/.test(k))
                  .map(([k, v]) => (
                    <div key={k}>
                      <span>{label(k).replace(" (cents)", "")}</span>
                      <b>{money(v)}</b>
                    </div>
                  ))}
              </div>
              {data.balanced !== undefined && (
                <p className="notice">
                  Balance sheet:{" "}
                  {data.balanced ? "Balanced" : "Review required"}
                </p>
              )}
              {kind !== "order-profit" && (
                <DataTable
                  items={rows}
                  columns={
                    rows.some((r) => r.amountCents !== undefined)
                      ? ["name", "type", "amountCents"]
                      : ["_id", "debitCents", "creditCents"]
                  }
                />
              )}
            </>
          )}
          {!data && !error && (
            <p className="muted">
              Select a report and date range to view live accounting results.
            </p>
          )}
        </div>
      </section>
    </Localized>
  );
}
