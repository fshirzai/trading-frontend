export default {
  key: "notificationDelivery",
  title: "Email delivery",
  icon: "mail",
  roles: ["admin", "manager"],
  path: "/notification-delivery",
  rowActions: [
    {
      title: "Retry email",
      path: "/notification-delivery/{id}/retry",
      method: "POST",
      roles: ["admin", "manager"],
    },
  ],
  columns: [
    "notification",
    "state",
    "attempts",
    "lastError",
    "sentAt",
    "createdAt",
  ],
};
