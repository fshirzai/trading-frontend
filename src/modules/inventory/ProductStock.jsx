"use client";
import { useEffect, useState } from "react";
import { ErrorBox } from "../../shared/ui.jsx";
export default function ProductStock({ api, id }) {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    api
      .request(`/stock/summary?product=${id}`)
      .then((r) => {
        if (live) setRows(r.items);
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api, id]);
  const stock = rows[0];
  return (
    <section className="detail-section">
      <h3>Stock locations</h3>
      <ErrorBox error={error} />
      {stock ? (
        <>
          <p>
            On hand: <b>{stock.quantity}</b> · Reserved: {stock.reserved} ·
            Available: <b>{stock.available}</b>
          </p>
          <div className="document-list">
            {stock.locations.map((l) => (
              <article className="document-row" key={l.warehouse}>
                <b>{l.name}</b>
                <span>
                  On hand: {l.quantity} · Available: {l.available} ·
                  Quarantined: {l.quarantined}
                </span>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="muted">No warehouse stock recorded.</p>
      )}
    </section>
  );
}
