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

## Installation repair — 18 October 2026

Regenerated package-lock.json from package.json in an empty directory, without node_modules. Clean npm ci succeeded on Linux; all 22 unit/API/contract/workflow/proxy and lockfile checks passed against that fresh installation. Platform-specific binaries are optional, Windows x64 variants are present, and no external links or extraneous packages remain. An actual Windows execution was not available in this environment.

## Multiple product images — 19 October 2026

- 75 backend tests pass, including persistent multiple image upload, public WebP/thumbnail reads, authenticated inactive-image access, replacement/deletion/reordering, audit entries, stale/concurrent updates, eight-image limit, size/signature/role restrictions and metadata stripping.
- 22 frontend unit/API/proxy/contract/workflow tests pass.
- 11 DOM tests pass, including real gallery selection/full-view controls and multiple image uploads followed by cover selection/replacement/removal through the API interface.
- The seeded full-stack HTTP test passes through the frontend proxy and real backend, now including two raw image uploads, public thumbnail decoding, cover reordering and customer write rejection.
- The development CLI process test and optimized static build pass.
- Production dependency audit reports zero known vulnerabilities. Backend lockfile contains optional Windows sharp binaries and no external links. Actual Windows install, deployed Vercel uploads, browser rendering/accessibility and production memory/load behavior were not tested here.

One concurrent test run hit a shared MongoDB binary download/execution race (ETXTBSY). After downloads completed, the full backend suite passed in sequence. No application check was disabled.
