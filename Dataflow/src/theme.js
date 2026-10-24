export const getThemePreference = () => localStorage.getItem("flowbi-theme") || "light";

export function applyTheme(preference) {
  const resolved = preference === "system"
    ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.dataset.theme = resolved;
  localStorage.setItem("flowbi-theme", preference);
  window.dispatchEvent(new Event("flowbi-theme-change"));
}

export function cycleTheme() {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

export function initializeTheme() {
  const preference = getThemePreference();
  const resolve = () => {
    const resolved = preference === "system"
      ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    document.documentElement.dataset.theme = resolved;
  };
  resolve();
}
