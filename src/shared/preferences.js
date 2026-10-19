export const colors = ["emerald", "ocean", "amber", "violet", "graphite"];
export const modes = ["light", "dark", "system"];
export function validPreferences(value = {}) {
  return {
    language: ["en", "ps", "fa"].includes(value.language)
      ? value.language
      : "en",
    mode: modes.includes(value.mode) ? value.mode : "system",
    color: colors.includes(value.color) ? value.color : "emerald",
    density: ["comfortable", "compact"].includes(value.density)
      ? value.density
      : "comfortable",
  };
}
export function resolveMode(mode, systemDark) {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}
