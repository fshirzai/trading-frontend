export default {
  key: "procurementRequests",
  title: "Procurement requests",
  icon: "box",
  roles: ["admin", "manager", "seller", "procurement"],
  path: "/procurement-requests",
  columns: [
    "order",
    "product",
    "quantity",
    "receivedQuantity",
    "status",
    "createdAt",
  ],
  rowActions: [
    {
      title: "Purchase for request",
      path: "/purchases",
      roles: ["admin", "manager", "procurement"],
      method: "POST",
      fromRequest: true,
    },
  ],
};
