import type { Category } from "@/types/entities";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async getAll(): Promise<Category[]> {
    const categories = await this.categoryRepository.getActive();
    return categories.sort(
      (categoryA, categoryB) => categoryA.sort_order - categoryB.sort_order,
    );
  }

  async getById(id: string): Promise<Category | undefined> {
    return this.categoryRepository.getById(id);
  }

  async create(name: string): Promise<Category> {
    const now = new Date().toISOString();
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      sort_order: 0,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
    };
    await this.categoryRepository.create(category);
    return category;
  }

  async update(id: string, name: string): Promise<Category> {
    return this.applyChanges(id, { name });
  }

  async softDelete(id: string): Promise<Category> {
    return this.applyChanges(id, { is_deleted: true });
  }

  async reorderCategories(orderedCategories: Category[]): Promise<void> {
    if (orderedCategories.length === 0) return;
    const now = new Date().toISOString();
    const updated = orderedCategories.map((category, index) => ({
      ...category,
      sort_order: index,
      updated_at: now,
      version: category.version + 1,
    }));
    await this.categoryRepository.bulkUpsert(updated);
  }

  private async applyChanges(
    id: string,
    changes: Partial<Category>,
  ): Promise<Category> {
    const existingCategory = await this.categoryRepository.getById(id);
    if (!existingCategory) {
      throw new Error(`Category not found: ${id}`);
    }
    const updatedCategory: Category = {
      ...existingCategory,
      ...changes,
      id,
      updated_at: new Date().toISOString(),
      version: existingCategory.version + 1,
    };
    await this.categoryRepository.update(updatedCategory);
    return updatedCategory;
  }
}
