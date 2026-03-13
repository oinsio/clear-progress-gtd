import { useState, useEffect, useCallback } from "react";
import type { Box, AccentColor } from "@/types/common";
import { SettingsService } from "@/services/SettingsService";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { ACCENT_COLORS, BOX, DEFAULT_ACCENT_COLOR, SETTING_KEYS, STORAGE_KEYS } from "@/constants";

const defaultSettingsService = new SettingsService(new SettingsRepository());

const BOX_VALUES = Object.values(BOX) as Box[];

function getCachedBox(): Box {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.DEFAULT_BOX);
    if (cached && BOX_VALUES.includes(cached as Box)) {
      return cached as Box;
    }
  } catch {
    // localStorage недоступен
  }
  return BOX.INBOX;
}

function getCachedAccentColor(): AccentColor {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR);
    if (cached && ACCENT_COLORS.includes(cached as AccentColor)) {
      return cached as AccentColor;
    }
  } catch {
    // localStorage недоступен
  }
  return DEFAULT_ACCENT_COLOR;
}

export interface UseSettingsReturn {
  defaultBox: Box;
  accentColor: AccentColor;
  isLoading: boolean;
  setDefaultBox: (box: Box) => Promise<void>;
  setAccentColor: (color: AccentColor) => Promise<void>;
}

export function useSettings(
  settingsService: SettingsService = defaultSettingsService,
): UseSettingsReturn {
  const [defaultBox, setDefaultBoxState] = useState<Box>(getCachedBox);
  const [accentColor, setAccentColorState] =
    useState<AccentColor>(getCachedAccentColor);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const [box, color] = await Promise.all([
      settingsService.getDefaultBox(),
      settingsService.getAccentColor(),
    ]);
    localStorage.setItem(STORAGE_KEYS.DEFAULT_BOX, box);
    localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
    setDefaultBoxState(box);
    setAccentColorState(color);
    setIsLoading(false);
  }, [settingsService]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const setDefaultBox = useCallback(
    async (box: Box) => {
      await settingsService.set(SETTING_KEYS.DEFAULT_BOX, box);
      localStorage.setItem(STORAGE_KEYS.DEFAULT_BOX, box);
      setDefaultBoxState(box);
    },
    [settingsService],
  );

  const setAccentColor = useCallback(
    async (color: AccentColor) => {
      await settingsService.set(SETTING_KEYS.ACCENT_COLOR, color);
      localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
      setAccentColorState(color);
    },
    [settingsService],
  );

  return { defaultBox, accentColor, isLoading, setDefaultBox, setAccentColor };
}
