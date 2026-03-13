import { useState, useCallback } from "react";
import type { Task } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

const defaultTaskService = new TaskService(new TaskRepository());

export interface UseSearchReturn {
  results: Task[];
  isSearching: boolean;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useSearch(
  taskService: TaskService = defaultTaskService,
): UseSearchReturn {
  const [results, setResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!query) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      const foundTasks = await taskService.searchByTitle(query);
      setResults(foundTasks);
      setIsSearching(false);
    },
    [taskService],
  );

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, isSearching, search, clear };
}
