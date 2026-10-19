export default {
  key: "audit",
  title: "Audit trail",
  icon: "shield",
  roles: ["admin", "manager"],
  path: "/records/audit",
  columns: ["action", "entity", "entityId", "actor", "createdAt"],
};
