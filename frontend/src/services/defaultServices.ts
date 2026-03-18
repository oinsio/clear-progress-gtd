import { TaskService } from "./TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalService } from "./GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";

export const defaultTaskService = new TaskService(new TaskRepository());
export const defaultGoalService = new GoalService(new GoalRepository());
