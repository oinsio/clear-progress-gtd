import { createContext, useContext, useEffect, useState } from "react";
import type { AccentColor } from "@/types/common";
import { ACCENT_COLORS, SETTING_KEYS } from "@/constants";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";

interface ThemeContextValue {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const settingsRepository = new SettingsRepository();

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>("green");

  useEffect(() => {
    settingsRepository
      .getValue(SETTING_KEYS.ACCENT_COLOR)
      .then((storedColor) => {
        if (storedColor && ACCENT_COLORS.includes(storedColor as AccentColor)) {
          applyAccentColor(storedColor as AccentColor);
          setAccentColorState(storedColor as AccentColor);
        }
      })
      .catch(console.error);
  }, []);

  const setAccentColor = async (color: AccentColor): Promise<void> => {
    applyAccentColor(color);
    setAccentColorState(color);
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
