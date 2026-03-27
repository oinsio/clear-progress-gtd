import { TaskService } from "./TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { GoalService } from "./GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { CoverService } from "./CoverService";
import { CoverRepository } from "@/db/repositories/CoverRepository";
import { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { CoverSyncService } from "./CoverSyncService";
import { ApiClient } from "./ApiClient";

export const defaultApiClient = new ApiClient();

export const defaultTaskService = new TaskService(new TaskRepository(), new ChecklistRepository());
export const defaultGoalService = new GoalService(new GoalRepository());
export const defaultCoverService = new CoverService(
  new ApiClient(),
  new CoverRepository(),
  new PendingCoverRepository(),
);
export const defaultCoverSyncService = new CoverSyncService(
  new ApiClient(),
  new PendingCoverRepository(),
  new CoverRepository(),
  new GoalRepository(),
);
