export default {
  key: "returns",
  title: "Returns & refunds",
  icon: "refresh",
  roles: ["admin", "manager", "seller"],
  path: "/records/return",
  columns: ["order", "reason", "refundCents", "status", "createdAt"],
  rowActions: [
    {
      title: "Complete return",
      path: "/returns/{id}/complete",
      roles: ["admin", "manager"],
      method: "POST",
    },
    {
      title: "Reject return",
      path: "/returns/{id}/reject",
      roles: ["admin", "manager"],
      method: "POST",
    },
    {
      title: "Process card refund",
      path: "/returns/{id}/card-refunds",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
