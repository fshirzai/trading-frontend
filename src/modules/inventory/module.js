export default {
  key: "inventory",
  title: "Inventory",
  icon: "box",
  roles: ["admin", "manager", "seller", "procurement"],
  path: "/stock/summary",
  columns: ["name", "quantity", "reserved", "available", "locations"],
  actions: [
    {
      title: "Transfer stock",
      path: "/stock/transfer",
      roles: ["admin", "manager", "procurement"],
      method: "POST",
    },
  ],
};
