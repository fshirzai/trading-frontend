"use client";
import { Localized } from "../../shared/i18n.jsx";
import { Button, Logo, PreferencesControls } from "../../shared/ui.jsx";
import { useBranding } from "./BrandingProvider.jsx";
export default function CompanyPage({ page, onNavigate, user }) {
  const { branding: b } = useBranding();
  const about = page === "about";
  let website = "";
  try {
    const u = new URL(b.website);
    if (u.protocol === "https:" && !u.username && !u.password) website = u.href;
  } catch {}
  return (
    <Localized>
      <div className="public-site">
        <header className="public-header">
          <Logo />
          <nav>
            <button
              className="button subtle"
              onClick={() => onNavigate("home")}
            >
              Home
            </button>
            <button
              className="button subtle"
              onClick={() => onNavigate("about")}
            >
              About
            </button>
            <button
              className="button subtle"
              onClick={() => onNavigate("contact")}
            >
              Contact
            </button>
          </nav>
          <div className="header-actions">
            <PreferencesControls />
            <Button onClick={() => onNavigate(user ? "workspace" : "login")}>
              {user ? "Workspace" : "Sign in"}
            </Button>
          </div>
        </header>
        <main className="company-page">
          <span className="eyebrow">{b.name}</span>
          <h1>{about ? b.aboutTitle : "Contact us"}</h1>
          {about ? (
            <div className="company-copy">
              {b.aboutBody || "Company information will be published here."}
            </div>
          ) : (
            <dl className="company-contact">
              {b.contactEmail && (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={"mailto:" + b.contactEmail}>{b.contactEmail}</a>
                  </dd>
                </div>
              )}
              {b.contactPhone && (
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={"tel:" + b.contactPhone.replace(/[^+\d]/g, "")}>
                      {b.contactPhone}
                    </a>
                  </dd>
                </div>
              )}
              {b.address && (
                <div>
                  <dt>Office address</dt>
                  <dd>{b.address}</dd>
                </div>
              )}
              {b.workingHours && (
                <div>
                  <dt>Working hours</dt>
                  <dd>{b.workingHours}</dd>
                </div>
              )}
              {website && (
                <div>
                  <dt>Website</dt>
                  <dd>
                    <a href={website} target="_blank" rel="noopener noreferrer">
                      {website}
                    </a>
                  </dd>
                </div>
              )}
              {![
                b.contactEmail,
                b.contactPhone,
                b.address,
                b.workingHours,
                website,
              ].some(Boolean) && (
                <p>
                  Contact information will be published here. You can also sign
                  in and send an inquiry.
                </p>
              )}
            </dl>
          )}
          <div className="button-row">
            <Button onClick={() => onNavigate(about ? "contact" : "home")}>
              {about ? "Contact us" : "Browse products"}
            </Button>
          </div>
        </main>
        <footer className="public-footer">
          <Logo />
          <p>{b.tagline}</p>
          <span>
            © {new Date().getFullYear()} {b.name}
          </span>
        </footer>
      </div>
    </Localized>
  );
}
