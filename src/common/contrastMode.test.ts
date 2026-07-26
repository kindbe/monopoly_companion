import { afterEach, describe, expect, it, vi } from "vitest"
import {
  contrastModeLabel,
  migratePersistedContrastMode,
  nextContrastMode,
  resolveInitialContrastMode
} from "@/common/contrastMode"

function stubPreferences(preferences: Record<string, boolean>) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: preferences[query] === true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  )
}

describe("contrast mode", () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it("migrates the previous boolean theme values", () => {
    expect(migratePersistedContrastMode("light")).toBe("standard")
    expect(migratePersistedContrastMode("dark")).toBe("dark")
  })

  it("keeps values already stored as a contrast mode", () => {
    expect(migratePersistedContrastMode("standard")).toBe("standard")
    expect(migratePersistedContrastMode("high-contrast")).toBe("high-contrast")
  })

  it("treats missing and unrecognized values as unset", () => {
    expect(migratePersistedContrastMode(null)).toBeNull()
    expect(migratePersistedContrastMode("sepia")).toBeNull()
  })

  it("restores a persisted mode ahead of system preferences", () => {
    localStorage.setItem("theme", "light")
    stubPreferences({ "(prefers-color-scheme: dark)": true })

    expect(resolveInitialContrastMode()).toBe("standard")
  })

  it("prefers high contrast over color scheme when nothing is persisted", () => {
    stubPreferences({
      "(prefers-contrast: more)": true,
      "(prefers-color-scheme: dark)": true
    })

    expect(resolveInitialContrastMode()).toBe("high-contrast")
  })

  it("falls back to the reported color scheme", () => {
    stubPreferences({ "(prefers-color-scheme: dark)": true })

    expect(resolveInitialContrastMode()).toBe("dark")
  })

  it("defaults to standard when no preference is reported", () => {
    stubPreferences({})

    expect(resolveInitialContrastMode()).toBe("standard")
  })

  it("cycles through all three modes and labels each one", () => {
    expect(nextContrastMode("standard")).toBe("high-contrast")
    expect(nextContrastMode("high-contrast")).toBe("dark")
    expect(nextContrastMode("dark")).toBe("standard")
    expect(contrastModeLabel("high-contrast")).toBe("high contrast")
  })
})
