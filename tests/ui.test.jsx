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
  await screen.findByText("Beans");
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
