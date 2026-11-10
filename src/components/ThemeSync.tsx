"use client";

import { useEffect, useLayoutEffect } from "react";
import { applyPreference, readPreference } from "@/lib/theme";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Applies the saved theme before the browser paints. The script in the layout only runs when the page
 * is loaded; a change of language is a client-side navigation to another root layout, which makes a
 * new <html> element without a theme.
 */
export function ThemeSync() {
  useIsomorphicLayoutEffect(() => {
    applyPreference(readPreference());
  }, []);
  return null;
}
