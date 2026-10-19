import dashboard from "./dashboard/module.js";
import sales from "./sales/module.js";
import inquiries from "./inquiries/module.js";
import catalog from "./catalog/module.js";
import contacts from "./contacts/module.js";
import inventory from "./inventory/module.js";
import warehouses from "./warehouses/module.js";
import procurement from "./procurement/module.js";
import logistics from "./logistics/module.js";
import payments from "./payments/module.js";
import returns from "./returns/module.js";
import accounting from "./accounting/module.js";
import accounts from "./accounts/module.js";
import expenses from "./expenses/module.js";
import reconciliation from "./reconciliation/module.js";
import payroll from "./payroll/module.js";
import reports from "./reports/module.js";
import audit from "./audit/module.js";
import notifications from "./notifications/module.js";
import users from "./users/module.js";
import auth from "./auth/module.js";
export const modules = [
  dashboard,
  sales,
  inquiries,
  catalog,
  contacts,
  inventory,
  warehouses,
  procurement,
  logistics,
  payments,
  returns,
  accounting,
  accounts,
  expenses,
  reconciliation,
  payroll,
  reports,
  audit,
  notifications,
  users,
  auth,
];
export const allowedModules = (role) =>
  modules.filter((m) => m.roles.includes(role));
