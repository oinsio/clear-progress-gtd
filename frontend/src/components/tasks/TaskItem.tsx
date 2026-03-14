import type { Task } from "@/types/entities";
import { cn } from "@/shared/lib/cn";
import { formatCompletedAt } from "@/shared/lib/utils";

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskItem({ task, onComplete }: TaskItemProps) {
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
          "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors self-start mt-0.5",
          task.is_completed
            ? "bg-accent border-accent"
            : "border-gray-300 hover:border-accent",
        )}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span
          data-testid="task-item-title"
          className={cn(
            "text-sm",
            task.is_completed && "line-through text-gray-400",
          )}
        >
          {task.title}
        </span>
        {task.is_completed && task.completed_at && (
          <span
            data-testid="task-item-completed-at"
            className="text-xs text-accent mt-0.5"
          >
            {formatCompletedAt(task.completed_at)}
          </span>
        )}
      </div>
    </div>
  );
}
