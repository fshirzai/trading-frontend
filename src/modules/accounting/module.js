export default {
  key: "accounting",
  title: "General ledger",
  icon: "file",
  roles: ["admin", "manager"],
  path: "/records/journal",
  columns: ["memo", "reference", "postedBy", "createdAt"],
  actions: [
    {
      title: "Post journal",
      path: "/journals",
      roles: ["admin", "manager"],
      method: "POST",
    },
    {
      title: "Close month",
      path: "/accounting/periods/close",
      roles: ["admin", "manager"],
      method: "POST",
    },
    {
      title: "Close fiscal year",
      path: "/accounting/fiscal-close",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
  rowActions: [
    {
      title: "Reverse journal",
      path: "/journals/{id}/reverse",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
