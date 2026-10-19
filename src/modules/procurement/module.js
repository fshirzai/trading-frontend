export default {
  key: "procurement",
  title: "Purchases",
  icon: "wallet",
  roles: ["admin", "manager", "procurement"],
  path: "/records/purchase",
  columns: [
    "supplier",
    "product",
    "quantity",
    "costCents",
    "paidCents",
    "status",
  ],
  actions: [
    {
      title: "New purchase",
      path: "/purchases",
      roles: ["admin", "manager", "procurement"],
      method: "POST",
    },
  ],
  rowActions: [
    {
      title: "Receive goods",
      path: "/purchases/{id}/receive",
      roles: ["admin", "manager", "procurement"],
      method: "POST",
    },
    {
      title: "Pay supplier",
      path: "/purchases/{id}/pay",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
