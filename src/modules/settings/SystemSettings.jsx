"use client";
import DemoDataSettings from "./DemoDataSettings.jsx";
import HesabPaySettings from "./HesabPaySettings.jsx";
import { companyPhoto } from "../public/Storefront.jsx";
import { usePreferences, Localized } from "../../shared/i18n.jsx";
import { useEffect, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import {
  defaultBranding,
  publicAsset,
  useBranding,
} from "./BrandingProvider.jsx";
const invoiceFields = [
  ["registrationNo", "Company registration number", 100],
  ["taxNo", "Tax / TIN number", 100],
  ["bankName", "Bank name", 200],
  ["accountName", "Bank account name", 200],
  ["accountNumber", "Account number / IBAN", 120],
  ["swiftCode", "SWIFT code", 80],
  ["paymentInstructions", "Bank payment instructions", 1000],
  ["signatoryName", "Authorized signatory name", 200],
  ["signatoryPosition", "Signatory position", 120],
];
const fields = [
  ["name", "System / company name", 120],
  ["tagline", "Tagline", 240],
  ["aboutTitle", "About page title", 200],
  ["aboutBody", "About page content", 12000],
  ["contactEmail", "Contact email", 254],
  ["contactPhone", "Contact phone", 80],
  ["address", "Office address", 1000],
  ["workingHours", "Working hours", 240],
  ["website", "Website (HTTPS)", 500],
  ["termsBody", "Terms page content", 12000],
  ["privacyBody", "Privacy page content", 12000],
  ["deliveryBody", "Delivery page content", 12000],
];
export default function SystemSettings({ api, user }) {
  const { t } = usePreferences();
  const { updateBranding } = useBranding();
  const [saved, setSaved] = useState(null),
    [form, setForm] = useState(defaultBranding),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (user.role !== "admin") return;
    let live = true;
    api
      .request("/admin/settings")
      .then((s) => {
        if (live) {
          setSaved(s);
          setForm({ ...defaultBranding, ...s });
        }
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api, user.role]);
  if (user.role !== "admin")
    return (
      <p role="alert">Only the administrator can change system settings.</p>
    );
  const dirty =
    saved &&
    (JSON.stringify(form.invoiceProfile || {}) !==
      JSON.stringify(saved.invoiceProfile || {}) ||
      fields.some(([k]) => form[k] !== (saved[k] ?? defaultBranding[k])) ||
      JSON.stringify(form.translations) !==
        JSON.stringify(saved.translations ?? defaultBranding.translations) ||
      JSON.stringify(form.aboutImages) !==
        JSON.stringify(saved.aboutImages ?? defaultBranding.aboutImages));
  async function run(task) {
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const result = await task();
      const s = {
        ...result,
        invoiceProfile: result.invoiceProfile ?? saved?.invoiceProfile ?? {},
      };
      setSaved(s);
      setForm({ ...defaultBranding, ...s });
      const { invoiceProfile, ...publicBranding } = s;
      updateBranding(publicBranding);
      setMessage("System settings saved.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  function save(e) {
    e.preventDefault();
    run(() =>
      api.request("/admin/settings", {
        method: "PATCH",
        body: {
          revision: saved.revision,
          invoiceProfile: form.invoiceProfile || {},
          translations: form.translations,
          aboutImages: form.aboutImages,
          ...Object.fromEntries(fields.map(([k]) => [k, form[k]])),
        },
      }),
    );
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await run(async () => {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 3 * 1024 * 1024
      )
        throw Error("Choose a JPEG, PNG or WebP logo up to 3 MiB.");
      return api.request("/admin/settings/logo", {
        method: "POST",
        raw: true,
        body: file,
        headers: {
          "Content-Type": file.type,
          "X-Settings-Revision": String(saved.revision),
        },
      });
    });
    e.target.value = "";
  }
  return (
    <Localized>
      <section className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>System settings</h1>
          <p>
            Manage the public company identity, About content and contact
            information.
          </p>
        </div>
      </section>
      <ErrorBox error={error} />
      {message && (
        <p className="success-note" role="status">
          {message}
        </p>
      )}
      <section className="panel profile-edit">
        <h2>{t("About page photos")}</h2>
        <p>
          {t(
            "Starter photos are included. Keep them, remove them, or upload your own. The first image is also used on the home page.",
          )}
        </p>
        <div className="about-photo-editor">
          {form.aboutImages?.map((p, index) => (
            <article key={p.id}>
              <img src={companyPhoto(p)} alt={p.alt} />
              <label>
                {t("Image description")}
                <input
                  maxLength={200}
                  value={p.alt}
                  disabled={busy || !saved}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      aboutImages: form.aboutImages.map((x) =>
                        x.id === p.id ? { ...x, alt: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              <div className="button-row">
                <Button
                  className="secondary small"
                  disabled={busy || !saved || index === 0}
                  onClick={() => {
                    const photos = [...form.aboutImages];
                    [photos[index - 1], photos[index]] = [
                      photos[index],
                      photos[index - 1],
                    ];
                    setForm({ ...form, aboutImages: photos });
                  }}
                >
                  {t("Move earlier")}
                </Button>
                <Button
                  className="subtle small"
                  disabled={busy || !saved}
                  onClick={() =>
                    setForm({
                      ...form,
                      aboutImages: form.aboutImages.filter(
                        (x) => x.id !== p.id,
                      ),
                    })
                  }
                >
                  {t("Remove")}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <label>
          {t("Upload About photo")}
          <input
            aria-label={t("Upload About photo")}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy || !saved || dirty || form.aboutImages?.length >= 4}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await run(async () => {
                if (
                  !["image/png", "image/jpeg", "image/webp"].includes(
                    file.type,
                  ) ||
                  file.size > 3 * 1024 * 1024
                )
                  throw Error(t("Choose JPEG, PNG or WebP up to 3 MiB."));
                return api.request("/admin/settings/photos", {
                  method: "POST",
                  raw: true,
                  body: file,
                  headers: {
                    "Content-Type": file.type,
                    "X-Settings-Revision": String(saved.revision),
                  },
                });
              });
              e.target.value = "";
            }}
          />
        </label>
        <p className="muted">
          {t(
            "Up to four photos. Save pending changes before uploading another photo.",
          )}
        </p>
      </section>
      <div className="settings-layout">
        <section className="panel profile-edit">
          <h2>System logo</h2>
          {saved?.logoVersion ? (
            <img
              className="settings-logo-preview"
              alt="Current system logo"
              src={publicAsset(`/settings/logo/${saved.logoVersion}`)}
            />
          ) : (
            <p>No logo uploaded. The default mark is used.</p>
          )}
          <label>
            Upload or replace logo
            <input
              aria-label="System logo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy || !saved || dirty}
              onChange={upload}
            />
          </label>
          <p className="muted">
            JPEG, PNG or WebP, up to 3 MiB. Save text edits before changing the
            logo.
          </p>
          <Button
            className="secondary"
            disabled={busy || !saved?.logoVersion || dirty}
            onClick={() =>
              run(() =>
                api.request("/admin/settings/logo/remove", {
                  method: "POST",
                  body: { revision: saved.revision },
                }),
              )
            }
          >
            Remove logo
          </Button>
        </section>
        <form className="panel profile-edit" onSubmit={save}>
          <h2>Company information</h2>
          <div className="fields">
            {fields.map(([k, label, max]) => (
              <label
                key={k}
                className={
                  k === "aboutBody" || k === "address" ? "span-all" : ""
                }
              >
                <span>{label}</span>
                {k.endsWith("Body") || k === "address" ? (
                  <textarea
                    aria-label={label}
                    rows={k === "aboutBody" ? 8 : 3}
                    maxLength={max}
                    disabled={busy || !saved}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                ) : (
                  <input
                    aria-label={label}
                    type={
                      k === "contactEmail"
                        ? "email"
                        : k === "website"
                          ? "url"
                          : "text"
                    }
                    maxLength={max}
                    required={k === "name"}
                    disabled={busy || !saved}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <details className="translated-content">
            <summary>{t("Pashto and Dari page content")}</summary>
            {["ps", "fa"].map((lang) => (
              <section key={lang} dir="rtl">
                <h3>{lang === "ps" ? "پښتو" : "دری"}</h3>
                {[
                  "aboutTitle",
                  "aboutBody",
                  "termsBody",
                  "privacyBody",
                  "deliveryBody",
                ].map((k) => (
                  <label key={k}>
                    {lang === "ps" ? "پښتو — " : "دری — "}
                    {t(
                      {
                        aboutTitle: "About page title",
                        aboutBody: "About page content",
                        termsBody: "Terms page content",
                        privacyBody: "Privacy page content",
                        deliveryBody: "Delivery page content",
                      }[k],
                    )}
                    <textarea
                      aria-label={lang + " " + k}
                      rows={k === "aboutTitle" ? 2 : 6}
                      maxLength={k === "aboutTitle" ? 200 : 12000}
                      disabled={busy || !saved}
                      value={form.translations?.[lang]?.[k] || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          translations: {
                            ...form.translations,
                            [lang]: {
                              ...form.translations?.[lang],
                              [k]: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </section>
            ))}
          </details>
          <fieldset className="span-all">
            <legend>{t("Invoice seller and bank details")}</legend>
            <p>
              {t(
                "These details are saved with new quotations and shown on customer documents. They are not published on public pages.",
              )}
            </p>
            <div className="fields">
              {invoiceFields.map(([key, title, max]) => (
                <label key={key} className={max > 500 ? "span-all" : ""}>
                  <span>{t(title)}</span>
                  {max > 500 ? (
                    <textarea
                      aria-label={t(title)}
                      maxLength={max}
                      rows={3}
                      value={form.invoiceProfile?.[key] || ""}
                      disabled={busy || !saved}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          invoiceProfile: {
                            ...form.invoiceProfile,
                            [key]: e.target.value,
                          },
                        })
                      }
                    />
                  ) : (
                    <input
                      aria-label={t(title)}
                      maxLength={max}
                      value={form.invoiceProfile?.[key] || ""}
                      disabled={busy || !saved}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          invoiceProfile: {
                            ...form.invoiceProfile,
                            [key]: e.target.value,
                          },
                        })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="button-row">
            <Button disabled={busy || !saved || !dirty} type="submit">
              Save system settings
            </Button>
            <Button
              type="button"
              className="secondary"
              disabled={busy || !saved}
              onClick={() => {
                setForm({ ...defaultBranding, ...saved });
                setMessage("");
              }}
            >
              Discard edits
            </Button>
            <Button
              type="button"
              className="subtle"
              disabled={busy}
              onClick={() => run(() => api.request("/admin/settings"))}
            >
              Reload settings
            </Button>
          </div>
        </form>
      </div>
      <HesabPaySettings api={api} />
      <DemoDataSettings api={api} />
    </Localized>
  );
}
