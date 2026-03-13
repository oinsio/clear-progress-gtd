import type { Goal } from "@/types/entities";
import { db } from "../database";

export class GoalRepository {
  async getAll(): Promise<Goal[]> {
    return db.goals.toArray();
  }

  async getActive(): Promise<Goal[]> {
    return db.goals.filter((goal) => !goal.is_deleted).toArray();
  }

  async getById(id: string): Promise<Goal | undefined> {
    return db.goals.get(id);
  }

  async create(goal: Goal): Promise<void> {
    await db.goals.add(goal);
  }

  async update(goal: Goal): Promise<void> {
    await db.goals.put(goal);
  }

  async bulkUpsert(goals: Goal[]): Promise<void> {
    await db.goals.bulkPut(goals);
  }

  async getMaxVersion(): Promise<number> {
    const goals = await db.goals
      .orderBy("version")
      .reverse()
      .limit(1)
      .toArray();
    return goals[0]?.version ?? 0;
  }
}
