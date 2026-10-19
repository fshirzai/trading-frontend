# Frontend 2.0 / Backend 2.1 verification — 14 October 2026

Passed:

- **21 frontend unit, API, contract, workflow and proxy-security tests.** Includes credential handling, concurrent refresh, stale-session protection, financial retry keys, role/state gates, 25% retention and earliest split-handover deadline, theme validation, formula-safe CSV, CSP, host/Origin rejection and fixed backend configuration.
- **8 DOM component tests.** Five palettes/dark/RTL, actual login submission, named customer inquiry/numeric quantities, unbalanced journal refusal, real dashboard totals, quarantined document downloads, named staff actions and matching registration passwords.
- **1 seeded full-stack HTTP test.** Uses the real backend and the new frontend proxy. Login/refresh, role denial, inquiry/quotation/acceptance, TT verification with replay protection, dispatch, remaining payment, handover, inspected return, exact 75% refund, summary/users/documents/PDF and logout.
- **57 backend tests**, **94.81% source line coverage**, **88.33% branch coverage**. Includes all existing tests plus safe staff projection, dashboard/customer isolation beyond one page, document ownership and safe display labels.
- Development CLI process/HTTP system test: Next pages render and `/api` forwards to the configured backend without injecting untrusted forwarded headers.
- Next.js optimized static build for home, verification and reset pages.

Not performed:

- Browser screenshots, visual/device/keyboard E2E and production load tests. A supported browser-control skill was unavailable. The DOM suite models native dialogs; it does not verify browser rendering or native focus trapping.
- Real SMTP delivery, live ClamAV definitions, payment merchant sandbox certification, production infrastructure deployment or independent penetration testing.

All test databases are disposable. No company database or user credentials were used. There is no sample-data or bypass-login path in the application.
