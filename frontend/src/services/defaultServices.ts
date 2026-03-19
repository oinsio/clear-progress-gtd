import { TaskService } from "./TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalService } from "./GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { CoverService } from "./CoverService";
import { CoverRepository } from "@/db/repositories/CoverRepository";
import { ApiClient } from "./ApiClient";

export const defaultTaskService = new TaskService(new TaskRepository());
export const defaultGoalService = new GoalService(new GoalRepository());
export const defaultCoverService = new CoverService(new ApiClient(), new CoverRepository());
