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
    // "system" is the default: no stored value, so that a pinned scheme is never kept by accident.
    if (preference === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", preference);
  } catch {
    // ignore
  }
}

/**
 * Puts the choice into <meta name="color-scheme">: "light dark" follows the system, "light" and "dark"
 * pin a scheme. The CSS maps the meta tag to the color-scheme property, and light-dark() follows it.
 */
export function applyPreference(preference: Preference) {
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute("content", preference === "system" ? "light dark" : preference);
}
