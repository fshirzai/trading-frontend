export default {
  key: "expenses",
  title: "Expenses",
  icon: "wallet",
  roles: ["admin", "manager"],
  path: "/accounting/expenses",
  columns: ["category", "amountCents", "memo", "reference", "createdAt"],
  actions: [
    {
      title: "Record expense",
      path: "/accounting/expenses",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
