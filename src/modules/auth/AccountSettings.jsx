"use client";
import { Localized } from "../../shared/i18n.jsx";
import ProfileEditor from "./ProfileEditor.jsx";
import ProfileImage from "./ProfileImage.jsx";
import { Button, Badge } from "../../shared/ui.jsx";
import Icon from "../../shared/icons.jsx";
import { usePreferences } from "../../shared/i18n.jsx";
import { colors } from "../../shared/preferences.js";
import auth from "../auth/module.js";
export default function Settings({ user, onCommand, api, onProfileChanged }) {
  const { t, color, setColor, mode, setMode, density, setDensity } =
    usePreferences();
  const swatches = {
    emerald: "#28533d",
    ocean: "#205a7c",
    amber: "#8b6323",
    violet: "#6850a4",
    graphite: "#485469",
  };
  const act = (path) => onCommand(auth.actions.find((a) => a.path === path));
  return (
    <Localized>
      <section className="profile-status">
        <ProfileImage api={api} user={user} />
        <div>
          <b>{user.name}</b>
          <small>
            {user.email} · {user.role}
          </small>
        </div>
        <Badge>
          {user.emailVerified ? "Email verified" : "Verification required"}
        </Badge>
        <Badge>{user.mfaEnabled ? "MFA enabled" : "MFA not enabled"}</Badge>
      </section>
      {api && (
        <ProfileEditor
          api={api}
          user={user}
          onProfileChanged={onProfileChanged}
        />
      )}
      <div className="security-grid">
        <section className="panel security-card">
          <Icon name="shield" size={28} />
          <h3>{t("Account protection")}</h3>
          <p>
            {t(
              "Use a unique password and an authenticator to protect your account.",
            )}
          </p>
          <div className="button-row">
            <Button
              className="secondary"
              onClick={() => act("/auth/change-password")}
            >
              {t("Change password")}
            </Button>
            {user.mfaEnabled ? (
              <Button
                className="secondary"
                onClick={() => act("/auth/mfa/disable")}
              >
                {t("Disable authenticator")}
              </Button>
            ) : (
              <>
                <Button onClick={() => act("/auth/mfa/enroll")}>
                  {t("Set up authenticator")}
                </Button>
                <Button
                  className="secondary"
                  onClick={() => act("/auth/mfa/confirm")}
                >
                  {t("Confirm authenticator")}
                </Button>
              </>
            )}
          </div>
        </section>
        <section className="panel security-card">
          <Icon name="logout" size={28} />
          <h3>{t("Sessions")}</h3>
          <p>
            {t(
              "Sign out every device if you suspect someone else has access. You will need to sign in again.",
            )}
          </p>
          <Button className="secondary" onClick={() => act("/auth/logout-all")}>
            {t("Sign out all devices")}
          </Button>
          <small style={{ display: "block", marginTop: 18 }}>
            Account ID: {user.id}
          </small>
        </section>
        <section className="panel security-card">
          <Icon name="sun" size={28} />
          <h3>{t("Appearance")}</h3>
          <p>
            {t(
              "Choose a palette and appearance. Preferences stay on this device.",
            )}
          </p>
          <div className="theme-grid">
            {colors.map((c) => (
              <button
                className={`theme-option ${color === c ? "active" : ""}`}
                key={c}
                onClick={() => setColor(c)}
                style={{ "--swatch": swatches[c] }}
              >
                <i />
                {c}
              </button>
            ))}
          </div>
          <label style={{ marginTop: 20 }}>
            Appearance mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="system">System preference</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </section>
        <section className="panel security-card">
          <Icon name="grid" size={28} />
          <h3>{t("Workspace density")}</h3>
          <p>{t("Adjust the spacing of tables and dashboard cards.")}</p>
          <label>
            Density
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <p style={{ marginTop: 20 }}>
            Languages: English · پښتو · دری
            <br />
            Direction follows your selected language.
          </p>
        </section>
      </div>
    </Localized>
  );
}
