"use client";
import { useEffect, useState } from "react";
import { Button, ErrorBox } from "../../shared/ui.jsx";
import ProfileImage from "./ProfileImage.jsx";
export default function ProfileEditor({ api, user, onProfileChanged }) {
  const [profile, setProfile] = useState(null),
    [form, setForm] = useState({
      name: user.name,
      phone: "",
      country: "",
      address: "",
    }),
    [sessions, setSessions] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [message, setMessage] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.all([api.request("/me/profile"), api.request("/auth/sessions")])
      .then(([p, s]) => {
        if (live) {
          setProfile(p);
          setForm({
            name: p.name,
            phone: p.phone,
            country: p.country,
            address: p.address,
          });
          setSessions(s.items);
        }
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api, reload]);
  async function run(task, note) {
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const result = await task();
      if (result?.email) {
        setProfile(result);
        setForm({
          name: result.name,
          phone: result.phone,
          country: result.country,
          address: result.address,
        });
        onProfileChanged?.(result);
      }
      setMessage(note);
      return result;
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  function save(e) {
    e.preventDefault();
    run(
      () => api.request("/me/profile", { method: "PATCH", body: form }),
      "Profile saved.",
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
        throw Error("Choose a JPEG, PNG or WebP photo up to 3 MiB.");
      return api.request("/me/avatar", {
        method: "POST",
        raw: true,
        body: file,
        headers: { "Content-Type": file.type },
      });
    }, "Profile photo updated.");
    e.target.value = "";
  }
  return (
    <>
      <ErrorBox error={error} />
      {message && (
        <p className="success-note" role="status">
          {message}
        </p>
      )}
      <div className="settings-layout">
        <section className="panel profile-edit">
          <h2>Profile photo</h2>
          <ProfileImage
            api={api}
            user={profile || user}
            className="profile-avatar-large"
          />
          <label>
            Upload or replace photo
            <input
              aria-label="Profile photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy || !profile}
              onChange={upload}
            />
          </label>
          <p className="muted">
            Private account photo. JPEG, PNG or WebP, up to 3 MiB.
          </p>
          <Button
            className="secondary"
            disabled={busy || !profile?.avatarVersion}
            onClick={() =>
              run(
                () =>
                  api.request("/me/avatar/remove", {
                    method: "POST",
                    body: {},
                  }),
                "Profile photo removed.",
              )
            }
          >
            Remove profile photo
          </Button>
          <dl className="record-details">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "..."}
              </dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>
                {profile?.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleString()
                  : "..."}
              </dd>
            </div>
          </dl>
        </section>
        <form className="panel profile-edit" onSubmit={save}>
          <h2>Personal information</h2>
          <div className="fields">
            {[
              ["name", "Full name", 200],
              ["phone", "Phone", 80],
              ["country", "Country", 120],
              ["address", "Address", 1000],
            ].map(([k, label, max]) => (
              <label key={k}>
                <span>{label}</span>
                {k === "address" ? (
                  <textarea
                    aria-label={label}
                    value={form[k]}
                    maxLength={max}
                    disabled={busy || !profile}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                ) : (
                  <input
                    aria-label={label}
                    required={k === "name"}
                    value={form[k]}
                    maxLength={max}
                    disabled={busy || !profile}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <Button type="submit" disabled={busy || !profile}>
            Save profile
          </Button>
          <p className="muted">
            Email, role and verification status cannot be changed through
            profile editing.
          </p>
        </form>
      </div>
      <section className="panel profile-edit">
        <h2>Active sessions</h2>
        <p>Revoke another session to sign that session out.</p>
        {sessions.map((s) => (
          <div className="document-row" key={s._id}>
            <div>
              <b>{s.current ? "This session" : "Other session"}</b>
              <small>
                Started {new Date(s.createdAt).toLocaleString()} · Expires{" "}
                {new Date(s.expiresAt).toLocaleDateString()}
              </small>
            </div>
            <Button
              disabled={busy || s.current}
              className="secondary small"
              onClick={async () => {
                const result = await run(
                  () =>
                    api.request(`/auth/sessions/${s._id}/revoke`, {
                      method: "POST",
                      body: {},
                    }),
                  "Session revoked.",
                );
                if (result) setReload((n) => n + 1);
              }}
            >
              Revoke session
            </Button>
          </div>
        ))}
      </section>
    </>
  );
}
