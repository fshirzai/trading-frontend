export const money = (cents = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(cents) / 100,
  );
export const shortId = (value) =>
  String(
    value && typeof value === "object"
      ? value._id || value.id || ""
      : value || "",
  )
    .slice(-8)
    .toUpperCase();
export const recordId = (value) => value?._id || value?.id || "";
export const productName = (p, language = "en") =>
  p?.name?.[language] ||
  p?.name?.en ||
  p?.productSnapshot?.name?.[language] ||
  p?.productSnapshot?.name?.en ||
  (typeof p?.name === "string" ? p.name : "");
export const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
export function formBody(schema, values) {
  const result = {};
  for (const [key, rawField] of Object.entries(schema.properties || {})) {
    const value = values[key] === undefined ? rawField.default : values[key];
    const field = rawField.type
      ? rawField
      : { ...rawField, ...rawField.anyOf?.[0] };
    if (value === undefined || value === "") {
      if (schema.required?.includes(key)) throw Error(`${key} is required`);
      continue;
    }
    if (
      field.type === "array" &&
      value.length === 0 &&
      !schema.required?.includes(key)
    )
      continue;
    if (field.type === "object") result[key] = formBody(field, value);
    else if (field.type === "array")
      result[key] = value.map((v) =>
        field.items.type === "object" ? formBody(field.items, v) : v,
      );
    else if (field.type === "number" || field.type === "integer") {
      const n = Number(value);
      if (!Number.isFinite(n)) throw Error(`${key} must be a number`);
      result[key] = n;
    } else result[key] = value;
  }
  return result;
}
export function label(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/Cents$/, " (cents)")
    .replace(/Id$/, " ID");
}
