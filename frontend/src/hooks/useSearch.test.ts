import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSearch } from "./useSearch";
import type { TaskService } from "@/services/TaskService";
import type { GoalService } from "@/services/GoalService";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import { createMockGoalService } from "@/test/mocks/goalServiceMock";

describe("useSearch", () => {
  let mockTaskService: TaskService;
  let mockGoalService: GoalService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
    mockGoalService = createMockGoalService();
  });

  it("should return empty tasks on initial render", () => {
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));
    expect(result.current.tasks).toEqual([]);
  });

  it("should return empty goals on initial render", () => {
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));
    expect(result.current.goals).toEqual([]);
  });

  it("should not be searching on initial render", () => {
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));
    expect(result.current.isSearching).toBe(false);
  });

  it("should return matching tasks when search is called with a query", async () => {
    const tasks = [buildTask({ title: "Buy groceries" })];
    mockTaskService = createMockTaskService({
      searchByTitle: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
  });

  it("should return matching goals when search is called with a query", async () => {
    const goals = [buildGoal({ title: "Learn piano" })];
    mockGoalService = createMockGoalService({
      searchByTitle: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("piano");
    });

    expect(result.current.goals).toEqual(goals);
  });

  it("should search tasks and goals simultaneously", async () => {
    const tasks = [buildTask({ title: "Buy groceries" })];
    const goals = [buildGoal({ title: "Buy a house" })];
    mockTaskService = createMockTaskService({
      searchByTitle: vi.fn().mockResolvedValue(tasks),
    });
    mockGoalService = createMockGoalService({
      searchByTitle: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
    expect(result.current.goals).toEqual(goals);
  });

  it("should call taskService.searchByTitle with the query", async () => {
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mockTaskService.searchByTitle).toHaveBeenCalledWith("meeting");
  });

  it("should call goalService.searchByTitle with the query", async () => {
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mockGoalService.searchByTitle).toHaveBeenCalledWith("meeting");
  });

  it("should return empty tasks and goals when query is empty string", async () => {
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("");
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
    expect(mockTaskService.searchByTitle).not.toHaveBeenCalled();
    expect(mockGoalService.searchByTitle).not.toHaveBeenCalled();
  });

  it("should set isSearching to false after search completes", async () => {
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.isSearching).toBe(false);
  });

  it("should clear tasks and goals when clear is called", async () => {
    const tasks = [buildTask()];
    const goals = [buildGoal()];
    mockTaskService = createMockTaskService({
      searchByTitle: vi.fn().mockResolvedValue(tasks),
    });
    mockGoalService = createMockGoalService({
      searchByTitle: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("task");
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.goals).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
  });

  it("should set isSearching to false and clear results when search throws", async () => {
    mockGoalService = createMockGoalService({
      searchByTitle: vi.fn().mockRejectedValue(new Error("Search failed")),
    });
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
  });

  it("should update results on subsequent searches", async () => {
    const firstTasks = [buildTask({ title: "First task" })];
    const secondTasks = [buildTask({ title: "Second task A" }), buildTask({ title: "Second task B" })];
    const mockSearchByTitle = vi
      .fn()
      .mockResolvedValueOnce(firstTasks)
      .mockResolvedValueOnce(secondTasks);
    mockTaskService = createMockTaskService({
      searchByTitle: mockSearchByTitle,
    });
    const { result } = renderHook(() => useSearch(mockTaskService, mockGoalService));

    await act(async () => {
      await result.current.search("first");
    });
    expect(result.current.tasks).toEqual(firstTasks);

    await act(async () => {
      await result.current.search("second");
    });
    expect(result.current.tasks).toEqual(secondTasks);
  });
});
