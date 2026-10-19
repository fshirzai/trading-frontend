export default {
  key: "reconciliation",
  title: "Bank reconciliation",
  icon: "check",
  roles: ["admin", "manager"],
  path: "/reconciliation/statements",
  columns: ["name", "account", "openingCents", "closingCents", "status"],
  actions: [
    {
      title: "Import statement",
      path: "/reconciliation/statements",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
  rowActions: [
    {
      title: "Close statement",
      path: "/reconciliation/statements/{id}/close",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
