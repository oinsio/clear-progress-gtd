import { createContext, useContext, useEffect, useState } from "react";
import type { AccentColor, ColorScheme } from "@/types/common";
import { ACCENT_COLORS, COLOR_SCHEMES, DEFAULT_ACCENT_COLOR, DEFAULT_COLOR_SCHEME, SETTING_KEYS, STORAGE_KEYS } from "@/constants";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { useSync } from "@/app/providers/SyncProvider";
import * as React from "react";

interface ThemeContextValue {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => Promise<void>;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const settingsRepository = new SettingsRepository();

function getInitialAccentColor(): AccentColor {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR);
    if (cached && ACCENT_COLORS.includes(cached as AccentColor)) {
      return cached as AccentColor;
    }
  } catch {
    // localStorage недоступен — используем дефолт
  }
  return DEFAULT_ACCENT_COLOR;
}

function getInitialColorScheme(): ColorScheme {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME);
    if (cached && COLOR_SCHEMES.includes(cached as ColorScheme)) {
      return cached as ColorScheme;
    }
  } catch {
    // localStorage недоступен — используем дефолт
  }
  return DEFAULT_COLOR_SCHEME;
}

function applyColorScheme(scheme: ColorScheme): void {
  const isDark =
    scheme === "dark" ||
    (scheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(getInitialAccentColor);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(getInitialColorScheme);
  const { syncVersion } = useSync();

  useEffect(() => {
    settingsRepository
      .getValue(SETTING_KEYS.ACCENT_COLOR)
      .then((storedColor) => {
        if (storedColor && ACCENT_COLORS.includes(storedColor as AccentColor)) {
          const color = storedColor as AccentColor;
          applyAccentColor(color);
          setAccentColorState(color);
          localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
        }
      })
      .catch(console.error);
  }, [syncVersion]);

  useEffect(() => {
    const initialScheme = getInitialColorScheme();
    applyColorScheme(initialScheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (): void => {
      if (colorScheme === "system") {
        applyColorScheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [colorScheme]);

  const setAccentColor = async (color: AccentColor): Promise<void> => {
    applyAccentColor(color);
    setAccentColorState(color);
    localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
    await settingsRepository.set(SETTING_KEYS.ACCENT_COLOR, color);
  };

  const setColorScheme = (scheme: ColorScheme): void => {
    applyColorScheme(scheme);
    setColorSchemeState(scheme);
    localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, scheme);
  };

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor, colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyAccentColor(color: AccentColor): void {
  document.documentElement.setAttribute("data-accent", color);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
