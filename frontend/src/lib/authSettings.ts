/**
 * Authentication Settings Utility
 * 
 * Manages whether authentication is required to access the application.
 * Default: false (authentication not required) to prevent lockouts.
 */

const AUTH_REQUIRED_KEY = "auth_required";

/**
 * Get whether authentication is required
 * Defaults to false to prevent lockouts
 */
export function getAuthRequired(): boolean {
  const stored = localStorage.getItem(AUTH_REQUIRED_KEY);
  if (stored === null) {
    // Default to false (auth not required) to prevent lockouts
    return false;
  }
  return stored === "true";
}

/**
 * Set whether authentication is required
 */
export function setAuthRequired(required: boolean): void {
  localStorage.setItem(AUTH_REQUIRED_KEY, required ? "true" : "false");
  // Dispatch event so ProtectedRoute can react to changes
  window.dispatchEvent(new Event("auth-setting-changed"));
}

