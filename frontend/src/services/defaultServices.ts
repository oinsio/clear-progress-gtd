import { TaskService } from "./TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

export const defaultTaskService = new TaskService(new TaskRepository());
