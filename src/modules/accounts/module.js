export default {
  key: "accounts",
  title: "Chart of accounts",
  icon: "wallet",
  roles: ["admin", "manager"],
  path: "/accounting/accounts",
  columns: ["code", "name", "type"],
  actions: [
    {
      title: "Add account",
      path: "/accounting/accounts",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
