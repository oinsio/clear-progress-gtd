import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGoals } from "./useGoals";
import type { GoalService } from "@/services/GoalService";
import { buildGoal } from "@/test/factories/goalFactory";

const syncState = { version: 0 };

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: syncState.version,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
  }),
}));

function createMockGoalService(
  overrides: Partial<Record<keyof GoalService, unknown>> = {},
): GoalService {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as GoalService;
}

describe("useGoals", () => {
  let mockGoalService: GoalService;

  beforeEach(() => {
    mockGoalService = createMockGoalService();
    syncState.version = 0;
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useGoals(mockGoalService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after goals are fetched", async () => {
    const { result } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no goals exist", async () => {
    const { result } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goals).toEqual([]);
  });

  it("should return goals after loading", async () => {
    const goals = [buildGoal(), buildGoal()];
    mockGoalService = createMockGoalService({
      getAll: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goals).toEqual(goals);
  });

  it("should call createGoal and refresh when createGoal is called", async () => {
    const newGoal = buildGoal({ title: "New goal" });
    const mockGetAll = vi.fn().mockResolvedValue([newGoal]);
    mockGoalService = createMockGoalService({ getAll: mockGetAll });
    const { result } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createGoal({ title: "New goal" });
    });

    expect(mockGoalService.create).toHaveBeenCalledWith({ title: "New goal" });
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it("should call update and refresh when updateGoal is called", async () => {
    const goal = buildGoal();
    const mockGetAll = vi.fn().mockResolvedValue([goal]);
    mockGoalService = createMockGoalService({ getAll: mockGetAll });
    const { result } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateGoal(goal.id, { title: "Updated" });
    });

    expect(mockGoalService.update).toHaveBeenCalledWith(goal.id, {
      title: "Updated",
    });
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it("should call updateStatus and refresh when updateGoalStatus is called", async () => {
    const goal = buildGoal();
    const mockGetAll = vi.fn().mockResolvedValue([goal]);
    mockGoalService = createMockGoalService({ getAll: mockGetAll });
    const { result } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateGoalStatus(goal.id, "in_progress");
    });

    expect(mockGoalService.updateStatus).toHaveBeenCalledWith(
      goal.id,
      "in_progress",
    );
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it("should reload when syncVersion changes", async () => {
    const mockGetAll = vi.fn().mockResolvedValue([]);
    mockGoalService = createMockGoalService({ getAll: mockGetAll });

    const { rerender } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(1));

    syncState.version = 1;
    rerender();

    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(2));
  });

  it("should call softDelete and refresh when deleteGoal is called", async () => {
    const goal = buildGoal();
    const mockGetAll = vi.fn().mockResolvedValue([]);
    mockGoalService = createMockGoalService({ getAll: mockGetAll });
    const { result } = renderHook(() => useGoals(mockGoalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteGoal(goal.id);
    });

    expect(mockGoalService.softDelete).toHaveBeenCalledWith(goal.id);
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });
});
