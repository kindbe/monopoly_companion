/** The user-selectable contrast modes. Owned here, alongside every operation
 *  on them, rather than in a shared type grab-bag. */
export type ContrastMode = "standard" | "high-contrast" | "dark"

export const CONTRAST_MODE_STORAGE_KEY = "theme"

export const CONTRAST_MODES: ContrastMode[] = [
  "standard",
  "high-contrast",
  "dark"
]

const CONTRAST_MODE_LABELS: Record<ContrastMode, string> = {
  standard: "standard",
  "high-contrast": "high contrast",
  dark: "dark"
}

export function contrastModeLabel(mode: ContrastMode) {
  return CONTRAST_MODE_LABELS[mode]
}

export function nextContrastMode(mode: ContrastMode): ContrastMode {
  const index = CONTRAST_MODES.indexOf(mode)
  return CONTRAST_MODES[(index + 1) % CONTRAST_MODES.length]
}

/** Migrates the pre-existing boolean theme values onto the three-mode union. */
export function migratePersistedContrastMode(
  storedValue: string | null
): ContrastMode | null {
  if (storedValue === "light") return "standard"
  if (storedValue === null) return null
  return CONTRAST_MODES.includes(storedValue as ContrastMode)
    ? (storedValue as ContrastMode)
    : null
}

export function resolveInitialContrastMode(): ContrastMode {
  const persisted = migratePersistedContrastMode(
    readPersistedContrastMode(CONTRAST_MODE_STORAGE_KEY)
  )
  if (persisted) return persisted
  if (mediaMatches("(prefers-contrast: more)")) return "high-contrast"
  if (mediaMatches("(prefers-color-scheme: dark)")) return "dark"
  return "standard"
}

function readPersistedContrastMode(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    // Storage can be unavailable in private modes; fall back to preferences.
    return null
  }
}

/**
 * Persist the selected mode, tolerating unavailable storage. Safari in private
 * mode throws on write as well as read, and this runs in an effect on first
 * paint, so an unguarded write would take the whole app down.
 */
export function persistContrastMode(key: string, mode: ContrastMode) {
  try {
    localStorage.setItem(key, mode)
  } catch {
    // Preference simply does not survive the session.
  }
}

function mediaMatches(query: string) {
  return window.matchMedia?.(query)?.matches === true
}
