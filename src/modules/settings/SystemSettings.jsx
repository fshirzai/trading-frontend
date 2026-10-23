"use client";
import { useEffect, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import {
  defaultBranding,
  publicAsset,
  useBranding,
} from "./BrandingProvider.jsx";
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
];
export default function SystemSettings({ api, user }) {
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
  const dirty = saved && fields.some(([k]) => form[k] !== saved[k]);
  async function run(task) {
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const s = await task();
      setSaved(s);
      setForm({ ...defaultBranding, ...s });
      updateBranding(s);
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
    <>
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
                {k === "aboutBody" || k === "address" ? (
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
    </>
  );
}
