# Trading frontend 2.0 — live backend integration

This is the connected application for Trading Backend **2.1**. There are no sample orders, preview users or fake metrics. Trading actions call your backend. Dashboard totals are aggregated from MongoDB, lists display related record names, and protected order files and staff accounts have actual listing screens.

## Update your existing Windows setup

1. Keep your existing backend `.env`, database and uploaded files.
2. From the updated backend package, copy **the whole `src/` folder** over your existing `trading-backend/src/`. Include the new `src/modules/workspace/` folder. Restart the backend with `npm run dev`. The update adds read endpoints; it does not reset your database or change financial rules.
3. Extract this frontend beside the backend as `trading-frontend`.
4. In PowerShell inside the frontend:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

5. Open **http://localhost:3000**. Keep the backend running on port 4000.

Your frontend `.env.local` should contain:

```env
BACKEND_URL=http://127.0.0.1:4000
NEXT_PUBLIC_API_URL=/api
```

The backend must retain:

```env
WEB_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

All your other backend settings stay as configured. The development server proxies `/api` before handing pages to Next.js. The built frontend server also proxies `/api` to the same fixed backend origin. No JWT, MongoDB, SMTP or encryption secret belongs in this frontend.

## Account and initial records

Sign in with your existing account. No default password is embedded in the frontend. If you have not created an administrator, configure the backend's `ADMIN_NAME`, `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD`, run `npm run bootstrap` in the backend, then remove the bootstrap password.

For an empty development database, the backend's `npm run seed:demo` can create test accounts using your chosen `SEED_PASSWORD`. Never seed the company database just to populate the interface.

With a new company database, add products, warehouses, customer/supplier contacts and purchases. Receive purchased goods before dispatching warehouse stock. A zero or empty screen reflects actual database contents.

SMTP is needed for registration/staff verification and recovery emails. ClamAV is needed to clear uploaded documents for download. Online cards remain hidden until the backend reports an approved configured provider. This interface never pretends those services are enabled.

## Functional screens

- Public catalog with real products, translated names, MOQ, categories, pagination and inquiry entry.
- Registration, matching password confirmation, login/MFA/recovery code, verify/resend email, forgot/reset/change password, rotating sessions and device logout.
- Customer and staff workspaces with URL hash navigation, back/reload support and role-specific menus.
- All-time permitted dashboard totals, 30-day order-value chart, order stage counts and next-action queues.
- Orders in table or board view; named customers/products; status filters; a detail screen with terms, payment progress, earliest-handover return deadline, payments, shipments, returns and documents.
- Quotations/revisions/acceptance, TT recording/verification, optional hosted card checkout, warehouse/direct dispatch, border handover, return requests/inspection/refunds/rejections.
- Product cards and edits; contacts; warehouse/batch inventory transfers; supplier purchases/receipts/payments; employees, salaries and advances.
- Journals with named account selectors and debit/credit checks; reversals, expenses, chart of accounts, monthly and fiscal-year close.
- Bank CSV selection/import, statement lines, journal matching and closing; financial reports with protected access, date ranges, CSV export and print.
- Named staff listing, role/active changes, private notifications and audit records.
- Order file list, PDF/PNG/JPEG uploads, visible quarantine status, protected clean-file downloads, administrator scan actions and generated trade PDFs.
- Five palettes: **Emerald, Ocean, Amber, Violet, Graphite**. Each supports **light, dark and system** modes. Comfortable/compact density, responsive navigation and English/Pashto/Dari preferences with RTL.

Server permissions, ownership and transactions remain the authority. Frontend action menus also respect record state. Table search/status filters apply to the loaded page; listings and reference selectors paginate. Some explanatory copy and backend messages/PDFs remain English; company terminology should be reviewed.

## Modular structure

Module navigation, role rules, commands, columns and specialized screens live together in `src/modules/<module>/`. API/session handling, validated command forms, UI components, CSV escaping, workflow helpers and theme/translation preferences live in `src/shared/`. `scripts/serve.mjs` serves the build and fixed-origin API proxy.

Forms follow the backend command schemas. USD inputs serialize as numbers, journals use integer cents and quantities use tonnes. Financial forms retain their retry key after an error. After an ambiguous network response, retry the same open form with the same data to avoid creating a duplicate transaction.

## Checks

```powershell
npm test
npm run test:ui
npm run test:integration
npm run test:dev
npm run build
```

For `test:integration`, the backend must be installed beside this frontend. Otherwise:

```powershell
$env:BACKEND_DIR = "E:\desktop\backend of the trading\trading-backend"
npm run test:integration
```

Integration tests seed an isolated MongoDB replica set, start the real backend and frontend proxy, and run quotation → payment → dispatch → handover → inspected return → 75% refund. They never connect to your `.env` database. The first run may download a MongoDB test binary.

The UI tests run in a DOM environment; they test real components and requests but do not replace visual/device browser QA. See `VERIFICATION.md` for actual results.

## Built frontend

```powershell
npm run build
npm start
```

Open http://localhost:3000 with the backend still running. The built local server includes a hash-based CSP, no-referrer/nosniff/frame restrictions, host and Origin checks, bounded proxy bodies and backend timeouts. Access tokens stay in memory; refresh credentials use the backend's HttpOnly cookie. Multi-tab refresh uses Web Locks when available; logout is broadcast without sending credentials. Theme/language preferences are the only persistent client settings.

Before Internet deployment, serve the frontend and `/api` on one HTTPS origin behind a configured reverse proxy. Set `FRONTEND_ORIGIN`, `FRONTEND_HOSTS`, and `BACKEND_FORWARD_HEADERS=true` only behind the trusted HTTPS proxy, plus the backend's exact allowed origin/front-end URL and trusted proxy settings. The Node frontend binds to loopback by default. Preserve `/verify-email/` and `/reset-password/` pages. Validate real mail, scanning, merchant sandbox, backups and device/browser behavior before launch.

The private hosted page is not connected to your Windows machine. It shows connection instructions until a reachable deployed backend is configured; it has no fake data mode.

Security design references: [OWASP session storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html) and [MDN hash-based CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src). Passing tests does not constitute a production penetration test.
