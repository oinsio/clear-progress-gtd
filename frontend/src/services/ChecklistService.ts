import type { ChecklistItem } from "@/types/entities";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";

export interface ChecklistProgress {
  completed: number;
  total: number;
}

export class ChecklistService {
  constructor(
    private readonly checklistRepository: ChecklistRepository,
  ) {}

  async getByTaskId(taskId: string): Promise<ChecklistItem[]> {
    const items = await this.checklistRepository.getByTaskId(taskId);
    return items.sort(
      (itemA, itemB) => itemA.sort_order - itemB.sort_order,
    );
  }

  async getById(id: string): Promise<ChecklistItem | undefined> {
    return this.checklistRepository.getById(id);
  }

  async create(taskId: string, title: string): Promise<ChecklistItem> {
    const existingItems = await this.checklistRepository.getByTaskId(taskId);
    const now = new Date().toISOString();
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      task_id: taskId,
      title,
      is_completed: false,
      sort_order: existingItems.length,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
    };
    await this.checklistRepository.create(item);
    return item;
  }

  async update(
    id: string,
    changes: Partial<ChecklistItem>,
  ): Promise<ChecklistItem> {
    return this.applyChanges(id, changes);
  }

  async toggle(id: string): Promise<ChecklistItem> {
    const existingItem = await this.checklistRepository.getById(id);
    if (!existingItem) {
      throw new Error(`ChecklistItem not found: ${id}`);
    }
    return this.applyChanges(id, { is_completed: !existingItem.is_completed });
  }

  async softDelete(id: string): Promise<ChecklistItem> {
    return this.applyChanges(id, { is_deleted: true });
  }

  async reorderItems(items: ChecklistItem[]): Promise<void> {
    if (items.length === 0) return;
    const now = new Date().toISOString();
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index,
      version: item.version + 1,
      updated_at: now,
    }));
    await this.checklistRepository.bulkUpsert(updatedItems);
  }

  async getProgress(taskId: string): Promise<ChecklistProgress> {
    const items = await this.checklistRepository.getByTaskId(taskId);
    return {
      completed: items.filter((item) => item.is_completed).length,
      total: items.length,
    };
  }

  private async applyChanges(
    id: string,
    changes: Partial<ChecklistItem>,
  ): Promise<ChecklistItem> {
    const existingItem = await this.checklistRepository.getById(id);
    if (!existingItem) {
      throw new Error(`ChecklistItem not found: ${id}`);
    }
    const updatedItem: ChecklistItem = {
      ...existingItem,
      ...changes,
      id,
      updated_at: new Date().toISOString(),
      version: existingItem.version + 1,
    };
    await this.checklistRepository.update(updatedItem);
    return updatedItem;
  }
}
