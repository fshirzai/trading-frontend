export default {
  key: "catalog",
  title: "Products",
  icon: "leaf",
  roles: ["admin", "manager", "seller", "procurement", "customer"],
  path: "/records/product",
  columns: [
    "name",
    "category",
    "grade",
    "origin",
    "packaging",
    "moq",
    "active",
  ],
  actions: [
    {
      title: "Add product",
      path: "/records/product",
      roles: ["admin", "manager", "procurement"],
      method: "POST",
    },
  ],
  rowActions: [
    {
      title: "Edit product",
      path: "/records/product/{id}",
      roles: ["admin", "manager", "procurement"],
      method: "PATCH",
    },
  ],
};
