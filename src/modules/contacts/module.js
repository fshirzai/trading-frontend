export default {
  key: "contacts",
  title: "Customers & suppliers",
  icon: "users",
  roles: ["admin", "manager", "seller", "procurement"],
  path: "/records/party",
  columns: ["name", "type", "country", "email", "phone"],
  actions: [
    {
      title: "Add contact",
      path: "/records/party",
      roles: ["admin", "manager", "seller", "procurement"],
      method: "POST",
    },
  ],
};
