import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTaskMutations } from "./useTaskMutations";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

const mockSchedulePush = vi.fn();

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: mockSchedulePush,
  }),
}));

describe("useTaskMutations", () => {
  let mockTaskService: TaskService;
  let onReload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
    onReload = vi.fn().mockResolvedValue(undefined);
    mockSchedulePush.mockClear();
  });

  describe("completeTask", () => {
    it("should call complete and reload when task is not completed", async () => {
      const task = buildTask({ is_completed: false });
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.completeTask(task.id);
      });

      expect(mockTaskService.complete).toHaveBeenCalledWith(task.id);
      expect(onReload).toHaveBeenCalledOnce();
    });

    it("should call noncomplete and reload when task is already completed", async () => {
      const task = buildTask({ is_completed: true });
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.completeTask(task.id);
      });

      expect(mockTaskService.noncomplete).toHaveBeenCalledWith(task.id);
      expect(onReload).toHaveBeenCalledOnce();
    });

    it("should not call complete or noncomplete when task is not found", async () => {
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(undefined),
      });
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.completeTask("nonexistent-id");
      });

      expect(mockTaskService.complete).not.toHaveBeenCalled();
      expect(mockTaskService.noncomplete).not.toHaveBeenCalled();
    });

    it("should not call reload when task is not found", async () => {
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(undefined),
      });
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.completeTask("nonexistent-id");
      });

      expect(onReload).not.toHaveBeenCalled();
    });

    it("should call getById with the task id", async () => {
      const task = buildTask({ is_completed: false });
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.completeTask(task.id);
      });

      expect(mockTaskService.getById).toHaveBeenCalledWith(task.id);
    });

    it("should call schedulePush after completing a task", async () => {
      const task = buildTask({ is_completed: false });
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.completeTask(task.id);
      });

      expect(mockSchedulePush).toHaveBeenCalledOnce();
    });

    it("should not call schedulePush when task is not found", async () => {
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(undefined),
      });
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.completeTask("nonexistent-id");
      });

      expect(mockSchedulePush).not.toHaveBeenCalled();
    });
  });

  describe("updateTask", () => {
    it("should call update with the id and changes", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.updateTask("task-1", { title: "New title" });
      });

      expect(mockTaskService.update).toHaveBeenCalledWith("task-1", { title: "New title" });
    });

    it("should call reload after update", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.updateTask("task-1", { notes: "new notes" });
      });

      expect(onReload).toHaveBeenCalledOnce();
    });

    it("should call schedulePush after updating a task", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.updateTask("task-1", { title: "New title" });
      });

      expect(mockSchedulePush).toHaveBeenCalledOnce();
    });
  });

  describe("moveTask", () => {
    it("should call moveToBox with the id and target box", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.moveTask("task-1", BOX.TODAY);
      });

      expect(mockTaskService.moveToBox).toHaveBeenCalledWith("task-1", BOX.TODAY);
    });

    it("should call reload after moveTask", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.moveTask("task-1", BOX.WEEK);
      });

      expect(onReload).toHaveBeenCalledOnce();
    });

    it.each([BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER])("should move to %s box correctly", async (box) => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.moveTask("task-1", box);
      });

      expect(mockTaskService.moveToBox).toHaveBeenCalledWith("task-1", box);
    });

    it("should call schedulePush after moving a task", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.moveTask("task-1", BOX.TODAY);
      });

      expect(mockSchedulePush).toHaveBeenCalledOnce();
    });
  });

  describe("deleteTask", () => {
    it("should call softDelete with the task id", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.deleteTask("task-1");
      });

      expect(mockTaskService.softDelete).toHaveBeenCalledWith("task-1");
    });

    it("should call reload after deleteTask", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.deleteTask("task-1");
      });

      expect(onReload).toHaveBeenCalledOnce();
    });

    it("should call schedulePush after deleting a task", async () => {
      const { result } = renderHook(() => useTaskMutations(mockTaskService, onReload));

      await act(async () => {
        await result.current.deleteTask("task-1");
      });

      expect(mockSchedulePush).toHaveBeenCalledOnce();
    });
  });

  describe("callback updates when dependencies change", () => {
    it("should call updated onReload in completeTask after onReload changes", async () => {
      const task = buildTask({ is_completed: false });
      mockTaskService = createMockTaskService({
        getById: vi.fn().mockResolvedValue(task),
      });
      const firstOnReload = vi.fn().mockResolvedValue(undefined);
      const secondOnReload = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ reload }: { reload: () => Promise<void> }) => useTaskMutations(mockTaskService, reload),
        { initialProps: { reload: firstOnReload } },
      );

      rerender({ reload: secondOnReload });

      await act(async () => {
        await result.current.completeTask(task.id);
      });

      expect(secondOnReload).toHaveBeenCalledOnce();
      expect(firstOnReload).not.toHaveBeenCalled();
    });

    it("should call updated onReload in updateTask after onReload changes", async () => {
      const firstOnReload = vi.fn().mockResolvedValue(undefined);
      const secondOnReload = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ reload }: { reload: () => Promise<void> }) => useTaskMutations(mockTaskService, reload),
        { initialProps: { reload: firstOnReload } },
      );

      rerender({ reload: secondOnReload });

      await act(async () => {
        await result.current.updateTask("task-1", { title: "Updated" });
      });

      expect(secondOnReload).toHaveBeenCalledOnce();
      expect(firstOnReload).not.toHaveBeenCalled();
    });

    it("should call updated onReload in moveTask after onReload changes", async () => {
      const firstOnReload = vi.fn().mockResolvedValue(undefined);
      const secondOnReload = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ reload }: { reload: () => Promise<void> }) => useTaskMutations(mockTaskService, reload),
        { initialProps: { reload: firstOnReload } },
      );

      rerender({ reload: secondOnReload });

      await act(async () => {
        await result.current.moveTask("task-1", BOX.TODAY);
      });

      expect(secondOnReload).toHaveBeenCalledOnce();
      expect(firstOnReload).not.toHaveBeenCalled();
    });

    it("should call updated onReload in deleteTask after onReload changes", async () => {
      const firstOnReload = vi.fn().mockResolvedValue(undefined);
      const secondOnReload = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ reload }: { reload: () => Promise<void> }) => useTaskMutations(mockTaskService, reload),
        { initialProps: { reload: firstOnReload } },
      );

      rerender({ reload: secondOnReload });

      await act(async () => {
        await result.current.deleteTask("task-1");
      });

      expect(secondOnReload).toHaveBeenCalledOnce();
      expect(firstOnReload).not.toHaveBeenCalled();
    });
  });
});
