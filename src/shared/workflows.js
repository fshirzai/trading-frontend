export function canUseAction(action, row, role, { cardEnabled = false } = {}) {
  if (action.roles && !action.roles.includes(role)) return false;
  const p = action.path;
  if (p.includes("/checkout"))
    return (
      cardEnabled &&
      !!row.acceptedAt &&
      !["Return requested", "Refunded", "Cancelled"].includes(row.status)
    );
  if (p === "/orders/{id}/accept")
    return !row.acceptedAt && row.status === "Awaiting acceptance";
  if (p === "/orders/{id}/revise")
    return !row.acceptedAt && row.status === "Awaiting acceptance";
  if (p === "/orders/{id}/payments")
    return (
      !!row.acceptedAt &&
      !["Return requested", "Refunded", "Cancelled"].includes(row.status) &&
      row.paidCents < row.totalCents
    );
  if (p === "/orders/{id}/shipments")
    return ["Ready to ship", "In transit", "Partially delivered"].includes(
      row.status,
    );
  if (p === "/orders/{id}/returns")
    return (
      !!row.acceptedAt &&
      !["Return requested", "Refunded", "Cancelled"].includes(row.status)
    );
  if (p === "/inquiries/{id}/proforma") return row.status === "New";
  if (p === "/payments/{id}/verify") return row.status === "Pending";
  if (p === "/shipments/{id}/handover") return row.status === "In transit";
  if (p === "/purchases/{id}/receive") return row.status === "Ordered";
  if (p === "/purchases/{id}/pay")
    return row.status === "Received" && row.paidCents < row.costCents;
  if (p.startsWith("/returns/{id}/")) return row.status === "Requested";
  if (p === "/journals/{id}/reverse")
    return row.reference?.startsWith("manual:") && !row.reversalOf;
  if (p === "/users/{id}") return row.role !== "admin";
  if (p === "/notifications/{id}/read") return !row.readAt;
  if (p === "/reconciliation/statements/{id}/close")
    return row.status === "Open";
  return true;
}
export const orderStages = [
  "Awaiting acceptance",
  "Deposit pending",
  "Ready to ship",
  "In transit",
  "Delivered",
];
export function orderStageIndex(order) {
  if (order.status === "Partially delivered") return 3;
  return orderStages.indexOf(order.status);
}
export function returnEstimate(order, shipments) {
  const retained = shipments.length ? Math.round(order.totalCents * 0.25) : 0;
  const dates = shipments
    .filter((s) => s.handedOverAt)
    .map((s) => new Date(s.handedOverAt).getTime());
  return {
    retainedCents: retained,
    refundCents: Math.max(0, order.paidCents - retained),
    deadline: dates.length
      ? new Date(Math.min(...dates) + order.returnHours * 3600000).toISOString()
      : null,
  };
}
export function journalTotals(lines = []) {
  return {
    debit: lines.reduce((n, x) => n + Number(x.debitCents || 0), 0),
    credit: lines.reduce((n, x) => n + Number(x.creditCents || 0), 0),
  };
}
