import { useState, useEffect, useCallback } from "react";
import type { Category } from "@/types/entities";
import { CategoryService } from "@/services/CategoryService";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultCategoryService = new CategoryService(new CategoryRepository());

export interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedCategories: Category[]) => Promise<void>;
}

export function useCategories(
  categoryService: CategoryService = defaultCategoryService,
): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { syncVersion, schedulePush } = useSync();

  const loadCategories = useCallback(async () => {
    const allCategories = await categoryService.getAll();
    setCategories(allCategories);
    setIsLoading(false);
  }, [categoryService]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories, syncVersion]);

  const createCategory = useCallback(
    async (name: string) => {
      await categoryService.create(name);
      await loadCategories();
      schedulePush();
    },
    [categoryService, loadCategories, schedulePush],
  );

  const updateCategory = useCallback(
    async (id: string, name: string) => {
      await categoryService.update(id, name);
      await loadCategories();
      schedulePush();
    },
    [categoryService, loadCategories, schedulePush],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await categoryService.softDelete(id);
      await loadCategories();
      schedulePush();
    },
    [categoryService, loadCategories, schedulePush],
  );

  const reorderCategories = useCallback(
    async (orderedCategories: Category[]) => {
      await categoryService.reorderCategories(orderedCategories);
      await loadCategories();
      schedulePush();
    },
    [categoryService, loadCategories, schedulePush],
  );

  return { categories, isLoading, createCategory, updateCategory, deleteCategory, reorderCategories };
}
