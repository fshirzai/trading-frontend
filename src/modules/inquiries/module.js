export default {
  key: "inquiries",
  title: "Inquiries",
  icon: "file",
  roles: ["admin", "manager", "seller", "customer"],
  path: "/inquiries",
  columns: ["product", "quantity", "destination", "source", "status"],
  actions: [
    {
      title: "New inquiry",
      path: "/inquiries",
      roles: ["admin", "manager", "seller", "customer"],
      method: "POST",
    },
  ],
  rowActions: [
    {
      title: "Issue quotation",
      path: "/inquiries/{id}/proforma",
      roles: ["admin", "manager", "seller"],
      method: "POST",
    },
  ],
};
