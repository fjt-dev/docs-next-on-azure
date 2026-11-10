export type Preference = "light" | "dark" | "system";

/** The saved choice (localStorage), or "system"; storage can be blocked. */
export function readPreference(): Preference {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // blocked: follow the device
  }
  return "system";
}

export function savePreference(preference: Preference) {
  try {
    localStorage.setItem("theme", preference);
  } catch {
    // ignore
  }
}

/** Puts the theme on <html>. */
export function applyPreference(preference: Preference) {
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
