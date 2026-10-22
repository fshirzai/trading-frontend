"use client";
import { useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import { recordId } from "../../shared/format.js";
export default function ProductVideo({
  product,
  api,
  onUpdated,
  editable = false,
}) {
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(null);
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      if (
        !["video/mp4", "video/webm"].includes(file.type) ||
        file.size > 30 * 1024 * 1024
      )
        throw Error("Choose MP4 or WebM up to 30 MiB.");
      const root = `/products/${recordId(product)}/video`;
      const upload = await api.request(root, {
        method: "POST",
        body: { size: file.size, mime: file.type },
      });
      for (
        let offset = 0, part = 0;
        offset < file.size;
        offset += upload.chunkSize, part++
      ) {
        await api.request(`${root}/${upload.id}/chunks`, {
          method: "POST",
          raw: true,
          body: file.slice(offset, offset + upload.chunkSize),
          headers: { "Content-Type": file.type, "X-Video-Chunk": String(part) },
        });
        setProgress(
          Math.min(
            100,
            Math.round(((offset + upload.chunkSize) / file.size) * 100),
          ),
        );
      }
      const result = await api.request(`${root}/${upload.id}/complete`, {
        method: "POST",
        body: {},
      });
      onUpdated?.(result.product);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }
  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.request(
        `/products/${recordId(product)}/video/remove`,
        { method: "POST", body: {} },
      );
      onUpdated?.(r.product);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="detail-section">
      <h3>Product video</h3>
      {product.video ? (
        <video
          key={String(product.video)}
          controls
          preload="metadata"
          style={{ width: "100%", maxHeight: 360, borderRadius: 12 }}
          src={`/api/catalog/${recordId(product)}/video`}
        />
      ) : (
        <p className="muted">No video uploaded.</p>
      )}
      {editable && (
        <div className="button-row">
          <label>
            Upload or replace one video (MP4/WebM, max 30 MiB)
            <input
              aria-label="Product video"
              type="file"
              accept="video/mp4,video/webm"
              onChange={upload}
              disabled={busy}
            />
          </label>
          <Button disabled={busy} className="secondary" onClick={remove}>
            Remove video / unfinished uploads
          </Button>
        </div>
      )}
      {busy && <p role="status">Uploading: {progress}%</p>}
      <ErrorBox error={error} />
    </section>
  );
}
