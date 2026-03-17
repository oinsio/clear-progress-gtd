import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGoal } from "./useGoal";
import type { GoalService } from "@/services/GoalService";
import type { TaskService } from "@/services/TaskService";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

function createMockGoalService(
  overrides: Partial<Record<keyof GoalService, unknown>> = {},
): GoalService {
  return {
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as GoalService;
}

describe("useGoal", () => {
  let mockGoalService: GoalService;
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockGoalService = createMockGoalService();
    mockTaskService = createMockTaskService();
  });

  async function setupHookWithGoal() {
    const goal = buildGoal();
    const mockGetById = vi.fn().mockResolvedValue(goal);
    mockGoalService = createMockGoalService({ getById: mockGetById });
    const { result } = renderHook(() =>
      useGoal(goal.id, mockGoalService, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    return { goal, mockGetById, result };
  }

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() =>
      useGoal("goal-1", mockGoalService, mockTaskService),
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after data is fetched", async () => {
    const { result } = renderHook(() =>
      useGoal("goal-1", mockGoalService, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return undefined goal when not found", async () => {
    const { result } = renderHook(() =>
      useGoal("nonexistent", mockGoalService, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goal).toBeUndefined();
  });

  it("should return goal after loading", async () => {
    const goal = buildGoal();
    mockGoalService = createMockGoalService({
      getById: vi.fn().mockResolvedValue(goal),
    });
    const { result } = renderHook(() =>
      useGoal(goal.id, mockGoalService, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goal).toEqual(goal);
  });

  it("should return tasks linked to the goal", async () => {
    const goal = buildGoal();
    const tasks = [
      buildTask({ goal_id: goal.id }),
      buildTask({ goal_id: goal.id }),
    ];
    mockGoalService = createMockGoalService({
      getById: vi.fn().mockResolvedValue(goal),
    });
    mockTaskService = createMockTaskService({
      getByGoalId: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() =>
      useGoal(goal.id, mockGoalService, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual(tasks);
  });

  it("should call getByGoalId with goal id", async () => {
    const { result } = renderHook(() =>
      useGoal("goal-abc", mockGoalService, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getByGoalId).toHaveBeenCalledWith("goal-abc");
  });

  it("should call update and refresh when updateGoal is called", async () => {
    const { goal, mockGetById, result } = await setupHookWithGoal();

    await act(async () => {
      await result.current.updateGoal({ title: "New title" });
    });

    expect(mockGoalService.update).toHaveBeenCalledWith(goal.id, {
      title: "New title",
    });
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("should call updateStatus and refresh when updateGoalStatus is called", async () => {
    const { goal, result } = await setupHookWithGoal();

    await act(async () => {
      await result.current.updateGoalStatus("completed");
    });

    expect(mockGoalService.updateStatus).toHaveBeenCalledWith(
      goal.id,
      "completed",
    );
  });

  it("should call softDelete when deleteGoal is called", async () => {
    const goal = buildGoal();
    mockGoalService = createMockGoalService({
      getById: vi.fn().mockResolvedValue(goal),
    });
    const { result } = renderHook(() =>
      useGoal(goal.id, mockGoalService, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteGoal();
    });

    expect(mockGoalService.softDelete).toHaveBeenCalledWith(goal.id);
  });
});
