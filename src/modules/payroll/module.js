export default {
  key: "payroll",
  title: "Employees & payroll",
  icon: "users",
  roles: ["admin", "manager"],
  path: "/records/employee",
  columns: ["name", "job", "salaryCents", "active"],
  actions: [
    {
      title: "Add employee",
      path: "/records/employee",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
  rowActions: [
    {
      title: "Edit employee",
      path: "/records/employee/{id}",
      roles: ["admin", "manager"],
      method: "PATCH",
    },
    {
      title: "Pay salary",
      path: "/employees/{id}/salary",
      roles: ["admin", "manager"],
      method: "POST",
    },
    {
      title: "Pay advance",
      path: "/employees/{id}/advance",
      roles: ["admin", "manager"],
      method: "POST",
    },
  ],
};
