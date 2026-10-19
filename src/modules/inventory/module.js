export default {
  key: "inventory",
  title: "Inventory",
  icon: "box",
  roles: ["admin", "manager", "seller", "procurement"],
  path: "/records/batch",
  columns: ["code", "product", "warehouse", "quantity", "valueCents"],
  actions: [
    {
      title: "Transfer stock",
      path: "/stock/transfer",
      roles: ["admin", "manager", "procurement"],
      method: "POST",
    },
  ],
};
