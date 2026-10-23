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
import messages from "./locales/messages.json";

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
  const t = (value, params = {}) => {
    if (typeof value !== "string") return value;
    const translated = (messages[language] || {})[value] || value;
    return translated.replace(/\{(\w+)\}/g, (all, key) =>
      params[key] === undefined ? all : String(params[key]),
    );
  };
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
      const normalized = node.replace(/\s+/g, " ").trim();
      const translated = t(normalized);
      if (translated === normalized) return node;
      return (
        (/^\s/.test(node) ? " " : "") +
        translated +
        (/\s$/.test(node) ? " " : "")
      );
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
