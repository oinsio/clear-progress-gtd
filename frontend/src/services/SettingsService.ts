import type { Box, AccentColor } from "@/types/common";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { BOX, DEFAULT_ACCENT_COLOR, SETTING_KEYS } from "@/constants";

export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async get(key: string): Promise<string | undefined> {
    return this.settingsRepository.getValue(key);
  }

  async set(key: string, value: string): Promise<void> {
    return this.settingsRepository.set(key, value);
  }

  async getDefaultBox(): Promise<Box> {
    const value = await this.settingsRepository.getValue(
      SETTING_KEYS.DEFAULT_BOX,
    );
    return (value as Box) ?? BOX.INBOX;
  }

  async getAccentColor(): Promise<AccentColor> {
    const value = await this.settingsRepository.getValue(
      SETTING_KEYS.ACCENT_COLOR,
    );
    return (value as AccentColor) ?? DEFAULT_ACCENT_COLOR;
  }
}
