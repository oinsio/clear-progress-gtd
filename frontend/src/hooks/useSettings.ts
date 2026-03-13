import { useState, useEffect, useCallback } from "react";
import type { Box, AccentColor } from "@/types/common";
import { SettingsService } from "@/services/SettingsService";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { BOX, DEFAULT_ACCENT_COLOR, SETTING_KEYS } from "@/constants";

const defaultSettingsService = new SettingsService(new SettingsRepository());

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
  const [defaultBox, setDefaultBoxState] = useState<Box>(BOX.INBOX);
  const [accentColor, setAccentColorState] =
    useState<AccentColor>(DEFAULT_ACCENT_COLOR);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const [box, color] = await Promise.all([
      settingsService.getDefaultBox(),
      settingsService.getAccentColor(),
    ]);
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
      await settingsService.getDefaultBox();
      setDefaultBoxState(box);
    },
    [settingsService],
  );

  const setAccentColor = useCallback(
    async (color: AccentColor) => {
      await settingsService.set(SETTING_KEYS.ACCENT_COLOR, color);
      await settingsService.getAccentColor();
      setAccentColorState(color);
    },
    [settingsService],
  );

  return { defaultBox, accentColor, isLoading, setDefaultBox, setAccentColor };
}
