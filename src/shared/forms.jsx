"use client";
import { useEffect, useMemo, useState, useId } from "react";
import contracts from "./contracts.json";
import {
  formBody,
  label,
  productName,
  recordId,
  shortId,
  money,
} from "./format.js";
import { Button, ErrorBox, Modal } from "./ui.jsx";
import { usePreferences } from "./i18n.jsx";
import { journalTotals } from "./workflows.js";
import { safeCheckoutUrl } from "./api.js";
const relationPaths = {
  product: "/catalog",
  customer: "/records/party",
  supplier: "/records/party",
  warehouse: "/records/warehouse",
  batch: "/records/batch",
  order: "/orders",
  journal: "/records/journal",
  payment: "/records/payment",
  account: "/accounting/accounts",
  category: "/accounting/accounts",
  receiptKey: "/orders/{id}/documents",
};
export function normalizeField(f) {
  return f.type
    ? f
    : {
        ...f,
        ...f.anyOf?.[0],
        minimum: f.anyOf?.some((v) => v.const === 0) ? 0 : f.minimum,
      };
}
export function defaults(schema) {
  return Object.fromEntries(
    Object.entries(schema.properties || {})
      .filter(
        ([key, f]) =>
          f.default !== undefined ||
          f.type === "object" ||
          f.type === "array" ||
          ["debitCents", "creditCents"].includes(key),
      )
      .map(([k, f]) => [
        k,
        f.default ??
          (["debitCents", "creditCents"].includes(k)
            ? 0
            : f.type === "object"
              ? defaults(f)
              : Array.from({ length: f.minItems || 0 }, () =>
                  defaults(f.items),
                )),
      ]),
  );
}
export function Fields({
  schema,
  values,
  onChange,
  choices = {},
  nextChoices = {},
  onLoadMore = () => {},
  loadingChoices = {},
  disabled = false,
}) {
  const { t } = usePreferences();
  const inputPrefix = useId();
  return (
    <div className="fields">
      {Object.entries(schema.properties || {}).map(([key, original]) => {
        const f = normalizeField(original),
          required = schema.required?.includes(key),
          value = values[key],
          change = (v) => onChange({ ...values, [key]: v }),
          title = t(label(key));
        if (f.type === "object")
          return (
            <fieldset key={key} className="span-all">
              <legend>{title}</legend>
              <Fields
                schema={f}
                values={value || {}}
                onChange={change}
                choices={choices}
                nextChoices={nextChoices}
                onLoadMore={onLoadMore}
                loadingChoices={loadingChoices}
                disabled={disabled}
              />
            </fieldset>
          );
        if (f.type === "array")
          return (
            <fieldset key={key} className="span-all">
              <legend>{title}</legend>
              {(value || []).map((row, i) => (
                <div className="array-row" key={i}>
                  <Fields
                    schema={f.items}
                    values={row}
                    onChange={(v) =>
                      change(value.map((r, j) => (j === i ? v : r)))
                    }
                    choices={choices}
                    nextChoices={nextChoices}
                    onLoadMore={onLoadMore}
                    loadingChoices={loadingChoices}
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    className="subtle"
                    disabled={disabled || value.length <= (f.minItems || 0)}
                    onClick={() => change(value.filter((_, j) => j !== i))}
                  >
                    Remove line
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                className="secondary"
                disabled={
                  disabled || (value || []).length >= (f.maxItems || 100)
                }
                onClick={() => change([...(value || []), defaults(f.items)])}
              >
                Add line
              </Button>
            </fieldset>
          );
        if (f.type === "boolean")
          return (
            <label className="checkbox" key={key}>
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => change(e.target.checked)}
                disabled={disabled}
              />
              <span>{title}</span>
            </label>
          );
        const common = {
          id: `${inputPrefix}-${key}`,
          value: value ?? "",
          disabled,
          required,
          minLength: f.minLength,
          maxLength: f.maxLength,
          onChange: (e) => change(e.target.value),
          autoComplete: /password/i.test(key)
            ? /old|login/i.test(key)
              ? "current-password"
              : "new-password"
            : "off",
        };
        const options = f.enum || choices[key];
        const numeric = ["number", "integer"].includes(f.type);
        const type = /password/i.test(key)
          ? "password"
          : key === "email"
            ? "email"
            : numeric
              ? "number"
              : key === "month"
                ? "month"
                : "text";
        return (
          <label
            key={key}
            className={f.maxLength > 500 || key === "csv" ? "span-all" : ""}
          >
            <span>
              {title}
              {required && <b className="required"> *</b>}
            </span>
            {key === "csv" && (
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={disabled}
                aria-label="Import CSV file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 90000) {
                      e.target.setCustomValidity(
                        "CSV must be smaller than 90 KB",
                      );
                      e.target.reportValidity();
                      return;
                    }
                    e.target.setCustomValidity("");
                    change(await file.text());
                  }
                }}
              />
            )}
            {options ? (
              <select {...common}>
                <option value="">Choose {title.toLowerCase()}</option>
                {options.map((v) => (
                  <option key={v.value ?? v} value={v.value ?? v}>
                    {t(v.label ?? v)}
                  </option>
                ))}
              </select>
            ) : f.maxLength > 500 || key === "csv" ? (
              <textarea {...common} rows={key === "csv" ? 8 : 3} />
            ) : (
              <input
                {...common}
                type={type}
                min={f.minimum ?? f.exclusiveMinimum}
                max={f.maximum}
                step={
                  f.type === "integer"
                    ? 1
                    : /quantity|moq|Quantity/.test(key)
                      ? 0.001
                      : 0.01
                }
                pattern={f.pattern}
                dir={
                  key === "email" || /code|token/i.test(key) ? "ltr" : undefined
                }
              />
            )}
            {nextChoices[key] && (
              <Button
                type="button"
                className="subtle small"
                disabled={disabled || loadingChoices[key]}
                onClick={() => onLoadMore(key)}
              >
                Load more choices
              </Button>
            )}
            <small>
              {/Cents$/.test(key)
                ? "Integer cents: $10.00 = 1000"
                : /quantity|moq|Quantity/.test(key)
                  ? "Tonnes • up to 3 decimal places"
                  : /amount|Cost|Total|Fees|salary|deduction|Fee/.test(key)
                    ? "USD • up to 2 decimal places"
                    : key === "csv"
                      ? "Header: date,reference,amount. Amount is signed USD."
                      : key === "direct"
                        ? ""
                        : null}
            </small>
          </label>
        );
      })}
    </div>
  );
}
export function CommandForm({ command, api, user, onClose, onDone }) {
  const { t, language } = usePreferences();
  const schema = useMemo(() => {
    const original = contracts[`${command.method || "POST"} ${command.path}`];
    if (!original) return null;
    const copy = structuredClone(original);
    if (user?.role === "customer" && command.path === "/inquiries") {
      delete copy.properties.customer;
      delete copy.properties.source;
      copy.required = (copy.required || []).filter(
        (k) => !["customer", "source"].includes(k),
      );
    }
    if (
      command.path === "/records/party" &&
      ["seller", "procurement"].includes(user?.role)
    )
      copy.properties.type.enum = [
        user.role === "seller" ? "customer" : "supplier",
      ];
    if (command.path === "/users" && user?.role === "manager")
      copy.properties.role.enum = ["seller", "procurement"];
    return copy;
  }, [command.path, command.method, user?.role]);
  const [values, setValues] = useState(() => ({
      ...defaults(schema || {}),
      ...command.initial,
    })),
    [target, setTarget] = useState(command.id || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [result, setResult] = useState(null),
    [choices, setChoices] = useState({}),
    [choiceCursors, setChoiceCursors] = useState({}),
    [loadingChoices, setLoadingChoices] = useState({}),
    [retryKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let live = true;
    const keys = [...new Set(propertyKeys(schema || {}))].filter(
      (k) =>
        relationPaths[k] &&
        (k !== "receiptKey" || !!command.id) &&
        (k !== "category" || command.path === "/accounting/expenses"),
    );
    Promise.all(
      keys.map(async (k) => {
        try {
          const r = await api.request(
            relationPaths[k].replace("{id}", command.id) + "?limit=100",
          );
          const list = Array.isArray(r) ? r : r.items || r.accounts || [];
          return [
            k,
            list
              .filter(
                (x) =>
                  ((k !== "customer" && k !== "supplier") || x.type === k) &&
                  (k !== "category" || x.type === "expense") &&
                  (k !== "receiptKey" ||
                    (x.status === "Clean" && x.kind === "payment-receipt")) &&
                  (k !== "payment" ||
                    !command.path.endsWith("/card-refunds") ||
                    (x.method === "VISA" &&
                      x.status === "Verified" &&
                      (!command.context?.order ||
                        x.order === command.context.order))),
              )
              .map((x) => ({
                value: ["account", "category"].includes(k)
                  ? x.name
                  : recordId(x),
                label:
                  (productName(x) ||
                    x.code ||
                    x.memo ||
                    x.reference ||
                    shortId(x)) + (x.quantity ? " · " + x.quantity + " t" : ""),
              })),
            r.nextCursor || null,
          ];
        } catch (e) {
          if(live)setError(e);
          return [k, [], null];
        }
      }),
    ).then((pairs) => {
      if (live) {
        setChoices(Object.fromEntries(pairs.map(([k, v]) => [k, v])));
        setChoiceCursors(Object.fromEntries(pairs.map(([k, , c]) => [k, c])));
      }
    });
    return () => {
      live = false;
    };
  }, [api, schema, command.path]);
  async function loadChoices(k) {
    if (!choiceCursors[k] || loadingChoices[k]) return;
    setLoadingChoices((v) => ({ ...v, [k]: true }));
    try {
      const r = await api.request(
        relationPaths[k].replace("{id}", command.id) +
          "?limit=100&cursor=" +
          choiceCursors[k],
      );
      const items = (r.items || [])
        .filter(
          (x) =>
            ((k !== "customer" && k !== "supplier") || x.type === k) &&
            (k !== "category" || x.type === "expense") &&
            (k !== "receiptKey" ||
              (x.status === "Clean" && x.kind === "payment-receipt")) &&
            (k !== "payment" ||
              !command.path.endsWith("/card-refunds") ||
              (x.method === "VISA" &&
                x.status === "Verified" &&
                (!command.context?.order ||
                  x.order === command.context.order))),
        )
        .map((x) => ({
          value: ["account", "category"].includes(k) ? x.name : recordId(x),
          label:
            (productName(x) || x.code || x.memo || x.reference || shortId(x)) +
            (x.quantity ? " · " + x.quantity + " t" : ""),
        }));
      setChoices((v) => ({ ...v, [k]: [...(v[k] || []), ...items] }));
      setChoiceCursors((v) => ({ ...v, [k]: r.nextCursor || null }));
    } catch (e) {
      setError(e);
    } finally {
      setLoadingChoices((v) => ({ ...v, [k]: false }));
    }
  }
  if (!schema)
    return (
      <Modal title={command.title} onClose={onClose}>
        <ErrorBox error={Error("This action has no backend contract.")} />
      </Modal>
    );
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (command.path.includes("{id}") && !/^[a-f\d]{24}$/i.test(target))
        throw Error("A valid record ID is required");
      const body = formBody(schema, values);
      if (body.lines) {
        const sums = journalTotals(body.lines);
        if (!sums.debit || sums.debit !== sums.credit)
          throw Error(
            "Debits and credits must balance and be greater than zero",
          );
      }
      if (command.path.endsWith("/shipments")) {
        if (body.direct) {
          delete body.warehouse;
          if (!body.sourceBorder || !body.directCost)
            throw Error(
              "Direct delivery requires source border and direct cost",
            );
        } else {
          delete body.sourceBorder;
          delete body.directCost;
          if (!body.warehouse) throw Error("Choose the dispatch warehouse");
        }
        if (
          body.additionalFee > 0 &&
          (!body.feeAccepted || !body.acceptanceEvidence)
        )
          throw Error(
            "Record customer acceptance for the additional delivery fee",
          );
      }
      const out = await api.request(command.path.replace("{id}", target), {
        method: command.method || "POST",
        body,
        key: retryKey,
      });
      if (out?.url) {
        const safe = safeCheckoutUrl(out.url);
        if (!safe) throw Error("Checkout returned an unsupported destination");
        window.location.assign(safe);
        return;
      }
      if (out?.secret || out?.recoveryCodes) {
        setResult(out);
        onDone?.(out, false);
      } else {
        onDone?.(out, true);
        onClose();
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={command.title} onClose={() => !busy && onClose()}>
      {result ? (
        <div className="form-body">
          <p className="notice">
            Save these credentials securely. They are shown only for this
            enrollment.
          </p>
          {result.secret && (
            <>
              <label>
                Authenticator secret
                <input readOnly value={result.secret} dir="ltr" />
              </label>
              <p>
                Enter this secret in your authenticator, then use “Confirm
                authenticator” with its six-digit code.
              </p>
            </>
          )}
          {result.recoveryCodes && (
            <>
              <p>Your recovery codes (each can be used once):</p>
              <div className="recovery-codes">
                {result.recoveryCodes.map((c) => (
                  <code key={c}>{c}</code>
                ))}
              </div>
              <p>
                Your sessions were revoked. Sign in again with your
                authenticator.
              </p>
            </>
          )}
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="form-body">
            {command.path.includes("{id}") && !command.id && (
              <label>
                <span>Record ID *</span>
                <input
                  required
                  pattern="[a-fA-F0-9]{24}"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </label>
            )}
            {/returns$/.test(command.path) && (
              <p className="notice">
                Before dispatch: refund of payments received. After dispatch:
                25% of the total order is retained. Returns after handover must
                be requested within the order’s stated return window and pass
                inspection.
              </p>
            )}
            {/shipments$/.test(command.path) && (
              <p className="notice">
                For deliveries added after the deal, record the additional fee
                and customer acceptance. Direct shipments require a source
                border and direct cost.
              </p>
            )}
            {/verify$/.test(command.path) && (
              <p className="notice">
                Confirm funds actually reached the company bank account. A
                receipt alone does not confirm payment.
              </p>
            )}
            {/accept$/.test(command.path) && (
              <p className="notice">
                Submitting accepts the quotation, its delivery fees, border
                handover point, split-delivery terms, and return policy.
              </p>
            )}
            {values.productTotal !== undefined && (
              <div className="form-summary">
                <div>
                  <span>Total quotation</span>
                  <b>
                    {money(
                      Math.round(
                        (Number(values.productTotal || 0) +
                          Number(values.deliveryFees || 0)) *
                          100,
                      ),
                    )}
                  </b>
                </div>
                <div>
                  <span>50% before dispatch</span>
                  <b>
                    {money(
                      Math.round(
                        (Number(values.productTotal || 0) +
                          Number(values.deliveryFees || 0)) *
                          50,
                      ),
                    )}
                  </b>
                </div>
              </div>
            )}
            {values.lines && (
              <div
                className={`journal-balance ${journalTotals(values.lines).debit === journalTotals(values.lines).credit ? "balanced" : ""}`}
              >
                <span>
                  Debits{" "}
                  <strong>{money(journalTotals(values.lines).debit)}</strong>
                </span>
                <span>
                  Credits{" "}
                  <strong>{money(journalTotals(values.lines).credit)}</strong>
                </span>
                <span>
                  {journalTotals(values.lines).debit ===
                  journalTotals(values.lines).credit
                    ? "Balanced"
                    : "Not balanced"}
                </span>
              </div>
            )}
            {command.context && (
              <p className="notice">
                {productName(command.context) ||
                  command.context.name ||
                  command.context.reference ||
                  "Record #" + shortId(command.context)}
                {command.context.refundCents !== undefined && (
                  <>
                    {" "}
                    · Confirmed refund:{" "}
                    <b>{money(command.context.refundCents)}</b>
                  </>
                )}
              </p>
            )}
            <Fields
              schema={schema}
              values={values}
              onChange={setValues}
              choices={choices}
              nextChoices={choiceCursors}
              onLoadMore={loadChoices}
              loadingChoices={loadingChoices}
              disabled={busy}
            />
            <ErrorBox error={error} />
          </div>
          <footer>
            <Button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={onClose}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("Loading…") : t(command.title)}
            </Button>
          </footer>
        </form>
      )}
    </Modal>
  );
}

function propertyKeys(schema) {
  return Object.entries(schema.properties || {}).flatMap(([k, f]) => [
    k,
    ...(f.type === "object"
      ? propertyKeys(f)
      : f.type === "array"
        ? propertyKeys(f.items)
        : []),
  ]);
}
