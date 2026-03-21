import type { Setting } from "@/types/entities";
import { db } from "../database";

export class SettingsRepository {
  async getAll(): Promise<Setting[]> {
    return db.settings.toArray();
  }

  async getByKey(key: string): Promise<Setting | undefined> {
    return db.settings.get(key);
  }

  async getValue(key: string): Promise<string | undefined> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }

  async set(key: string, value: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await db.settings.put({ key, value, updated_at: updatedAt });
  }

  async bulkUpsert(settings: Setting[]): Promise<void> {
    if (settings.length === 0) return;

    const existingSettings = await this.getAll();
    const existingByKey = new Map(existingSettings.map((s) => [s.key, s]));

    const settingsToUpsert = settings.filter((incoming) => {
      const existing = existingByKey.get(incoming.key);
      return !existing || incoming.updated_at > existing.updated_at;
    });

    if (settingsToUpsert.length > 0) {
      await db.settings.bulkPut(settingsToUpsert);
    }
  }
}
