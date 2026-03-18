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
});
