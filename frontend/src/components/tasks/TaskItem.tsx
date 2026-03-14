import type { Task } from "@/types/entities";
import { cn } from "@/shared/lib/cn";

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onComplete, onDelete }: TaskItemProps) {
  return (
    <div
      data-testid="task-item"
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
    >
      <button
        type="button"
        aria-label={task.is_completed ? "Noncomplete task" : "Complete task"}
        onClick={() => onComplete(task.id)}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors",
          task.is_completed
            ? "bg-accent border-accent"
            : "border-gray-300 hover:border-accent",
        )}
      />
      <span
        data-testid="task-item-title"
        className={cn(
          "flex-1 text-sm",
          task.is_completed && "line-through text-gray-400",
        )}
      >
        {task.title}
      </span>
      <button
        type="button"
        aria-label="Delete task"
        onClick={() => onDelete(task.id)}
        className="text-gray-400 hover:text-red-500 transition-colors p-1"
      >
        ×
      </button>
    </div>
  );
}
