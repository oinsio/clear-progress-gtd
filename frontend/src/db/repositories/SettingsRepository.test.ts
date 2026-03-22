import { describe, it, expect, beforeEach } from "vitest";
import { SettingsRepository } from "./SettingsRepository";
import { db } from "../database";
import type { Setting } from "@/types/entities";

function buildSetting(overrides: Partial<Setting> = {}): Setting {
  return {
    key: "default_box",
    value: "inbox",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("SettingsRepository", () => {
  let settingsRepository: SettingsRepository;

  beforeEach(async () => {
    await db.settings.clear();
    settingsRepository = new SettingsRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no settings exist", async () => {
      const settings = await settingsRepository.getAll();
      expect(settings).toEqual([]);
    });

    it("should return all settings", async () => {
      await db.settings.bulkAdd([
        buildSetting({ key: "default_box", value: "inbox" }),
        buildSetting({ key: "accent_color", value: "green" }),
      ]);

      const settings = await settingsRepository.getAll();
      expect(settings).toHaveLength(2);
    });
  });

  describe("getByKey", () => {
    it("should return setting when key exists", async () => {
      const setting = buildSetting({ key: "default_box", value: "today" });
      await db.settings.add(setting);

      const result = await settingsRepository.getByKey("default_box");
      expect(result).toEqual(setting);
    });

    it("should return undefined when key does not exist", async () => {
      const result = await settingsRepository.getByKey("nonexistent_key");
      expect(result).toBeUndefined();
    });
  });

  describe("getValue", () => {
    it("should return value when key exists", async () => {
      await db.settings.add(buildSetting({ key: "accent_color", value: "purple" }));

      const value = await settingsRepository.getValue("accent_color");
      expect(value).toBe("purple");
    });

    it("should return undefined when key does not exist", async () => {
      const value = await settingsRepository.getValue("nonexistent_key");
      expect(value).toBeUndefined();
    });
  });

  describe("set", () => {
    it("should create new setting when key does not exist", async () => {
      await settingsRepository.set("default_box", "week");

      const setting = await db.settings.get("default_box");
      expect(setting?.value).toBe("week");
      expect(setting?.updated_at).toBeTruthy();
    });

    it("should update existing setting value", async () => {
      await db.settings.add(buildSetting({ key: "default_box", value: "inbox" }));
      await settingsRepository.set("default_box", "today");

      const setting = await db.settings.get("default_box");
      expect(setting?.value).toBe("today");
    });

    it("should set updated_at to current ISO timestamp", async () => {
      const before = new Date().toISOString();
      await settingsRepository.set("default_box", "inbox");
      const after = new Date().toISOString();

      const setting = await db.settings.get("default_box");
      expect(setting!.updated_at >= before).toBe(true);
      expect(setting!.updated_at <= after).toBe(true);
    });
  });

  describe("bulkUpsert", () => {
    it("should insert new settings that do not exist locally", async () => {
      const incoming = [
        buildSetting({ key: "default_box", value: "today", updated_at: "2026-03-01T00:00:00.000Z" }),
      ];

      await settingsRepository.bulkUpsert(incoming);

      const setting = await db.settings.get("default_box");
      expect(setting?.value).toBe("today");
    });

    it("should update local setting when incoming has newer updated_at", async () => {
      await db.settings.add(
        buildSetting({ key: "default_box", value: "inbox", updated_at: "2026-01-01T00:00:00.000Z" }),
      );

      await settingsRepository.bulkUpsert([
        buildSetting({ key: "default_box", value: "week", updated_at: "2026-03-01T00:00:00.000Z" }),
      ]);

      const setting = await db.settings.get("default_box");
      expect(setting?.value).toBe("week");
    });

    it("should not overwrite local setting when incoming has older updated_at", async () => {
      await db.settings.add(
        buildSetting({ key: "default_box", value: "today", updated_at: "2026-03-01T00:00:00.000Z" }),
      );

      await settingsRepository.bulkUpsert([
        buildSetting({ key: "default_box", value: "inbox", updated_at: "2026-01-01T00:00:00.000Z" }),
      ]);

      const setting = await db.settings.get("default_box");
      expect(setting?.value).toBe("today");
    });

    it("should not overwrite local setting when incoming has same updated_at", async () => {
      const sameTimestamp = "2026-03-01T00:00:00.000Z";
      await db.settings.add(
        buildSetting({ key: "accent_color", value: "green", updated_at: sameTimestamp }),
      );

      await settingsRepository.bulkUpsert([
        buildSetting({ key: "accent_color", value: "purple", updated_at: sameTimestamp }),
      ]);

      const setting = await db.settings.get("accent_color");
      expect(setting?.value).toBe("green");
    });

    it("should handle mixed incoming — update newer, skip older", async () => {
      await db.settings.bulkAdd([
        buildSetting({ key: "default_box", value: "today", updated_at: "2026-03-01T00:00:00.000Z" }),
        buildSetting({ key: "accent_color", value: "green", updated_at: "2026-01-01T00:00:00.000Z" }),
      ]);

      await settingsRepository.bulkUpsert([
        buildSetting({ key: "default_box", value: "inbox", updated_at: "2026-01-01T00:00:00.000Z" }),
        buildSetting({ key: "accent_color", value: "purple", updated_at: "2026-03-01T00:00:00.000Z" }),
      ]);

      const defaultBox = await db.settings.get("default_box");
      const accentColor = await db.settings.get("accent_color");
      expect(defaultBox?.value).toBe("today");
      expect(accentColor?.value).toBe("purple");
    });

    it("should do nothing when incoming array is empty", async () => {
      await db.settings.add(buildSetting({ key: "default_box", value: "inbox" }));

      await settingsRepository.bulkUpsert([]);

      const settings = await settingsRepository.getAll();
      expect(settings).toHaveLength(1);
    });
  });

  describe("getChangedSince", () => {
    it("should return settings with updated_at after since", async () => {
      const oldSetting = buildSetting({ key: "default_box", updated_at: "2026-01-01T00:00:00.000Z" });
      const newSetting = buildSetting({ key: "accent_color", updated_at: "2026-03-01T00:00:00.000Z" });
      await db.settings.bulkAdd([oldSetting, newSetting]);

      const settings = await settingsRepository.getChangedSince("2026-02-01T00:00:00.000Z");
      expect(settings).toHaveLength(1);
      expect(settings[0].key).toBe(newSetting.key);
    });

    it("should return empty array when no settings are newer than since", async () => {
      await db.settings.add(buildSetting({ updated_at: "2026-01-01T00:00:00.000Z" }));

      const settings = await settingsRepository.getChangedSince("2026-06-01T00:00:00.000Z");
      expect(settings).toEqual([]);
    });

    it("should not include settings with updated_at equal to since", async () => {
      await db.settings.add(buildSetting({ updated_at: "2026-03-01T00:00:00.000Z" }));

      const settings = await settingsRepository.getChangedSince("2026-03-01T00:00:00.000Z");
      expect(settings).toEqual([]);
    });
  });
});
