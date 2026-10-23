"use client";
import { useEffect, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import { usePreferences } from "../../shared/i18n.jsx";
export default function DemoDataSettings({ api }) {
  const { t } = usePreferences();
  const [status, setStatus] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [adminPassword, setAdminPassword] = useState(""),
    [demoPassword, setDemoPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    let live = true;
    api
      .request("/admin/demo-data")
      .then((r) => {
        if (live) setStatus(r);
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.request("/admin/demo-data", {
        method: "POST",
        body: { adminPassword, demoPassword, confirmation },
      });
      setStatus({ enabled: true, seeded: true, result });
      setDemoPassword("");
      setConfirmation("");
    } catch (e) {
      setError(e);
    } finally {
      setAdminPassword("");
      setBusy(false);
    }
  }
  return (
    <section className="panel settings-panel">
      <h2>{t("Demo data")}</h2>
      <p>
        {t(
          "This adds sample users, products, photos, warehouses, opening stock and quotation requests. It does not replace your existing records.",
        )}
      </p>
      <p>
        {t(
          "Create once only. Sample records are marked DEMO and affect inventory and reports.",
        )}
      </p>
      <ErrorBox error={error} />
      {status?.seeded ? (
        <>
          <p role="status">{t("Demo data has already been created.")}</p>
          <p>{t("Existing administrator account is kept.")}</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("Role")}</th>
                  <th>{t("Email")}</th>
                </tr>
              </thead>
              <tbody>
                {status.result?.accounts.map((a) => (
                  <tr key={a.role}>
                    <td>{t(a.role[0].toUpperCase() + a.role.slice(1))}</td>
                    <td dir="ltr">{a.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>{t("Use this password for the four new demo accounts.")}</p>
        </>
      ) : status && !status.enabled ? (
        <p>
          {t(
            "Enable DEMO_DATA_ENABLED=true on the backend temporarily, then reload this page. Turn it off after seeding.",
          )}
        </p>
      ) : status ? (
        <form onSubmit={submit}>
          <label>
            {t("Administrator password")}
            <input
              type="password"
              required
              maxLength={128}
              autoComplete="current-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </label>
          <label>
            {t("Demo account password")}
            <input
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              value={demoPassword}
              onChange={(e) => setDemoPassword(e.target.value)}
            />
          </label>
          <label>
            {t("Type ADD DEMO DATA to confirm")}
            <input
              required
              dir="ltr"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <Button
            type="submit"
            disabled={busy || confirmation !== "ADD DEMO DATA"}
          >
            {t("Create demo data")}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
