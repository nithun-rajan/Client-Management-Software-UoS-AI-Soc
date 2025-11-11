// Utility to apply accent color from localStorage
// This runs immediately on page load, before React renders

const accentColors: Record<string, string> = {
  purple: "280 75% 60%",
  blue: "210 90% 55%",
  teal: "170 70% 50%",
  green: "150 70% 45%",
  orange: "30 95% 60%",
  pink: "340 75% 55%",
  red: "0 85% 58%",
  indigo: "250 75% 60%",
};

export function applyAccentColorFromStorage() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const saved = localStorage.getItem("accent-color");
  if (saved && accentColors[saved]) {
    const colorHsl = accentColors[saved];
    const root = document.documentElement;
    
    // Apply accent colors immediately
    root.style.setProperty("--accent", colorHsl);
    root.style.setProperty("--ring", colorHsl);
    root.style.setProperty("--primary", colorHsl);
    
    // Update sidebar colors
    root.style.setProperty("--sidebar-background", colorHsl);
    root.style.setProperty("--sidebar-primary", colorHsl);
    root.style.setProperty("--sidebar-ring", colorHsl);
  }
}

// Apply immediately when this module loads
if (typeof window !== "undefined") {
  // Run on next tick to ensure DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAccentColorFromStorage);
  } else {
    applyAccentColorFromStorage();
  }
}

