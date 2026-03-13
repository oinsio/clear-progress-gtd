import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSearch } from "./useSearch";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";

function createMockTaskService(
  overrides: Partial<Record<keyof TaskService, unknown>> = {},
): TaskService {
  return {
    searchByTitle: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as TaskService;
}

describe("useSearch", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should return empty results on initial render", () => {
    const { result } = renderHook(() => useSearch(mockTaskService));
    expect(result.current.results).toEqual([]);
  });

  it("should not be searching on initial render", () => {
    const { result } = renderHook(() => useSearch(mockTaskService));
    expect(result.current.isSearching).toBe(false);
  });

  it("should return results when search is called with a query", async () => {
    const tasks = [buildTask({ title: "Buy groceries" })];
    mockTaskService = createMockTaskService({
      searchByTitle: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() => useSearch(mockTaskService));

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.results).toEqual(tasks);
  });

  it("should call searchByTitle with the query", async () => {
    const { result } = renderHook(() => useSearch(mockTaskService));

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mockTaskService.searchByTitle).toHaveBeenCalledWith("meeting");
  });

  it("should return empty results when query is empty string", async () => {
    const { result } = renderHook(() => useSearch(mockTaskService));

    await act(async () => {
      await result.current.search("");
    });

    expect(result.current.results).toEqual([]);
    expect(mockTaskService.searchByTitle).not.toHaveBeenCalled();
  });

  it("should set isSearching to false after search completes", async () => {
    const { result } = renderHook(() => useSearch(mockTaskService));

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.isSearching).toBe(false);
  });

  it("should clear results when clear is called", async () => {
    const tasks = [buildTask()];
    mockTaskService = createMockTaskService({
      searchByTitle: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() => useSearch(mockTaskService));

    await act(async () => {
      await result.current.search("task");
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.results).toEqual([]);
  });

  it("should update results on subsequent searches", async () => {
    const firstResults = [buildTask({ title: "First" })];
    const secondResults = [
      buildTask({ title: "Second A" }),
      buildTask({ title: "Second B" }),
    ];
    const mockSearchByTitle = vi
      .fn()
      .mockResolvedValueOnce(firstResults)
      .mockResolvedValueOnce(secondResults);
    mockTaskService = createMockTaskService({
      searchByTitle: mockSearchByTitle,
    });
    const { result } = renderHook(() => useSearch(mockTaskService));

    await act(async () => {
      await result.current.search("first");
    });
    expect(result.current.results).toEqual(firstResults);

    await act(async () => {
      await result.current.search("second");
    });
    expect(result.current.results).toEqual(secondResults);
  });
});
