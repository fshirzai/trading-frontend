"use client";
import { useEffect, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import { recordId } from "../../shared/format.js";
export default function ProductVideo({
  product,
  api,
  onUpdated,
  editable = false,
  onBusyChange,
}) {
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(null);
  const [privateUrl, setPrivateUrl] = useState(""),
    [previewError, setPreviewError] = useState(null);
  const privatePreview = product.active === false;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    setPrivateUrl("");
    setPreviewError(null);
    if (!privatePreview || !product.video || !api) return;
    let live = true,
      url;
    const controller = new AbortController();
    (async () => {
      try {
        const meta = await api.request(
          `/products/${recordId(product)}/video-info`,
          { signal: controller.signal },
        );
        const chunks = [];
        for (let offset = 0; offset < meta.size; offset += 1024 * 1024) {
          const b = await api.request(`/products/${recordId(product)}/video`, {
            blob: true,
            signal: controller.signal,
            headers: {
              Range: `bytes=${offset}-${Math.min(meta.size - 1, offset + 1024 * 1024 - 1)}`,
            },
          });
          chunks.push(b);
        }
        if (live) {
          url = URL.createObjectURL(new Blob(chunks, { type: meta.mime }));
          setPrivateUrl(url);
        }
      } catch (e) {
        if (live && e.name !== "AbortError") setPreviewError(e);
      }
    })();
    return () => {
      live = false;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, privatePreview, product.video, product._id]);
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
      {product.video && (!privatePreview || privateUrl) ? (
        <video
          key={String(product.video)}
          controls
          preload="metadata"
          style={{ width: "100%", maxHeight: 360, borderRadius: 12 }}
          src={
            privatePreview
              ? privateUrl
              : `${process.env.NEXT_PUBLIC_API_URL || "/api"}/catalog/${recordId(product)}/video`
          }
        />
      ) : (
        <p className="muted">
          {product.video
            ? "Loading private video preview..."
            : "No video uploaded."}
        </p>
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
      <ErrorBox error={error || previewError} />
    </section>
  );
}
