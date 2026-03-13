import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryService } from "./CategoryService";
import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { buildCategory } from "@/test/factories/categoryFactory";

function createMockCategoryRepository(
  overrides: Partial<Record<keyof CategoryRepository, unknown>> = {},
): CategoryRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getActive: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    getMaxVersion: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as CategoryRepository;
}

describe("CategoryService", () => {
  let mockCategoryRepository: CategoryRepository;

  beforeEach(() => {
    mockCategoryRepository = createMockCategoryRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no categories exist", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const categories = await categoryService.getAll();
      expect(categories).toEqual([]);
    });

    it("should return active categories sorted by sort_order ascending", async () => {
      const unsortedCategories = [
        buildCategory({ sort_order: 3 }),
        buildCategory({ sort_order: 1 }),
        buildCategory({ sort_order: 2 }),
      ];
      mockCategoryRepository = createMockCategoryRepository({
        getActive: vi.fn().mockResolvedValue(unsortedCategories),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const result = await categoryService.getAll();
      expect(result[0].sort_order).toBe(1);
      expect(result[1].sort_order).toBe(2);
      expect(result[2].sort_order).toBe(3);
    });

    it("should call getActive on repository", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.getAll();
      expect(mockCategoryRepository.getActive).toHaveBeenCalledOnce();
    });
  });

  describe("getById", () => {
    it("should return category when found", async () => {
      const category = buildCategory();
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const result = await categoryService.getById(category.id);
      expect(result).toEqual(category);
    });

    it("should return undefined when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const result = await categoryService.getById("nonexistent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should create category with given name", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const category = await categoryService.create("Work");
      expect(category.name).toBe("Work");
    });

    it("should create category with sort_order 0", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const category = await categoryService.create("Work");
      expect(category.sort_order).toBe(0);
    });

    it("should create category with is_deleted false", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const category = await categoryService.create("Work");
      expect(category.is_deleted).toBe(false);
    });

    it("should create category with version 1", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const category = await categoryService.create("Work");
      expect(category.version).toBe(1);
    });

    it("should create category with a UUID id", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const category = await categoryService.create("Work");
      expect(category.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should call repository.create with the constructed category", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const category = await categoryService.create("Family");
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(category);
    });

    it("should return the created category", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const category = await categoryService.create("Family");
      expect(category.name).toBe("Family");
    });
  });

  describe("update", () => {
    it("should update the name of the category", async () => {
      const category = buildCategory({ name: "Work" });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "Career");
      expect(updated.name).toBe("Career");
    });

    it("should increment version on update", async () => {
      const category = buildCategory({ version: 3 });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "New Name");
      expect(updated.version).toBe(4);
    });

    it("should update updated_at timestamp on update", async () => {
      const category = buildCategory({
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "New Name");
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await expect(
        categoryService.update("nonexistent-id", "Name"),
      ).rejects.toThrow("Category not found: nonexistent-id");
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const category = buildCategory({ is_deleted: false });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const deleted = await categoryService.softDelete(category.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should increment version on soft delete", async () => {
      const category = buildCategory({ version: 2 });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const deleted = await categoryService.softDelete(category.id);
      expect(deleted.version).toBe(3);
    });

    it("should throw when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await expect(
        categoryService.softDelete("nonexistent-id"),
      ).rejects.toThrow("Category not found: nonexistent-id");
    });
  });
});
