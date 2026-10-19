export default {
  key: "sales",
  title: "Orders",
  icon: "box",
  roles: ["admin", "manager", "seller", "procurement", "customer"],
  path: "/orders",
  columns: [
    "productSnapshot",
    "quantity",
    "totalCents",
    "paidCents",
    "status",
    "createdAt",
  ],
  rowActions: [
    {
      title: "Accept quotation",
      path: "/orders/{id}/accept",
      roles: ["admin", "manager", "seller", "customer"],
      method: "POST",
    },
    {
      title: "Revise quotation",
      path: "/orders/{id}/revise",
      roles: ["admin", "manager", "seller"],
      method: "POST",
    },
    {
      title: "Record TT payment",
      path: "/orders/{id}/payments",
      roles: ["admin", "manager", "seller", "customer"],
      method: "POST",
    },
    {
      title: "Pay by card",
      path: "/orders/{id}/checkout",
      roles: ["admin", "manager", "seller", "customer"],
      method: "POST",
    },
    {
      title: "Dispatch shipment",
      path: "/orders/{id}/shipments",
      roles: ["admin", "manager", "seller"],
      method: "POST",
    },
    {
      title: "Request return / cancellation",
      path: "/orders/{id}/returns",
      roles: ["admin", "manager", "seller", "customer"],
      method: "POST",
    },
  ],
};
