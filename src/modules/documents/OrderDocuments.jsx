"use client";
import { usePreferences, Localized } from "../../shared/i18n.jsx";
import DocumentViewer from "./DocumentViewer.jsx";
import ReceiptUpload from "./ReceiptUpload.jsx";
import { useEffect, useState } from "react";
import { Button, ErrorBox, Badge } from "../../shared/ui.jsx";
import Icon from "../../shared/icons.jsx";
import { date } from "../../shared/format.js";
export async function download(api, path, name) {
  const blob = await api.request(path, { blob: true });
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function OrderDocuments({
  api,
  id,
  user,
  onCommand,
  refresh,
  invoices = [],
  accepted = false,
}) {
  const { t } = usePreferences();
  const [items, setItems] = useState([]),
    [cursor, setCursor] = useState(""),
    [next, setNext] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0),
    [message, setMessage] = useState(""),
    [viewing, setViewing] = useState(null);
  useEffect(() => {
    let live = true;
    api
      .request(
        `/orders/${id}/documents?limit=25` +
          (cursor ? "&cursor=" + cursor : ""),
      )
      .then((r) => {
        if (live) {
          setItems(r.items);
          setNext(r.nextCursor);
        }
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api, id, cursor, reload, refresh]);
  async function run(task) {
    setError(null);
    setBusy(true);
    try {
      await task();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form),
      file = data.get("file");
    await run(async () => {
      if (
        !["application/pdf", "image/png", "image/jpeg"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
        throw Error("Choose a PDF, PNG, or JPEG up to 5 MiB.");
      const name =
        file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150) || "document";
      await api.request(`/orders/${id}/documents`, {
        method: "POST",
        raw: true,
        body: file,
        headers: {
          "Content-Type": file.type,
          "X-Document-Name": name,
          "X-Document-Kind": data.get("kind"),
        },
      });
      setMessage(
        "Document uploaded. It will become downloadable after a clean scanner result.",
      );
      setCursor("");
      setReload((n) => n + 1);
      form.reset();
    });
  }
  return (
    <Localized>
      <section className="detail-section">
        <h3>Trade documents</h3>
        {["admin", "manager", "seller"].includes(user.role) && accepted && (
          <Button
            className="secondary"
            onClick={() =>
              onCommand({
                title: "Issue invoice",
                path: "/orders/{id}/invoices",
                method: "POST",
                id,
              })
            }
          >
            Issue invoice
          </Button>
        )}
        {invoices.map((i) => (
          <div className="document-row" key={i._id}>
            <b>{i.number}</b>
            <Button
              className="secondary small"
              onClick={() =>
                setViewing({
                  path: `/invoices/${i._id}/pdf`,
                  title: "Commercial invoice",
                  name: `${i.number}.pdf`,
                })
              }
            >
              View / print invoice
            </Button>
            <Button
              className="secondary small"
              onClick={() =>
                run(() =>
                  download(api, `/invoices/${i._id}/pdf`, `${i.number}.pdf`),
                )
              }
            >
              Download issued invoice
            </Button>
          </div>
        ))}
        <div className="button-row">
          {(accepted
            ? ["proforma", "invoice", "packing-list"]
            : ["proforma", "packing-list"]
          ).map((kind) => (
            <span className="document-actions" key={kind}>
              <Button
                className="secondary small"
                onClick={() =>
                  setViewing({
                    path: `/orders/${id}/documents/${kind}.pdf`,
                    title: {
                      proforma: "Proforma invoice",
                      invoice: "Commercial invoice",
                      "packing-list": "Packing list",
                    }[kind],
                    name: `${kind}-${id}.pdf`,
                  })
                }
              >
                {t(
                  {
                    proforma: "View / print proforma",
                    invoice: "View / print invoice",
                    "packing-list": "View / print packing list",
                  }[kind],
                )}
              </Button>
              <Button
                icon="file"
                className="secondary small"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    download(
                      api,
                      `/orders/${id}/documents/${kind}.pdf`,
                      `${kind}-${id}.pdf`,
                    ),
                  )
                }
              >
                {t(
                  {
                    proforma: "Proforma PDF",
                    invoice: "Invoice PDF",
                    "packing-list": "Packing list PDF",
                  }[kind],
                )}
              </Button>
            </span>
          ))}
        </div>
        <h3 style={{ marginTop: 25 }}>Uploaded documents</h3>
        <div className="document-list">
          {items.map((doc) => (
            <article className="document-row" key={doc._id}>
              <Icon name="file" />
              <div>
                <b>{doc.name}</b>
                <small>
                  {doc.kind.replaceAll("-", " ")} ·{" "}
                  {(doc.size / 1024).toFixed(1)} KB · {date(doc.createdAt)}
                </small>
              </div>
              <Badge>{doc.status}</Badge>
              <Button
                className="secondary small"
                disabled={busy || doc.status !== "Clean"}
                onClick={() =>
                  run(() =>
                    download(
                      api,
                      doc.normalized
                        ? `/receipts/${doc._id}`
                        : `/documents/${doc._id}`,
                      doc.name,
                    ),
                  )
                }
              >
                Download
              </Button>
              {user.role === "admin" && doc.status === "Quarantined" && (
                <Button
                  className="secondary small"
                  onClick={() =>
                    onCommand({
                      title: "Scan document",
                      path: "/documents/{id}/scan",
                      id: doc._id,
                      method: "POST",
                    })
                  }
                >
                  Scan
                </Button>
              )}
            </article>
          ))}
          {!items.length && (
            <p className="muted">No uploaded documents for this order yet.</p>
          )}
        </div>
        <div className="button-row">
          <Button
            className="subtle small"
            onClick={() => setReload((n) => n + 1)}
            icon="refresh"
          >
            Refresh scan results
          </Button>
          {cursor && (
            <Button className="secondary small" onClick={() => setCursor("")}>
              First page
            </Button>
          )}
          {next && (
            <Button className="secondary small" onClick={() => setCursor(next)}>
              Next page
            </Button>
          )}
        </div>
        <ReceiptUpload
          api={api}
          id={id}
          onUploaded={() => {
            setReload((n) => n + 1);
            setMessage(
              "Receipt uploaded. Select it when recording your TT payment.",
            );
          }}
        />
        <details>
          <summary>
            Additional scanned documents (requires enabled document storage)
          </summary>
          <form onSubmit={upload} className="upload-form">
            <label>
              Document kind
              <select name="kind">
                <option value="payment-receipt">Payment receipt</option>
                {user.role !== "customer" && (
                  <option value="trade-document">Trade document</option>
                )}
              </select>
            </label>
            <label>
              PDF, PNG or JPEG · max 5 MiB
              <input
                name="file"
                type="file"
                required
                accept="application/pdf,image/png,image/jpeg"
              />
            </label>
            <Button icon="plus" disabled={busy} type="submit">
              Upload
            </Button>
          </form>
        </details>
        {message && (
          <p className="success-note" role="status">
            {message}
          </p>
        )}
        <ErrorBox error={error} />
        {viewing && (
          <DocumentViewer
            api={api}
            document={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </section>
    </Localized>
  );
}
