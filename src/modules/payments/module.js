export default {
  key: "payments",
  title: "Payments",
  icon: "wallet",
  roles: ["admin", "manager", "seller"],
  path: "/records/payment",
  columns: ["order", "amountCents", "method", "reference", "status"],
  rowActions: [
    {
      title: "Verify bank funds",
      path: "/payments/{id}/verify",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
