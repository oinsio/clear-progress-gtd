import type { Category } from "@/types/entities";
import { db } from "../database";

export class CategoryRepository {
  async getAll(): Promise<Category[]> {
    return db.categories.toArray();
  }

  async getActive(): Promise<Category[]> {
    return db.categories.filter((category) => !category.is_deleted).toArray();
  }

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id);
  }

  async create(category: Category): Promise<void> {
    await db.categories.add(category);
  }

  async update(category: Category): Promise<void> {
    await db.categories.put(category);
  }

  async bulkUpsert(categories: Category[]): Promise<void> {
    await db.categories.bulkPut(categories);
  }

  async getMaxVersion(): Promise<number> {
    const categories = await db.categories
      .orderBy("version")
      .reverse()
      .limit(1)
      .toArray();
    return categories[0]?.version ?? 0;
  }
}
