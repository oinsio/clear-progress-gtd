import type { ChecklistItem } from "@/types/entities";
import { db } from "../database";

export class ChecklistRepository {
  async getAll(): Promise<ChecklistItem[]> {
    return db.checklist_items.toArray();
  }

  async getByTaskId(taskId: string): Promise<ChecklistItem[]> {
    return db.checklist_items
      .where("task_id")
      .equals(taskId)
      .filter((item) => !item.is_deleted)
      .toArray();
  }

  async getById(id: string): Promise<ChecklistItem | undefined> {
    return db.checklist_items.get(id);
  }

  async create(item: ChecklistItem): Promise<void> {
    await db.checklist_items.add(item);
  }

  async update(item: ChecklistItem): Promise<void> {
    await db.checklist_items.put(item);
  }

  async bulkUpsert(items: ChecklistItem[]): Promise<void> {
    await db.checklist_items.bulkPut(items);
  }

  async getMaxVersion(): Promise<number> {
    const items = await db.checklist_items
      .orderBy("version")
      .reverse()
      .limit(1)
      .toArray();
    return items[0]?.version ?? 0;
  }
}
