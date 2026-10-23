"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { validPreferences, resolveMode } from "./preferences.js";
import { storeTranslations } from "./store-translations.js";
import { extendedTranslations } from "./translations.js";
const ps = {
  Overview: "لنډیز",
  Orders: "امرونه",
  Inquiries: "پوښتنې",
  Products: "محصولات",
  "Customers & suppliers": "پېرودونکي او عرضه کوونکي",
  Inventory: "موجودي",
  Warehouses: "ګودامونه",
  Purchases: "پېرودنې",
  Shipments: "لېږدونې",
  Payments: "تادیات",
  "Returns & refunds": "بېرته ستنول او پیسې",
  "General ledger": "عمومي دفتر",
  "Chart of accounts": "د حسابونو لړلیک",
  Expenses: "لګښتونه",
  "Bank reconciliation": "د بانک حساب تطبیق",
  "Employees & payroll": "کارکوونکي او معاشونه",
  "Financial reports": "مالي راپورونه",
  "Audit trail": "د فعالیتونو ثبت",
  Notifications: "خبرتیاوې",
  "Staff access": "د کارکوونکو لاسرسی",
  "Account security": "د حساب امنیت",
  "Sign in": "ننوتل",
  "Create account": "حساب جوړول",
  "Sign out": "وتل",
  Search: "لټون",
  Refresh: "تازه کول",
  Cancel: "لغوه کول",
  Submit: "لېږل",
  Close: "تړل",
  "View order": "امر کتل",
  "Trade workspace": "د سوداګرۍ کاري ځای",
  "Welcome back": "بېرته ښه راغلاست",
  "Browse products": "محصولات وګورئ",
  "Request a quote": "د نرخ غوښتنه",
  Home: "کور",
  Email: "برېښنالیک",
  Password: "پټنوم",
  "Full name": "بشپړ نوم",
  Country: "هېواد",
  "Forgot password?": "پټنوم مو هېر دی؟",
  "All products": "ټول محصولات",
  "View all": "ټول وګورئ",
  "Loading…": "بارېږي…",
  "No records yet": "تر اوسه معلومات نشته",
  "Next page": "بله پاڼه",
  "Previous page": "مخکینۍ پاڼه",
  Back: "بېرته",
  Actions: "کړنې",
  Date: "نېټه",
  Status: "حالت",
  Quantity: "مقدار",
  Name: "نوم",
  Total: "ټول",
  Paid: "ورکړل شوې پیسې",
  "Read-only design preview": "یوازې د ډیزاین کتنه",
  "Live workspace": "فعال کاري ځای",
};
const fa = {
  Overview: "نمای کلی",
  Orders: "سفارش‌ها",
  Inquiries: "درخواست‌ها",
  Products: "محصولات",
  "Customers & suppliers": "مشتریان و تأمین‌کنندگان",
  Inventory: "موجودی",
  Warehouses: "گدام‌ها",
  Purchases: "خریدها",
  Shipments: "ارسال‌ها",
  Payments: "پرداخت‌ها",
  "Returns & refunds": "مرجوعی و بازپرداخت",
  "General ledger": "دفتر کل",
  "Chart of accounts": "فهرست حساب‌ها",
  Expenses: "مصارف",
  "Bank reconciliation": "تطبیق حساب بانکی",
  "Employees & payroll": "کارمندان و معاش‌ها",
  "Financial reports": "گزارش‌های مالی",
  "Audit trail": "ثبت فعالیت‌ها",
  Notifications: "اطلاعیه‌ها",
  "Staff access": "دسترسی کارمندان",
  "Account security": "امنیت حساب",
  "Sign in": "ورود",
  "Create account": "ایجاد حساب",
  "Sign out": "خروج",
  Search: "جستجو",
  Refresh: "تازه‌سازی",
  Cancel: "لغو",
  Submit: "ارسال",
  Close: "بستن",
  "View order": "مشاهده سفارش",
  "Trade workspace": "محیط کاری تجارت",
  "Welcome back": "خوش آمدید",
  "Browse products": "مشاهده محصولات",
  "Request a quote": "درخواست قیمت",
  Home: "خانه",
  Email: "ایمیل",
  Password: "رمز عبور",
  "Full name": "نام کامل",
  Country: "کشور",
  "Forgot password?": "رمز را فراموش کرده‌اید؟",
  "All products": "همه محصولات",
  "View all": "مشاهده همه",
  "Loading…": "در حال بارگذاری…",
  "No records yet": "هنوز اطلاعاتی نیست",
  "Next page": "صفحه بعد",
  "Previous page": "صفحه قبل",
  Back: "بازگشت",
  Actions: "عملیات",
  Date: "تاریخ",
  Status: "وضعیت",
  Quantity: "مقدار",
  Name: "نام",
  Total: "مجموع",
  Paid: "پرداخت شده",
  "Read-only design preview": "پیش‌نمایش طراحی",
  "Live workspace": "محیط کاری فعال",
};
const I18n = createContext(null);
export function Preferences({ children }) {
  const [prefs, setPrefs] = useState(validPreferences()),
    [ready, setReady] = useState(false),
    [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem("trade-preferences") || "{}");
    } catch {}
    setPrefs(validPreferences(saved));
    setReady(true);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const listener = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  const { language, mode, color, density } = prefs,
    theme = resolveMode(mode, systemDark);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "en" ? "ltr" : "rtl";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.color = color;
    document.documentElement.dataset.density = density;
    try {
      localStorage.setItem("trade-preferences", JSON.stringify(prefs));
    } catch {}
  }, [prefs, theme, ready, language, color, density]);
  const change = (key, value) =>
    setPrefs((p) => validPreferences({ ...p, [key]: value }));
  const t = (value) =>
    typeof value === "string"
      ? (storeTranslations[language] || {})[value] ||
        (extendedTranslations[language] || {})[value] ||
        (language === "ps" ? ps : language === "fa" ? fa : {})[value] ||
        value
      : value;
  return (
    <I18n.Provider
      value={{
        language,
        setLanguage: (v) => change("language", v),
        mode,
        setMode: (v) => change("mode", v),
        theme,
        setTheme: (v) => change("mode", v),
        color,
        setColor: (v) => change("color", v),
        density,
        setDensity: (v) => change("density", v),
        t,
      }}
    >
      {children}
    </I18n.Provider>
  );
}
export const usePreferences = () => useContext(I18n);

export function Localized({ children }) {
  const { t } = usePreferences();
  function visit(node) {
    if (typeof node === "string") {
      const trimmed = node.trim();
      return node.replace(trimmed, t(trimmed));
    }
    if (Array.isArray(node)) return Children.map(node, visit);
    if (!isValidElement(node)) return node;
    const props = {};
    for (const key of ["title", "placeholder", "aria-label"])
      if (typeof node.props[key] === "string") props[key] = t(node.props[key]);
    if (node.props.children !== undefined)
      props.children = visit(node.props.children);
    return cloneElement(node, props);
  }
  return visit(children);
}
