import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCategories } from "./useCategories";
import type { CategoryService } from "@/services/CategoryService";
import { buildCategory } from "@/test/factories/categoryFactory";

function createMockCategoryService(
  overrides: Partial<Record<keyof CategoryService, unknown>> = {},
): CategoryService {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as CategoryService;
}

describe("useCategories", () => {
  let mockCategoryService: CategoryService;

  beforeEach(() => {
    mockCategoryService = createMockCategoryService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useCategories(mockCategoryService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after categories are fetched", async () => {
    const { result } = renderHook(() => useCategories(mockCategoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no categories exist", async () => {
    const { result } = renderHook(() => useCategories(mockCategoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual([]);
  });

  it("should return categories after loading", async () => {
    const categories = [buildCategory(), buildCategory()];
    mockCategoryService = createMockCategoryService({
      getAll: vi.fn().mockResolvedValue(categories),
    });
    const { result } = renderHook(() => useCategories(mockCategoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual(categories);
  });

  it("should call create and refresh when createCategory is called", async () => {
    const mockGetAll = vi.fn().mockResolvedValue([]);
    mockCategoryService = createMockCategoryService({ getAll: mockGetAll });
    const { result } = renderHook(() => useCategories(mockCategoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createCategory("Work");
    });

    expect(mockCategoryService.create).toHaveBeenCalledWith("Work");
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it("should call update and refresh when updateCategory is called", async () => {
    const category = buildCategory();
    const mockGetAll = vi.fn().mockResolvedValue([category]);
    mockCategoryService = createMockCategoryService({ getAll: mockGetAll });
    const { result } = renderHook(() => useCategories(mockCategoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateCategory(category.id, "Family");
    });

    expect(mockCategoryService.update).toHaveBeenCalledWith(
      category.id,
      "Family",
    );
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it("should call softDelete and refresh when deleteCategory is called", async () => {
    const category = buildCategory();
    const mockGetAll = vi.fn().mockResolvedValue([]);
    mockCategoryService = createMockCategoryService({ getAll: mockGetAll });
    const { result } = renderHook(() => useCategories(mockCategoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteCategory(category.id);
    });

    expect(mockCategoryService.softDelete).toHaveBeenCalledWith(category.id);
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });
});
