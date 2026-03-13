import { createContext, useContext, useEffect, useState } from "react";
import type { AccentColor } from "@/types/common";
import { ACCENT_COLORS, DEFAULT_ACCENT_COLOR, SETTING_KEYS, STORAGE_KEYS } from "@/constants";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import * as React from "react";

interface ThemeContextValue {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => Promise<void>;
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(getInitialAccentColor);

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
  }, []);

  const setAccentColor = async (color: AccentColor): Promise<void> => {
    applyAccentColor(color);
    setAccentColorState(color);
    localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
    await settingsRepository.set(SETTING_KEYS.ACCENT_COLOR, color);
  };

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
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
