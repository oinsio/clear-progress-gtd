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
    await db.settings.bulkPut(settings);
  }
}
