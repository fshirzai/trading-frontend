"use client";
import { Badge, Button, Empty } from "./ui.jsx";
import {
  date,
  label,
  money,
  productName,
  recordId,
  shortId,
} from "./format.js";
import { usePreferences } from "./i18n.jsx";
export function display(value, key, language) {
  if (value === undefined || value === null) return "—";
  if (/Cents$/.test(key)) return money(value);
  if (/At$|^date$/.test(key)) return date(value);
  if (key === "name" || key === "productSnapshot")
    return (
      productName(
        key === "name" ? { name: value } : { productSnapshot: value },
        language,
      ) || "—"
    );
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object")
    return (
      value[language] ||
      value.en ||
      value.name?.[language] ||
      value.name?.en ||
      value.name ||
      shortId(value)
    );
  if (typeof value === "string" && /^[a-f\d]{24}$/i.test(value))
    return shortId(value);
  return String(value);
}
export default function DataTable({
  items,
  columns,
  rowActions = [],
  onAction,
  onView,
  loading = false,
  actionFilter = () => true,
  renderCell,
}) {
  const { t, language } = usePreferences();
  if (loading)
    return (
      <div className="table-loading" role="status">
        {t("Loading…")}
      </div>
    );
  if (!items.length) return <Empty />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            {columns.map((c) => (
              <th key={c}>{t(label(c).replace(" (cents)", ""))}</th>
            ))}
            {(onView || rowActions.length > 0) && <th>{t("Actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={recordId(item) || item.code || i}>
              <td>
                <button
                  className="record-ref"
                  title={recordId(item)}
                  onClick={() => onView?.(item)}
                  disabled={!onView}
                >
                  {shortId(item) || item.code || String(i + 1).padStart(3, "0")}
                </button>
              </td>
              {columns.map((key) => (
                <td
                  key={key}
                  title={typeof item[key] === "string" ? item[key] : undefined}
                >
                  {renderCell?.(item, key) ??
                    (key === "status" || key === "active" ? (
                      <Badge>
                        {key === "active"
                          ? item.active
                            ? "Active"
                            : "Inactive"
                          : item.status}
                      </Badge>
                    ) : (
                      <span>
                        {display(
                          item._labels?.[key] ?? item[key],
                          key,
                          language,
                        )}
                      </span>
                    ))}
                </td>
              ))}
              {(onView || rowActions.length > 0) && (
                <td>
                  <div className="row-actions">
                    {onView && (
                      <Button
                        className="subtle small"
                        onClick={() => onView(item)}
                      >
                        {t("View all")}
                      </Button>
                    )}
                    {rowActions.length > 0 && (
                      <select
                        aria-label={`Actions for ${shortId(item)}`}
                        value=""
                        onChange={(e) => {
                          const action = rowActions[Number(e.target.value)];
                          if (action && actionFilter(action, item))
                            onAction(action, item);
                        }}
                      >
                        <option value="">{t("Actions")}</option>
                        {rowActions.map((a, i) =>
                          actionFilter(a, item) ? (
                            <option key={a.path} value={i}>
                              {t(a.title)}
                            </option>
                          ) : null,
                        )}
                      </select>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
