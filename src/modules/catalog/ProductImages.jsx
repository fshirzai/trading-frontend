"use client";
import ProductVideo from "./ProductVideo.jsx";
import { useEffect, useState } from "react";
import { Button, ErrorBox, Modal } from "../../shared/ui.jsx";
import Icon from "../../shared/icons.jsx";
import { productName, recordId } from "../../shared/format.js";
import { usePreferences } from "../../shared/i18n.jsx";

export const MAX_IMAGES = 8;
export function validateImageFiles(files, remaining = MAX_IMAGES) {
  if (files.length > remaining)
    throw Error(`Choose at most ${remaining} more images.`);
  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw Error("Choose JPG, PNG or WebP images.");
    if (!file.size || file.size > 3 * 1024 * 1024)
      throw Error("Each image must be between 1 byte and 3 MB.");
  }
}
export function imagePath(
  product,
  image,
  thumbnail = false,
  privateImage = false,
) {
  const id = recordId(product);
  if (
    !/^[a-f\d]{24}$/i.test(id || "") ||
    !/^[a-f\d]{24}$/i.test(image?.id || "")
  )
    return "";
  return `/${privateImage ? "products" : "catalog"}/${id}/images/${image.id}${thumbnail ? "/thumb" : ""}`;
}
export function ProductImage({
  product,
  image,
  api,
  thumbnail = false,
  className = "",
  alt,
}) {
  const [privateUrl, setPrivateUrl] = useState(""),
    [failed, setFailed] = useState(false);
  const privateImage = product.active === false && !!api;
  const path = imagePath(product, image, thumbnail, privateImage);
  useEffect(() => {
    setFailed(false);
    setPrivateUrl("");
    if (!privateImage || !path) return;
    let live = true,
      url;
    const controller = new AbortController();
    api
      .request(path, { blob: true, signal: controller.signal })
      .then((blob) => {
        if (live) {
          url = URL.createObjectURL(blob);
          setPrivateUrl(url);
        }
      })
      .catch((error) => {
        if (live && error.name !== "AbortError") setFailed(true);
      });
    return () => {
      live = false;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [privateImage, path, api]);
  const source = privateImage
    ? privateUrl
    : path
      ? `${process.env.NEXT_PUBLIC_API_URL || "/api"}${path}`
      : "";
  if (!source || failed)
    return (
      <div
        className={`product-image-placeholder ${className}`}
        aria-label={image ? "Image unavailable" : "No product image"}
      >
        <Icon name="leaf" size={36} />
      </div>
    );
  return (
    <img
      className={`product-image ${className}`}
      src={source}
      alt={alt || productName(product, "en") || "Product"}
      loading="lazy"
      decoding="async"
      width={image.width}
      height={image.height}
      onError={() => setFailed(true)}
    />
  );
}
export function ProductGallery({ product, api, large = false }) {
  const { t, language } = usePreferences();
  const [selected, setSelected] = useState(""),
    [expanded, setExpanded] = useState(false);
  const images = product.images || [];
  const image = images.find((entry) => entry.id === selected) || images[0];
  const name = productName(product, language);
  const content = (full) => (
    <div className={`product-gallery ${full ? "large" : ""}`}>
      <div className="product-gallery-main">
        <ProductImage
          product={product}
          image={image}
          api={api}
          thumbnail={!full}
          alt={name}
        />
        {!!images.length && (
          <span className="image-count">
            {images.indexOf(image) + 1} / {images.length}
          </span>
        )}
        {!full && !!images.length && (
          <button
            type="button"
            className="gallery-expand"
            onClick={() => setExpanded(true)}
            aria-label={`${t("View images")}: ${name}`}
          >
            {t("View images")}
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div
          className="product-gallery-thumbs"
          aria-label={t("Product images")}
        >
          {images.map((entry, index) => (
            <button
              type="button"
              key={entry.id}
              aria-label={`${t("Show image")} ${index + 1}`}
              aria-pressed={entry.id === image?.id}
              onClick={() => setSelected(entry.id)}
            >
              <ProductImage
                product={product}
                image={entry}
                api={api}
                thumbnail
                alt=""
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <>
      {content(large)}
      {expanded && (
        <Modal title={name} onClose={() => setExpanded(false)}>
          <div className="form-body">{content(true)}</div>
        </Modal>
      )}
    </>
  );
}
export default function ProductImages({
  initialTab = "images",
  api,
  product: initial,
  onUpdated,
  onClose,
}) {
  const { t, language } = usePreferences();
  const [tab, setTab] = useState(initialTab),
    [videoBusy, setVideoBusy] = useState(false);
  const [product, setProduct] = useState(initial),
    [files, setFiles] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState([]);
  const id = recordId(initial);
  useEffect(() => {
    const controller = new AbortController();
    api
      .request(`/products/${id}/images`, { signal: controller.signal })
      .then((r) => {
        if (!controller.signal.aborted) setProduct(r.product);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, id]);
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  function update(next) {
    setProduct(next);
    onUpdated?.(next);
    return next;
  }
  async function run(work) {
    if (busy || loading) return;
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      await work();
    } catch (e) {
      setError(e);
      // Refresh version after conflicts or an uncertain network result. Never repeat uploads automatically.
      try {
        const r = await api.request(`/products/${id}/images`);
        update(r.product);
      } catch {}
    } finally {
      setBusy(false);
    }
  }
  async function upload(file, current, replaceId) {
    validateImageFiles(
      [file],
      replaceId ? 1 : MAX_IMAGES - (current.images || []).length,
    );
    const result = await api.request(
      `/products/${id}/images${replaceId ? `/${replaceId}/replace` : ""}`,
      {
        method: "POST",
        raw: true,
        body: file,
        headers: {
          "Content-Type": file.type,
          "X-Product-Version": String(current.__v || 0),
        },
      },
    );
    return update(result.product);
  }
  function uploadSelected() {
    run(async () => {
      validateImageFiles(files, MAX_IMAGES - (product.images || []).length);
      let current = product;
      for (let i = 0; i < files.length; i++) {
        current = await upload(files[i], current);
        setFiles((previous) => previous.slice(1));
        setMessage(`${i + 1} / ${files.length} ${t("images uploaded")}`);
      }
    });
  }
  function reorder(ids) {
    run(async () => {
      const r = await api.request(`/products/${id}/images`, {
        method: "PATCH",
        body: { version: product.__v || 0, imageIds: ids },
      });
      update(r.product);
      setMessage(t("Image order saved"));
    });
  }
  const images = product.images || [];
  function move(index, offset) {
    const ids = images.map((image) => image.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    reorder(ids);
  }
  return (
    <Modal
      title={`${t("Product media")} · ${productName(product, language)}`}
      onClose={() => {
        if (!busy && !videoBusy) onClose();
      }}
    >
      <div className="form-body image-manager" aria-busy={busy || loading}>
        <div className="detail-tabs">
          <Button
            className={tab === "images" ? "" : "secondary"}
            disabled={busy || videoBusy}
            onClick={() => setTab("images")}
          >
            Images
          </Button>
          <Button
            className={tab === "video" ? "" : "secondary"}
            disabled={busy || videoBusy}
            onClick={() => setTab("video")}
          >
            Video
          </Button>
        </div>
        <div hidden={tab !== "images"}>
          <p className="muted">
            {t(
              "Upload up to 8 images. JPG, PNG or WebP, maximum 3 MB each. The first image is the cover.",
            )}
          </p>
          <ErrorBox error={error} />
          {message && (
            <p className="image-status" role="status">
              {message}
            </p>
          )}
          {loading ? (
            <p role="status">{t("Loading…")}</p>
          ) : (
            <>
              <div className="image-upload-box">
                <Icon name="plus" size={30} />
                <label>
                  {t("Choose product images")}
                  <input
                    aria-label={t("Choose product images")}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={busy || images.length >= MAX_IMAGES}
                    onChange={(e) => {
                      const selected = Array.from(e.target.files || []);
                      try {
                        validateImageFiles(
                          selected,
                          MAX_IMAGES - images.length,
                        );
                        setError(null);
                        setFiles(selected);
                      } catch (e) {
                        setError(e);
                        setFiles([]);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                <small>
                  {images.length} / {MAX_IMAGES} {t("images")}
                </small>
              </div>
              {!!files.length && (
                <div className="pending-images">
                  {files.map((file, index) => (
                    <figure key={`${file.name}-${index}`}>
                      <img src={previews[index]} alt={file.name} />
                      <figcaption>{file.name}</figcaption>
                    </figure>
                  ))}
                  <Button disabled={busy} onClick={uploadSelected}>
                    {busy
                      ? t("Uploading…")
                      : `${t("Upload selected")} (${files.length})`}
                  </Button>
                  <Button
                    className="secondary"
                    disabled={busy}
                    onClick={() => setFiles([])}
                  >
                    {t("Clear selection")}
                  </Button>
                </div>
              )}
              {!images.length && (
                <p className="muted">
                  {t(
                    "No product images yet. Add images above to create a gallery.",
                  )}
                </p>
              )}
              <div className="image-manager-grid">
                {images.map((image, index) => (
                  <article key={image.id}>
                    <ProductImage
                      product={product}
                      image={image}
                      api={api}
                      thumbnail
                      alt={`${productName(product, language)} ${index + 1}`}
                    />
                    <div className="image-manager-meta">
                      <b>
                        {index === 0
                          ? t("Cover image")
                          : `${t("Image")} ${index + 1}`}
                      </b>
                      <small>
                        {image.width} × {image.height} ·{" "}
                        {Math.round(image.size / 1024)} KB
                      </small>
                    </div>
                    <div className="image-manager-actions">
                      {index > 0 && (
                        <Button
                          className="secondary small"
                          disabled={busy}
                          onClick={() =>
                            reorder([
                              image.id,
                              ...images
                                .filter((entry) => entry.id !== image.id)
                                .map((entry) => entry.id),
                            ])
                          }
                        >
                          {t("Make cover")}
                        </Button>
                      )}
                      <Button
                        className="secondary small"
                        disabled={busy || index === 0}
                        aria-label={`${t("Move image earlier")} ${index + 1}`}
                        onClick={() => move(index, -1)}
                      >
                        ←
                      </Button>
                      <Button
                        className="secondary small"
                        disabled={busy || index === images.length - 1}
                        aria-label={`${t("Move image later")} ${index + 1}`}
                        onClick={() => move(index, 1)}
                      >
                        →
                      </Button>
                      <label
                        className={`image-replace ${busy ? "disabled" : ""}`}
                      >
                        {t("Replace")}
                        <input
                          type="file"
                          aria-label={`${t("Replace image")} ${index + 1}`}
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file)
                              run(async () => {
                                await upload(file, product, image.id);
                                setMessage(t("Image replaced"));
                              });
                          }}
                        />
                      </label>
                      <Button
                        className="subtle small"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(t("Remove this product image?")))
                            run(async () => {
                              const r = await api.request(
                                `/products/${id}/images/${image.id}/remove`,
                                {
                                  method: "POST",
                                  body: { version: product.__v || 0 },
                                },
                              );
                              update(r.product);
                              setMessage(t("Image removed"));
                            });
                        }}
                      >
                        {t("Remove")}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
        {tab === "video" && !loading && (
          <ProductVideo
            product={product}
            api={api}
            editable
            onUpdated={update}
            onBusyChange={setVideoBusy}
          />
        )}
      </div>
    </Modal>
  );
}
