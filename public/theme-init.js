(() => {
  try {
    const p = JSON.parse(localStorage.getItem("trade-preferences") || "{}");
    const root = document.documentElement;
    const mode = ["light", "dark", "system"].includes(p.mode)
      ? p.mode
      : "system";
    root.dataset.theme =
      mode === "system"
        ? matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;
    root.dataset.color = [
      "emerald",
      "ocean",
      "amber",
      "violet",
      "graphite",
    ].includes(p.color)
      ? p.color
      : "emerald";
    root.dataset.density = p.density === "compact" ? "compact" : "comfortable";
    root.lang = ["en", "ps", "fa"].includes(p.language) ? p.language : "en";
    root.dir = root.lang === "en" ? "ltr" : "rtl";
  } catch {}
})();
