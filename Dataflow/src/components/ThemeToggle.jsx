import { useEffect, useState } from "react";
import { cycleTheme } from "../theme";

export default function ThemeToggle({ compact = false }) {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  useEffect(() => {
    const update = () => setDark(document.documentElement.dataset.theme === "dark");
    window.addEventListener("flowbi-theme-change", update);
    return () => window.removeEventListener("flowbi-theme-change", update);
  }, []);
  return <button type="button" className={`theme-toggle${compact ? " theme-toggle-compact" : ""}`} onClick={cycleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} title={`Switch to ${dark ? "light" : "dark"} theme`}><span aria-hidden="true">{dark ? "☀" : "☾"}</span>{!compact && (dark ? "Light mode" : "Dark mode")}</button>;
}
