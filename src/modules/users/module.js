export default {
  key: "users",
  title: "Staff access",
  icon: "users",
  roles: ["admin", "manager"],
  path: "/users",
  columns: ["name", "email", "role", "active", "emailVerified", "mfaEnabled"],
  actions: [
    {
      title: "Create staff account",
      path: "/users",
      method: "POST",
      roles: ["admin", "manager"],
    },
  ],
  rowActions: [
    {
      title: "Update staff access",
      path: "/users/{id}",
      method: "PATCH",
      roles: ["admin"],
    },
  ],
};
