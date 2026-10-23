"use client";
import { Localized } from "../../shared/i18n.jsx";
import { useState } from "react";
import { ErrorBox, Button } from "../../shared/ui.jsx";
export default function ReceiptUpload({ api, id, onUploaded }) {
  const [file, setFile] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (
        !file ||
        file.size > 3 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw Error("Choose a JPEG, PNG or WebP receipt up to 3 MiB.");
      const result = await api.request(`/orders/${id}/receipts`, {
        method: "POST",
        raw: true,
        body: file,
        headers: { "Content-Type": file.type },
      });
      onUploaded?.(result.id);
      setFile(null);
      e.target.reset();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Localized>
      <form className="upload-form" onSubmit={submit}>
        <h3>TT receipt</h3>
        <p>
          Upload a clear receipt image, then select it when recording the TT
          payment. Bank verification is separate.
        </p>
        <input
          type="file"
          required
          aria-label="TT receipt image"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => setFile(e.target.files?.[0])}
        />
        <Button type="submit" disabled={busy}>
          Upload receipt
        </Button>
        <ErrorBox error={error} />
      </form>
    </Localized>
  );
}
