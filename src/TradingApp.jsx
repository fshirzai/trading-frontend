"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createApi } from "./shared/api.js";
import { Preferences, usePreferences } from "./shared/i18n.jsx";
import { CommandForm } from "./shared/forms.jsx";
import { Button, ErrorBox, Logo, PreferencesControls } from "./shared/ui.jsx";
import { allowedModules } from "./modules/registry.js";
import PublicSite from "./modules/public/PublicSite.jsx";
import AuthPage from "./modules/auth/AuthPage.jsx";
import Workspace from "./Workspace.jsx";
function App({ initialView = "home" }) {
  const [view, setView] = useState(initialView),
    [active, setActive] = useState("dashboard"),
    [user, setUser] = useState(null),
    [connection, setConnection] = useState("checking"),
    [connectionError, setConnectionError] = useState(null),
    [command, setCommand] = useState(null),
    [refresh, setRefresh] = useState(0),
    [toast, setToast] = useState("");
  const userRef = useRef(null);
  userRef.current = user;
  const api = useMemo(
    () =>
      createApi({
        base: process.env.NEXT_PUBLIC_API_URL || "/api",
        onExpired: () => {
          if (userRef.current) {
            setUser(null);
            setView("login");
            setCommand(null);
            setToast("Your session expired. Please sign in again.");
          }
        },
      }),
    [],
  );
  async function connect() {
    setConnection("checking");
    setConnectionError(null);
    try {
      const r = await api.request("/health/ready");
      if (r.status !== "ready") throw Error("The database is not ready");
      setConnection("ready");
      return true;
    } catch (e) {
      setConnection("offline");
      setConnectionError(e);
      return false;
    }
  }
  function navigate(v, module = "dashboard") {
    setCommand(null);
    setView(v);
    setActive(module);
    if (!["verify-email", "reset-password"].includes(initialView))
      window.location.hash =
        v === "workspace" ? `workspace/${module}` : v === "home" ? "" : v;
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    let live = true;
    connect().then(async (ok) => {
      if (!ok || !live) return;
      try {
        const u = await api.restore();
        if (live) {
          setUser(u);
          if (initialView === "home") {
            const key = window.location.hash.replace("#workspace/", "");
            setActive(
              allowedModules(u.role).some((m) => m.key === key)
                ? key
                : "dashboard",
            );
            setView("workspace");
          }
        }
      } catch {
        if (live && window.location.hash.startsWith("#workspace/"))
          setView("login");
      }
    });
    return () => {
      live = false;
    };
  }, [api, initialView]);
  useEffect(() => {
    function route() {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith("workspace/")) {
        const key = hash.split("/")[1];
        if (
          userRef.current &&
          allowedModules(userRef.current.role).some((m) => m.key === key)
        ) {
          setView("workspace");
          setActive(key);
        } else setView("login");
      } else if (
        [
          "login",
          "register",
          "forgot-password",
          "resend-verification",
        ].includes(hash)
      )
        setView(hash);
      else if (!hash) setView(initialView);
      setCommand(null);
    }
    route();
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, [initialView]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("trading-session")
        : null;
    if (channel)
      channel.onmessage = (e) => {
        if (e.data === "logout") {
          api.clear();
          setUser(null);
          setCommand(null);
          setView("login");
        }
      };
    return () => channel?.close();
  }, [api]);
  async function logout() {
    try {
      await api.request("/auth/logout", { method: "POST", body: {} });
    } catch {
      setToast(
        "The server could not confirm sign-out. Local access has been cleared.",
      );
    } finally {
      api.clear();
      setUser(null);
      navigate("login");
      if (typeof BroadcastChannel !== "undefined") {
        const c = new BroadcastChannel("trading-session");
        c.postMessage("logout");
        c.close();
      }
    }
  }
  function done(out, close) {
    setRefresh((r) => r + 1);
    if (command?.path === "/auth/mfa/confirm") {
      api.clear();
      setUser(null);
    }
    if (close) {
      setToast(
        out?.status === "Pending"
          ? "Request recorded. Bank or provider confirmation is still required."
          : "Action completed successfully.",
      );
      if (
        [
          "/auth/change-password",
          "/auth/logout-all",
          "/auth/mfa/confirm",
        ].includes(command?.path)
      ) {
        api.clear();
        setUser(null);
        navigate("login");
      }
    }
  }
  return (
    <>
      {connection !== "ready" ? (
        <ConnectionPanel
          status={connection}
          error={connectionError}
          onRetry={connect}
        />
      ) : view === "workspace" && user ? (
        <Workspace
          api={api}
          user={user}
          active={active}
          onNavigate={(key) => navigate("workspace", key)}
          onExit={() => navigate("home")}
          onCommand={setCommand}
          onLogout={logout}
          refresh={refresh}
        />
      ) : view === "home" ? (
        <PublicSite
          api={api}
          onNavigate={(v) => navigate(v)}
          user={user}
          onInquiry={(p) =>
            setCommand({
              title: "New inquiry",
              path: "/inquiries",
              method: "POST",
              initial: { product: p._id, quantity: p.moq || 1 },
              context: p,
            })
          }
        />
      ) : (
        <AuthPage
          key={view}
          mode={view === "workspace" ? "login" : view}
          api={api}
          onNavigate={navigate}
          onLogin={(u) => {
            setUser(u);
            navigate("workspace");
          }}
        />
      )}
      {command && (
        <CommandForm
          key={command.path + (command.id || "")}
          command={command}
          api={api}
          user={user}
          onClose={() => setCommand(null)}
          onDone={done}
        />
      )}
      <div className="toast-region" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
function ConnectionPanel({ status, error, onRetry }) {
  const { t } = usePreferences();
  return (
    <main>
      <header className="public-header">
        <Logo />
        <PreferencesControls />
      </header>
      <section className="connection-panel">
        <span className="eyebrow">BACKEND CONNECTION</span>
        <h1>
          {status === "checking"
            ? "Connecting to your company backend…"
            : "Connect your backend to start working"}
        </h1>
        <p>
          This application uses your real trading database. Start the backend on
          port 4000 and run this frontend on port 3000.
        </p>
        {status === "checking" ? (
          <div className="table-loading" role="status">
            Checking database readiness and session…
          </div>
        ) : (
          <>
            <ErrorBox error={error} />
            <ol className="check-list">
              <li>
                <b>1</b>
                <div>
                  In your backend folder: <code>npm run dev</code>
                </div>
              </li>
              <li>
                <b>2</b>
                <div>
                  In this frontend folder: <code>npm run dev</code>
                </div>
              </li>
              <li>
                <b>3</b>
                <div>
                  Open <code>http://localhost:3000</code> in your browser.
                </div>
              </li>
            </ol>
            <p className="notice">
              The private hosted page cannot reach a database on your computer.
              Use the downloaded source locally, or configure a deployed HTTPS
              backend.
            </p>
            <Button onClick={onRetry} icon="refresh">
              {t("Retry connection")}
            </Button>
          </>
        )}
      </section>
    </main>
  );
}
export default function TradingApp(props) {
  return (
    <Preferences>
      <App {...props} />
    </Preferences>
  );
}
