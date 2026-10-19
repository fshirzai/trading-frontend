export function csvCell(value) {
  let s = value === undefined || value === null ? "" : String(value);
  if (typeof value !== "number" && /^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function reportCsv(rows) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return (
    "\uFEFF" +
    [
      keys.map(csvCell).join(","),
      ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")),
    ].join("\r\n")
  );
}
