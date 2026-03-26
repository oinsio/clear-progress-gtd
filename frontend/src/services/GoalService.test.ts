import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoalService } from "./GoalService";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import { buildGoal } from "@/test/factories/goalFactory";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";

describe("GoalService", () => {
  let mockGoalRepository: GoalRepository;

  beforeEach(() => {
    mockGoalRepository = createMockGoalRepository();
  });

  describe("searchByTitle", () => {
    it("should return empty array when no goals match", async () => {
      const goals = [buildGoal({ title: "Learn piano" })];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("nonexistent");
      expect(results).toEqual([]);
    });

    it("should return matching goals case-insensitively", async () => {
      const goals = [
        buildGoal({ title: "Learn piano" }),
        buildGoal({ title: "Read books" }),
        buildGoal({ title: "Learn Spanish" }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("learn");
      expect(results).toHaveLength(2);
    });

    it("should match partial title", async () => {
      const goal = buildGoal({ title: "My important goal" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([goal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("import");
      expect(results).toEqual([goal]);
    });

    it("should call getActive on repository", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await goalService.searchByTitle("query");
      expect(mockGoalRepository.getActive).toHaveBeenCalled();
    });

    it("should return empty array when repository returns no goals", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("anything");
      expect(results).toEqual([]);
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const goal = buildGoal({ is_deleted: true });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const restored = await goalService.restore(goal.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should increment version on restore", async () => {
      const goal = buildGoal({ is_deleted: true, version: 3 });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const restored = await goalService.restore(goal.id);
      expect(restored.version).toBe(4);
    });

    it("should throw when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await expect(goalService.restore("nonexistent-id")).rejects.toThrow(
        "Goal not found: nonexistent-id",
      );
    });
  });
});
