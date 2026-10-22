export default {
  key: "notifications",
  title: "Notifications",
  icon: "bell",
  roles: ["admin", "manager", "seller", "procurement", "customer"],
  path: "/notifications",
  columns: [
    "title",
    "body",
    "action",
    "entity",
    "entityId",
    "readAt",
    "createdAt",
  ],
  rowActions: [
    {
      title: "Mark as read",
      path: "/notifications/{id}/read",
      roles: ["admin", "manager", "seller", "procurement", "customer"],
      method: "POST",
    },
  ],
};
