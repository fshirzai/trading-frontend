export default {
  key: "logistics",
  title: "Shipments",
  icon: "truck",
  roles: ["admin", "manager", "seller", "procurement"],
  path: "/records/shipment",
  columns: ["order", "quantity", "driver", "vehicle", "status", "handedOverAt"],
  rowActions: [
    {
      title: "Record handover",
      path: "/shipments/{id}/handover",
      roles: ["admin", "manager", "seller"],
      method: "POST",
    },
  ],
};
