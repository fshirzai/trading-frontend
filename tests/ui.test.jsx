import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLDialogElement",
  "MutationObserver",
  "localStorage",
  "FormData",
])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = globalThis.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
const { render, screen, fireEvent, waitFor, cleanup } =
  await import("@testing-library/react");
const { Preferences } = await import("../src/shared/i18n.jsx");
const { PreferencesControls } = await import("../src/shared/ui.jsx");
const { CommandForm } = await import("../src/shared/forms.jsx");
const { default: AuthPage } = await import("../src/modules/auth/AuthPage.jsx");
const { default: Dashboard } =
  await import("../src/modules/dashboard/Dashboard.jsx");
const { default: OrderDetail } =
  await import("../src/modules/sales/OrderDetail.jsx");
const { default: Workspace } = await import("../src/Workspace.jsx");
const {
  default: ProductImages,
  ProductGallery,
  validateImageFiles,
} = await import("../src/modules/catalog/ProductImages.jsx");
afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
const mount = (node) => render(<Preferences>{node}</Preferences>);
const id = "012345678901234567890123";
test("product gallery switches between actual image URLs and opens a full gallery", async () => {
  const p = {
    _id: id,
    name: { en: "Beans" },
    active: true,
    images: [
      { id: "a".repeat(24), width: 80, height: 60 },
      { id: "b".repeat(24), width: 80, height: 60 },
    ],
  };
  const view = mount(<ProductGallery product={p} />);
  fireEvent.click(screen.getByRole("button", { name: "Show image 2" }));
  assert.ok(
    view.container
      .querySelector(".product-gallery-main img")
      .src.includes("b".repeat(24)),
  );
  fireEvent.click(screen.getByRole("button", { name: "View images: Beans" }));
  assert.ok(screen.getByRole("dialog"));
  assert.ok(
    view.container
      .querySelector(".dialog .product-gallery-main img")
      .src.endsWith("b".repeat(24)),
  );
});
test("product image manager uploads multiple files sequentially then changes cover, replaces and removes", async () => {
  const originalCreate = URL.createObjectURL,
    originalRevoke = URL.revokeObjectURL,
    originalConfirm = window.confirm;
  URL.createObjectURL = () => "blob:fixture";
  URL.revokeObjectURL = () => {};
  window.confirm = () => true;
  let current = {
    _id: id,
    __v: 0,
    active: true,
    name: { en: "Beans" },
    images: [{ id: "1".repeat(24), width: 80, height: 60, size: 200 }],
  };
  const calls = [],
    updates = [];
  const api = {
    request: async (path, options = {}) => {
      calls.push({ path, options });
      if (!options.method) return { product: current };
      const next = {
        ...current,
        __v: current.__v + 1,
        images: [...current.images],
      };
      if (options.method === "PATCH")
        next.images = options.body.imageIds.map((key) =>
          next.images.find((entry) => entry.id === key),
        );
      else if (path.endsWith("/remove"))
        next.images = next.images.filter(
          (entry) => !path.includes(`/${entry.id}/remove`),
        );
      else {
        assert.equal(options.raw, true);
        assert.equal(options.headers["X-Product-Version"], String(current.__v));
        const entry = {
          id: String(next.__v + 1).repeat(24),
          width: 80,
          height: 60,
          size: 200,
        };
        if (path.endsWith("/replace"))
          next.images[
            next.images.findIndex((entry) =>
              path.includes(`/${entry.id}/replace`),
            )
          ] = entry;
        else next.images.push(entry);
      }
      current = next;
      return { product: next };
    },
  };
  try {
    mount(
      <ProductImages
        api={api}
        product={current}
        onUpdated={(p) => updates.push(p)}
        onClose={() => {}}
      />,
    );
    await waitFor(() =>
      assert.ok(screen.getByLabelText("Choose product images")),
    );
    const files = [
      new window.File(["one"], "one.png", { type: "image/png" }),
      new window.File(["two"], "two.jpg", { type: "image/jpeg" }),
    ];
    fireEvent.change(screen.getByLabelText("Choose product images"), {
      target: { files },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Upload selected (2)" }),
    );
    await waitFor(() => assert.equal(updates.length, 2));
    assert.equal(current.images.length, 3);
    assert.equal(calls.filter((call) => call.options.raw).length, 2);
    const newCover = current.images[1].id;
    fireEvent.click(screen.getAllByRole("button", { name: "Make cover" })[0]);
    await waitFor(() => assert.equal(current.images[0].id, newCover));
    await waitFor(() =>
      assert.equal(screen.getByLabelText("Replace image 1").disabled, false),
    );
    fireEvent.change(screen.getByLabelText("Replace image 1"), {
      target: { files: [files[0]] },
    });
    await waitFor(() => assert.notEqual(current.images[0].id, newCover));
    await waitFor(() =>
      assert.equal(
        screen.getAllByRole("button", { name: "Remove" })[0].disabled,
        false,
      ),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    await waitFor(() => assert.equal(current.images.length, 2));
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    window.confirm = originalConfirm;
  }
});
test("product file selection rejects oversized, unsupported and excessive images", () => {
  assert.throws(() =>
    validateImageFiles([{ type: "image/svg+xml", size: 100 }]),
  );
  assert.throws(() =>
    validateImageFiles([{ type: "image/png", size: 3 * 1024 * 1024 + 1 }]),
  );
  assert.throws(() => validateImageFiles([{ type: "image/png", size: 20 }], 0));
});
test("all color palettes support persisted dark mode and RTL language", async () => {
  mount(<PreferencesControls />);
  fireEvent.change(screen.getByLabelText("Appearance mode"), {
    target: { value: "dark" },
  });
  for (const color of ["ocean", "amber", "violet", "graphite", "emerald"]) {
    fireEvent.change(screen.getByLabelText("Color theme"), {
      target: { value: color },
    });
    assert.equal(document.documentElement.dataset.color, color);
    assert.equal(document.documentElement.dataset.theme, "dark");
  }
  fireEvent.change(screen.getByLabelText("Language"), {
    target: { value: "ps" },
  });
  assert.equal(document.documentElement.dir, "rtl");
  assert.equal(
    JSON.parse(localStorage.getItem("trade-preferences")).language,
    "ps",
  );
});
test("login submits real credentials and provides a returned user", async () => {
  let sent, token, user;
  const api = {
    request: async (p, o) => {
      sent = { p, ...o };
      return {
        accessToken: "memory-only",
        user: { name: "Customer", role: "customer" },
      };
    },
    setToken: (t) => (token = t),
  };
  mount(
    <AuthPage
      mode="login"
      api={api}
      onLogin={(u) => (user = u)}
      onNavigate={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^Password/), {
    target: { value: "test-password" },
  });
  fireEvent.submit(screen.getByLabelText(/^Password/).closest("form"));
  await waitFor(() => assert.equal(token, "memory-only"));
  assert.equal(sent.p, "/auth/login");
  assert.equal(sent.body.email, "customer@example.com");
  assert.equal(user.role, "customer");
  assert.equal(localStorage.getItem("accessToken"), null);
});
test("customer inquiry uses product names and sends numeric quantity without customer spoofing", async () => {
  let sent;
  const api = {
    request: async (p, o) => {
      if (p.startsWith("/catalog"))
        return { items: [{ _id: id, name: { en: "White chickpeas" } }] };
      sent = { p, ...o };
      return { _id: id };
    },
  };
  mount(
    <CommandForm
      command={{ title: "New inquiry", path: "/inquiries", method: "POST" }}
      api={api}
      user={{ role: "customer" }}
      onClose={() => {}}
    />,
  );
  const select = await screen.findByRole("option", { name: "White chickpeas" });
  fireEvent.change(select.parentElement, { target: { value: id } });
  fireEvent.change(screen.getByRole("spinbutton", { name: /Quantity/ }), {
    target: { value: "2.125" },
  });
  assert.equal(screen.queryByRole("combobox", { name: /Customer/ }), null);
  fireEvent.submit(
    screen.getByRole("button", { name: "New inquiry" }).closest("form"),
  );
  await waitFor(() => assert.equal(sent?.p, "/inquiries"));
  assert.equal(sent.body.quantity, 2.125);
  assert.equal(sent.body.customer, undefined);
  assert.ok(sent.key);
});
test("journal form blocks unbalanced posting before calling the API", async () => {
  let writes = 0;
  const api = {
    request: async (p, o) => {
      if (o?.method === "POST") {
        writes++;
        return {};
      }
      return { items: [{ name: "Bank" }, { name: "Capital" }] };
    },
  };
  mount(
    <CommandForm
      command={{
        title: "Post journal",
        path: "/journals",
        method: "POST",
        initial: {
          memo: "Opening",
          lines: [
            { account: "Bank", debitCents: 1000, creditCents: 0 },
            { account: "Capital", debitCents: 0, creditCents: 900 },
          ],
        },
      }}
      api={api}
      user={{ role: "admin" }}
      onClose={() => {}}
    />,
  );
  fireEvent.submit(
    screen.getByRole("button", { name: "Post journal" }).closest("form"),
  );
  await screen.findByText(
    "Debits and credits must balance and be greater than zero",
  );
  assert.equal(writes, 0);
});
test("dashboard renders backend totals without a sample-data mode", async () => {
  const api = {
    request: async () => ({
      scope: "Company orders",
      totals: {
        orders: 88,
        totalCents: 1000000,
        paidCents: 500000,
        refundedCents: 0,
        outstandingCents: 500000,
      },
      stages: [{ _id: "Ready to ship", count: 2 }],
      daily: [],
      recent: [],
      newInquiries: 3,
      pendingPayments: 1,
      inventory: null,
    }),
  };
  mount(
    <Dashboard
      api={api}
      user={{ name: "Shirzai", role: "admin" }}
      onNavigate={() => {}}
    />,
  );
  await screen.findByText("88");
  assert.ok(screen.getByText("$10,000.00"));
  assert.equal(screen.queryByText(/sample data/i), null);
});
test("order document tab lists files by name and disables quarantined downloads", async () => {
  const api = {
    request: async (p) =>
      p === "/payment-methods"
        ? { methods: [{ method: "TT", enabled: true }] }
        : p.includes("/documents?")
          ? {
              items: [
                {
                  _id: id,
                  name: "bank-receipt.pdf",
                  kind: "payment-receipt",
                  size: 1024,
                  status: "Quarantined",
                },
              ],
            }
          : {
              order: {
                _id: id,
                status: "Awaiting acceptance",
                quantity: 2,
                productSnapshot: { name: { en: "Beans" } },
                totalCents: 100000,
                productCents: 100000,
                feesCents: 0,
                paidCents: 0,
                refundedCents: 0,
                returnHours: 24,
              },
              payments: [],
              shipments: [],
              returns: [],
            },
  };
  mount(
    <OrderDetail
      api={api}
      id={id}
      user={{ role: "customer" }}
      onClose={() => {}}
      onCommand={() => {}}
    />,
  );
  await screen.findAllByText("Beans");
  fireEvent.click(screen.getByRole("button", { name: "Documents" }));
  await screen.findByText("bank-receipt.pdf");
  assert.equal(screen.getByRole("button", { name: "Download" }).disabled, true);
});
test("staff access loads named accounts and gives row actions only to administrators", async () => {
  const api = {
    request: async (p) =>
      p === "/payment-methods"
        ? { methods: [] }
        : {
            items: [
              {
                _id: id,
                name: "Procurement Officer",
                email: "officer@example.com",
                role: "procurement",
                active: true,
                emailVerified: true,
                mfaEnabled: false,
              },
            ],
          },
  };
  mount(
    <Workspace
      api={api}
      user={{ name: "Admin", role: "admin" }}
      active="users"
      onNavigate={() => {}}
      onExit={() => {}}
      onCommand={() => {}}
      onLogout={() => {}}
    />,
  );
  await screen.findByText("Procurement Officer");
  assert.ok(screen.getByRole("option", { name: "Update staff access" }));
});
test("registration refuses mismatched password confirmation without an API write", async () => {
  let writes = 0;
  mount(
    <AuthPage
      mode="register"
      api={{
        request: async () => {
          writes++;
          return {};
        },
      }}
      onNavigate={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Customer" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "First-password-12!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "Other-password-12!" },
  });
  fireEvent.submit(screen.getByLabelText("Password").closest("form"));
  await screen.findByText("Passwords do not match");
  assert.equal(writes, 0);
});

const { default: SystemSettings } =
  await import("../src/modules/settings/SystemSettings.jsx");
const { defaultBranding } =
  await import("../src/modules/settings/BrandingProvider.jsx");
const { default: ProfileEditor } =
  await import("../src/modules/auth/ProfileEditor.jsx");
test("system settings denies non-admin without requesting protected data", () => {
  let calls = 0;
  mount(
    <SystemSettings
      user={{ role: "manager" }}
      api={{
        request: () => {
          calls++;
        },
      }}
    />,
  );
  assert.match(screen.getByRole("alert").textContent, /Only the administrator/);
  assert.equal(calls, 0);
});
test("administrator saves company content with its current revision", async () => {
  const calls = [];
  const api = {
    request: async (path, opts) => {
      calls.push([path, opts]);
      return { ...defaultBranding, revision: 4, ...opts?.body };
    },
  };
  mount(<SystemSettings user={{ role: "admin" }} api={api} />);
  await waitFor(() =>
    assert.equal(
      screen.getByLabelText("System / company name").disabled,
      false,
    ),
  );
  fireEvent.change(screen.getByLabelText("System / company name"), {
    target: { value: "Our Company" },
  });
  fireEvent.change(screen.getByLabelText("About page content"), {
    target: { value: "Our history" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save system settings" }));
  await screen.findByText("System settings saved.");
  const save = calls.find(([, o]) => o?.method === "PATCH");
  assert.equal(save[1].body.revision, 4);
  assert.equal(save[1].body.name, "Our Company");
  assert.equal(save[1].body.aboutBody, "Our history");
});
test("profile saves contact fields without changing email or role", async () => {
  const user = {
    id,
    name: "A Customer",
    email: "a@example.com",
    role: "customer",
  };
  const calls = [];
  const api = {
    request: async (path, opts) => {
      calls.push([path, opts]);
      return path === "/auth/sessions"
        ? { items: [] }
        : { ...user, phone: "", country: "", address: "", ...opts?.body };
    },
  };
  let updated;
  mount(
    <ProfileEditor
      api={api}
      user={user}
      onProfileChanged={(u) => {
        updated = u;
      }}
    />,
  );
  await waitFor(() =>
    assert.equal(screen.getByLabelText("Full name").disabled, false),
  );
  fireEvent.change(screen.getByLabelText("Phone"), {
    target: { value: "12345" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByText("Profile saved.");
  const save = calls.find(([, o]) => o?.method === "PATCH");
  assert.equal(save[1].body.phone, "12345");
  assert.equal(save[1].body.role, undefined);
  assert.equal(save[1].body.email, undefined);
  assert.equal(updated.phone, "12345");
});
const { default: ProductVideo } =
  await import("../src/modules/catalog/ProductVideo.jsx");
test("product video control completes chunked upload and updates product", async () => {
  const calls = [];
  let updated;
  const product = { _id: id, active: true, name: { en: "Beans" } };
  const api = {
    request: async (path, opts) => {
      calls.push([path, opts]);
      if (path.endsWith("/complete"))
        return { product: { ...product, video: "v1" } };
      if (path.endsWith("/chunks")) return {};
      return { id: "upload1", chunkSize: 1024 * 1024 };
    },
  };
  mount(
    <ProductVideo
      product={product}
      api={api}
      editable
      onUpdated={(p) => {
        updated = p;
      }}
    />,
  );
  const file = new window.File(["test-video-bytes"], "beans.mp4", {
    type: "video/mp4",
  });
  fireEvent.change(screen.getByLabelText("Product video"), {
    target: { files: [file] },
  });
  await waitFor(() => assert.equal(updated?.video, "v1"));
  assert.equal(calls.length, 3);
  assert.equal(calls[1][1].raw, true);
  assert.equal(calls[1][1].headers["X-Video-Chunk"], "0");
  assert.ok(calls[2][0].endsWith("/complete"));
});

const { default: Storefront } =
  await import("../src/modules/public/Storefront.jsx");
const { default: CartProvider } =
  await import("../src/modules/public/CartProvider.jsx");
const storefront = (props) =>
  mount(
    <CartProvider>
      <Storefront {...props} />
    </CartProvider>,
  );
test("public navigation uses real page paths and exposes search and filters", async () => {
  const calls = [];
  const api = {
    request: async (path) => {
      calls.push(path);
      return path.includes("/filters")
        ? { categories: ["Pulses"], origins: ["Afghanistan"], grades: ["A"] }
        : { items: [], nextCursor: null };
    },
  };
  storefront({ api, page: "products", onNavigate: () => {} });
  assert.equal(
    screen
      .getByRole("link", { name: "Terms & conditions" })
      .getAttribute("href"),
    "/terms/",
  );
  fireEvent.change(screen.getByLabelText("Search products"), {
    target: { value: "lentils" },
  });
  await waitFor(() =>
    assert.ok(calls.some((x) => x.includes("search=lentils"))),
  );
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "Pulses" },
  });
  await waitFor(() =>
    assert.ok(calls.some((x) => x.includes("category=Pulses"))),
  );
});
test("cart submits all products and quantities as a single customer inquiry", async () => {
  const other = "b".repeat(24);
  localStorage.setItem(
    "trade-cart-v1",
    JSON.stringify([
      { product: id, quantity: 3 },
      { product: other, quantity: 2 },
    ]),
  );
  const calls = [];
  const api = {
    request: async (path, opts) => {
      calls.push([path, opts]);
      return path === "/inquiries"
        ? { _id: "c".repeat(24) }
        : {
            _id: path.split("/").at(-1),
            name: { en: path.endsWith(id) ? "Beans" : "Lentils" },
            moq: 1,
            unit: "tonne",
          };
    },
  };
  storefront({
    api,
    page: "cart",
    user: { role: "customer" },
    onNavigate: () => {},
  });
  await screen.findByText("Beans");
  await screen.findByText("Lentils");
  fireEvent.change(screen.getByLabelText("Delivery place"), {
    target: { value: "Kabul delivery point" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Send quotation request" }),
  );
  await screen.findByText("Request received");
  const body = calls.find(([path]) => path === "/inquiries")[1].body;
  assert.equal(body.items.length, 2);
  assert.equal(body.items[0].quantity, 3);
  assert.equal(body.items[1].quantity, 2);
  assert.equal(body.destination, "Kabul delivery point");
  assert.equal(body.preferredPayment, "TT");
  await waitFor(() =>
    assert.equal(JSON.parse(localStorage.getItem("trade-cart-v1")).length, 0),
  );
});
test("public About page includes editable starter content and two bundled images", () => {
  storefront({
    api: { request: async () => ({}) },
    page: "about",
    onNavigate: () => {},
  });
  assert.ok(screen.getByText(/We connect agricultural products/));
  assert.equal(
    screen.getByAltText("Agricultural fields").getAttribute("src"),
    "/images/fields.jpg",
  );
  assert.equal(
    screen.getByAltText("Harvested grain").getAttribute("src"),
    "/images/grain.jpg",
  );
});
const { default: InquiryLines } =
  await import("../src/modules/inquiries/InquiryLines.jsx");
test("inquiry details display every requested product by its snapshot name", () => {
  mount(
    <InquiryLines
      inquiry={{
        items: [
          {
            product: id,
            quantity: 3,
            snapshot: { name: { en: "Beans" }, unit: "tonne" },
          },
          {
            product: "b".repeat(24),
            quantity: 2,
            snapshot: { name: { en: "Lentils" }, unit: "tonne" },
          },
        ],
        preferredPayment: "VISA",
      }}
    />,
  );
  assert.ok(screen.getByText("Beans"));
  assert.ok(screen.getByText("Lentils"));
  assert.ok(screen.getByText("3 tonne"));
  assert.match(
    screen.getByText(/Preferred payment method/).textContent,
    /HesabPay/,
  );
});
const { default: TradingApp } = await import("../src/TradingApp.jsx");
test("a delayed anonymous restoration failure cannot overwrite a successful sign-in", async () => {
  const original = globalThis.fetch,
    scroll = window.scrollTo;
  window.scrollTo = () => {};
  let finish;
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  globalThis.fetch = async (path) => {
    if (path.endsWith("/health/ready")) return json({ status: "ready" });
    if (path.endsWith("/settings/public")) return json(defaultBranding);
    if (path.endsWith("/auth/refresh"))
      return new Promise((resolve) => {
        finish = resolve;
      });
    if (path.endsWith("/auth/login"))
      return json({
        accessToken: "new-token",
        user: {
          id,
          name: "Browser Customer",
          email: "customer@example.com",
          role: "customer",
          emailVerified: true,
        },
      });
    if (path.endsWith("/workspace/summary"))
      return json({
        totals: { orders: 0 },
        stages: [],
        daily: [],
        recent: [],
        newInquiries: 0,
        pendingPayments: 0,
        inventory: null,
      });
    return json({ items: [], nextCursor: null });
  };
  try {
    const view = render(<TradingApp initialView="login" />);
    await waitFor(() => assert.equal(typeof finish, "function"));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Test-password-123!" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in", exact: true }),
    );
    await waitFor(() => assert.ok(view.container.querySelector(".workspace")));
    finish(json({ error: "Authentication required" }, 401));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.ok(view.container.querySelector(".workspace"));
  } finally {
    cleanup();
    globalThis.fetch = original;
    window.scrollTo = scroll;
  }
});
test("order-list card action opens HesabPay amount confirmation instead of the Stripe command", async () => {
  const order = {
    _id: id,
    acceptedAt: new Date().toISOString(),
    status: "Deposit pending",
    paidCents: 0,
    totalCents: 10000,
    productCents: 10000,
    feesCents: 0,
    quantity: 1,
    productSnapshot: { name: { en: "Beans" } },
    border: "Kabul",
    items: [],
  };
  let commands = 0;
  const method = {
    method: "VISA",
    provider: "hesabpay",
    enabled: true,
    hesabpay: {
      account: "b".repeat(24),
      afnPerUsd: 70,
      label: "Test merchant",
      environment: "sandbox",
    },
  };
  const api = {
    request: async (path) =>
      path === "/payment-methods"
        ? { methods: [method] }
        : path === "/orders/" + id
          ? { order, payments: [], shipments: [], returns: [] }
          : path.startsWith("/orders")
            ? { items: [order], nextCursor: null }
            : { items: [], nextCursor: null },
  };
  mount(
    <Workspace
      api={api}
      user={{ id, name: "Customer", role: "customer" }}
      active="sales"
      onNavigate={() => {}}
      onExit={() => {}}
      onCommand={() => {
        commands++;
      }}
      onLogout={() => {}}
    />,
  );
  const option = await screen.findByRole("option", {
    name: "Pay by card",
    exact: true,
  });
  fireEvent.change(option.closest("select"), {
    target: { value: option.value },
  });
  await screen.findByText("I confirm the AFN charge shown above.");
  assert.ok(screen.getByRole("button", { name: "Continue to HesabPay" }));
  assert.equal(commands, 0);
});

test("administrator demo-data panel submits explicit credentials and shows all role accounts", async () => {
  const { default: DemoDataSettings } =
    await import("../src/modules/settings/DemoDataSettings.jsx");
  let payload;
  const accounts = [
    "admin",
    "manager",
    "seller",
    "procurement",
    "customer",
  ].map((role) => ({
    role,
    email: role + "@demo.test",
    existing: role === "admin",
  }));
  const api = {
    request: async (path, options) => {
      assert.equal(path, "/admin/demo-data");
      if (options?.method === "POST") {
        payload = options.body;
        return { accounts };
      }
      return { enabled: true, seeded: false };
    },
  };
  mount(<DemoDataSettings api={api} />);
  await screen.findByLabelText("Administrator password");
  fireEvent.change(screen.getByLabelText("Administrator password"), {
    target: { value: "Existing-Admin-Password!" },
  });
  fireEvent.change(screen.getByLabelText("Demo account password"), {
    target: { value: "New-Demo-Password!" },
  });
  assert.equal(
    screen.getByRole("button", { name: "Create demo data" }).disabled,
    true,
  );
  fireEvent.change(screen.getByLabelText("Type ADD DEMO DATA to confirm"), {
    target: { value: "ADD DEMO DATA" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create demo data" }));
  await screen.findByText("Demo data has already been created.");
  assert.deepEqual(payload, {
    adminPassword: "Existing-Admin-Password!",
    demoPassword: "New-Demo-Password!",
    confirmation: "ADD DEMO DATA",
  });
  for (const a of accounts) assert.ok(screen.getByText(a.email));
  assert.equal(screen.queryByLabelText("Administrator password"), null);
});

test("staff quotation form submits packaging and reference fields with numeric bag values", async () => {
  let submitted;
  const api = {
    request: async (path, options) => {
      if (options?.method === "POST") {
        submitted = options.body;
        return { _id: id };
      }
      return {
        items: [{ _id: id, name: { en: "Beans" }, active: true }],
        nextCursor: null,
      };
    },
  };
  mount(
    <CommandForm
      api={api}
      user={{ role: "manager" }}
      command={{
        title: "Issue quotation",
        path: "/inquiries/{id}/proforma",
        id,
        method: "POST",
        initial: {
          items: [{ product: id, quantity: 25, productTotal: 22000 }],
          productTotal: 22000,
          deliveryFees: 100,
          border: "Ghazni customs",
          quotationDetails: {
            reference: "PI-UI-001",
            issueDate: "2026-10-23",
            validUntil: "2026-10-31",
          },
        },
      }}
      onClose={() => {}}
      onDone={() => {}}
    />,
  );
  await screen.findByLabelText("Bag Count");
  assert.ok(screen.getByText("$11,000.00"));
  fireEvent.change(screen.getByLabelText("Bag Count"), {
    target: { value: "1000" },
  });
  fireEvent.change(screen.getByLabelText("Bag Weight Kg"), {
    target: { value: "25" },
  });
  fireEvent.change(screen.getByLabelText("Packaging"), {
    target: { value: "25 kg woven bags" },
  });
  fireEvent.change(screen.getByLabelText("Loading Place"), {
    target: { value: "Ghazni" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Issue quotation", exact: true }),
  );
  await waitFor(() => assert.ok(submitted));
  assert.equal(submitted.items[0].bagCount, 1000);
  assert.equal(submitted.items[0].bagWeightKg, 25);
  assert.equal(submitted.items[0].packaging, "25 kg woven bags");
  assert.equal(submitted.quotationDetails.reference, "PI-UI-001");
  assert.equal(submitted.quotationDetails.loadingPlace, "Ghazni");
});

test("Pashto localization handles multiline text, software terms, placeholders and statuses", async () => {
  const { Localized, usePreferences } = await import("../src/shared/i18n.jsx");
  const { Button, Badge } = await import("../src/shared/ui.jsx");
  localStorage.setItem(
    "trade-preferences",
    JSON.stringify({
      language: "ps",
      mode: "light",
      color: "emerald",
      density: "comfortable",
    }),
  );
  function Example() {
    const { t } = usePreferences();
    return (
      <Localized>
        <h1>{t("Dashboard")}</h1>
        <p>
          These details are saved with new quotations and shown on customer
          documents. They are not published on public pages.
        </p>
        <Button>Download</Button>
        <Badge>Open</Badge>
        <span>{t("{hours} hours after first handover", { hours: 24 })}</span>
      </Localized>
    );
  }
  mount(<Example />);
  await screen.findByRole("heading", { name: "ډاشبورډ" });
  assert.ok(screen.getByRole("button", { name: "ډاونلوډ" }));
  assert.ok(screen.getByText("پرانیستی"));
  assert.ok(screen.getByText("له لومړۍ سپارنې وروسته 24 ساعته"));
  assert.ok(
    screen.getByText(
      "دا معلومات له نوې پروفارما سره ساتل کېږي او د پېرودونکي په اسنادو کې ښودل کېږي. په عامو پاڼو کې نه خپرېږي.",
    ),
  );
});

test("public photo response cannot erase the administrator's private invoice profile", async () => {
  const profile = {
    bankName: "Saved bank",
    accountNumber: "PRIVATE-TEST-ACCOUNT",
  };
  let saved;
  const api = {
    request: async (path, opts) => {
      if (path === "/admin/settings/photos")
        return {
          ...defaultBranding,
          revision: 2,
          aboutImages: [
            ...defaultBranding.aboutImages,
            { id: "a".repeat(24), alt: "Company photo" },
          ],
        };
      if (path === "/admin/settings" && opts?.method === "PATCH") {
        saved = opts.body;
        return { ...defaultBranding, ...saved, revision: 3 };
      }
      if (path === "/admin/settings")
        return { ...defaultBranding, revision: 1, invoiceProfile: profile };
      return { enabled: false, seeded: false };
    },
  };
  mount(<SystemSettings api={api} user={{ role: "admin" }} />);
  await waitFor(() =>
    assert.equal(screen.getByLabelText("Bank name").value, "Saved bank"),
  );
  const file = new dom.window.File(["fixture"], "photo.png", {
    type: "image/png",
  });
  fireEvent.change(screen.getByLabelText("Upload About photo"), {
    target: { files: [file] },
  });
  await screen.findByText("System settings saved.");
  assert.equal(screen.getByLabelText("Bank name").value, "Saved bank");
  fireEvent.change(screen.getByLabelText("System / company name"), {
    target: { value: "Updated exporter" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save system settings", exact: true }),
  );
  await waitFor(() => assert.ok(saved));
  assert.deepEqual(saved.invoiceProfile, profile);
});

test("proforma editor previews without saving then shows saved document with print and download", async () => {
  const calls = [],
    done = [];
  const api = {
    request: async (path, options = {}) => {
      calls.push([path, options]);
      if (options.blob)
        return new Blob(["%PDF-fixture"], { type: "application/pdf" });
      if (path.endsWith("/proforma")) return { _id: id };
      return {
        items: [{ _id: id, name: { en: "Beans" }, active: true }],
        nextCursor: null,
      };
    },
  };
  const view = mount(
    <CommandForm
      api={api}
      user={{ role: "manager" }}
      command={{
        title: "Issue quotation",
        path: "/inquiries/{id}/proforma",
        method: "POST",
        id,
        initial: {
          items: [
            {
              product: id,
              quantity: 25,
              productTotal: 22000,
              packaging: "25 kg bags",
              bagCount: 1000,
              bagWeightKg: 25,
            },
          ],
          productTotal: 22000,
          deliveryFees: 100,
          border: "Ghazni customs",
          quotationDetails: {
            reference: "PI-UI-PREVIEW",
            issueDate: "2026-10-23",
          },
        },
      }}
      onClose={() => {}}
      onDone={(...args) => done.push(args)}
    />,
  );
  await screen.findByLabelText("Bag Count");
  assert.ok(screen.getByRole("heading", { name: "Goods and packaging" }));
  fireEvent.click(screen.getByRole("button", { name: "Preview document" }));
  await screen.findByTitle("Proforma preview");
  assert.equal(calls.filter(([p]) => p.endsWith("/proforma")).length, 0);
  const previewCall = calls.find(([p]) => p.endsWith("/proforma/preview"));
  assert.equal(previewCall[1].method, "POST");
  assert.equal(previewCall[1].body.items[0].bagCount, 1000);
  assert.equal(previewCall[1].blob, true);
  assert.match(
    screen.getByRole("link", { name: "Download PDF" }).getAttribute("href"),
    /^blob:/,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1));
  assert.equal(screen.queryByTitle("Proforma preview"), null);
  assert.equal(screen.getByLabelText("Bag Count").value, "1000");
  fireEvent.click(
    screen.getByRole("button", { name: "Issue quotation", exact: true }),
  );
  const iframe = await screen.findByTitle("Proforma invoice");
  assert.equal(done.length, 1);
  assert.equal(done[0][1], false);
  assert.equal(calls.filter(([p]) => p.endsWith("/proforma")).length, 1);
  assert.ok(
    calls.some(
      ([p, options]) =>
        p === `/orders/${id}/documents/proforma.pdf` && options.blob,
    ),
  );
  assert.equal(
    screen.getByRole("link", { name: "Download PDF" }).download,
    `proforma-${id}.pdf`,
  );
  let prints = 0;
  iframe.contentWindow.focus = () => {};
  iframe.contentWindow.print = () => {
    prints++;
  };
  fireEvent.load(iframe);
  fireEvent.click(screen.getByRole("button", { name: "Print" }));
  assert.equal(prints, 1);
  assert.equal(view.container.querySelectorAll("form").length, 0);
});

test("document viewer retries authenticated loading and releases its private object URL on close", async () => {
  const { default: DocumentViewer } =
    await import("../src/modules/documents/DocumentViewer.jsx");
  const priorCreate = URL.createObjectURL,
    priorRevoke = URL.revokeObjectURL;
  const revoked = [];
  URL.createObjectURL = () => "blob:private-invoice";
  URL.revokeObjectURL = (value) => revoked.push(value);
  try {
    let attempts = 0;
    const api = {
      request: async (path, options) => {
        assert.equal(path, `/invoices/${id}/pdf`);
        assert.equal(options.blob, true);
        if (++attempts === 1) throw Error("Temporary failure");
        return new Blob(["%PDF-private"], { type: "application/pdf" });
      },
    };
    const view = mount(
      <DocumentViewer
        api={api}
        document={{
          path: `/invoices/${id}/pdf`,
          title: "Commercial invoice",
          name: "INV-test.pdf",
        }}
        onClose={() => {}}
      />,
    );
    await screen.findByText("Temporary failure");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByTitle("Commercial invoice");
    assert.equal(
      screen.getByRole("link", { name: "Download PDF" }).getAttribute("href"),
      "blob:private-invoice",
    );
    assert.equal(
      screen.getByRole("link", { name: "Open in new tab" }).getAttribute("rel"),
      "noopener noreferrer",
    );
    view.unmount();
    assert.deepEqual(revoked, ["blob:private-invoice"]);
  } finally {
    URL.createObjectURL = priorCreate;
    URL.revokeObjectURL = priorRevoke;
  }
});

test("customer document controls open issued invoice without exposing invoice issue action", async () => {
  const { default: OrderDocuments } =
    await import("../src/modules/documents/OrderDocuments.jsx");
  const calls = [];
  mount(
    <OrderDocuments
      api={{
        request: async (path, options) => {
          calls.push(path);
          return options?.blob
            ? new Blob(["%PDF-invoice"], { type: "application/pdf" })
            : { items: [], nextCursor: null };
        },
      }}
      id={id}
      user={{ role: "customer" }}
      onCommand={() => {
        throw Error("Customer may not issue invoices");
      }}
      accepted
      invoices={[{ _id: id, number: "INV-CUSTOMER" }]}
    />,
  );
  assert.equal(screen.queryByRole("button", { name: "Issue invoice" }), null);
  fireEvent.click(
    screen.getAllByRole("button", { name: "View / print invoice" })[0],
  );
  await screen.findByTitle("Commercial invoice");
  assert.ok(calls.includes(`/invoices/${id}/pdf`));
  assert.equal(
    screen.getByRole("link", { name: "Download PDF" }).download,
    "INV-CUSTOMER.pdf",
  );
});
