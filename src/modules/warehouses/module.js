export default {
  key: "warehouses",
  title: "Warehouses",
  icon: "box",
  roles: ["admin", "manager", "seller", "procurement"],
  path: "/records/warehouse",
  columns: ["name", "country", "address", "active"],
  actions: [
    {
      title: "Add warehouse",
      path: "/records/warehouse",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
  rowActions: [
    {
      title: "Edit warehouse",
      path: "/records/warehouse/{id}",
      roles: ["admin", "manager"],
      method: "PATCH",
    },
  ],
};
