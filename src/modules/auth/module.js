export default {
  key: "auth",
  title: "My profile & security",
  icon: "shield",
  roles: ["admin", "manager", "seller", "procurement", "customer"],
  actions: [
    {
      title: "Change password",
      path: "/auth/change-password",
      roles: ["admin", "manager", "seller", "procurement", "customer"],
      method: "POST",
    },
    {
      title: "Set up authenticator",
      path: "/auth/mfa/enroll",
      roles: ["admin", "manager", "seller", "procurement", "customer"],
      method: "POST",
    },
    {
      title: "Confirm authenticator",
      path: "/auth/mfa/confirm",
      roles: ["admin", "manager", "seller", "procurement", "customer"],
      method: "POST",
    },
    {
      title: "Disable authenticator",
      path: "/auth/mfa/disable",
      roles: ["admin", "manager", "seller", "procurement", "customer"],
      method: "POST",
    },
    {
      title: "Sign out all devices",
      path: "/auth/logout-all",
      roles: ["admin", "manager", "seller", "procurement", "customer"],
      method: "POST",
    },
  ],
};
