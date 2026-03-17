import { Target } from "lucide-react";
import { GoalStatusBadge } from "./GoalStatusBadge";
import type { Goal } from "@/types/entities";

const TASK_COUNT_LABEL = "Задач:";

interface GoalItemProps {
  goal: Goal;
  taskCount: number;
  onNavigate: (id: string) => void;
}

export function GoalItem({ goal, taskCount, onNavigate }: GoalItemProps) {
  return (
    <li
      data-testid="goal-item"
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
      onClick={() => onNavigate(goal.id)}
    >
      {/* Cover / placeholder */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {goal.cover_file_id ? (
          <img
            src={goal.cover_file_id}
            alt={goal.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Target
            data-testid="goal-cover-placeholder"
            className="w-6 h-6 text-gray-300"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium leading-snug truncate">
          {goal.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {taskCount > 0 && (
            <span
              data-testid="goal-task-count"
              className="text-xs text-gray-400"
            >
              {TASK_COUNT_LABEL} {taskCount}
            </span>
          )}
          <GoalStatusBadge status={goal.status} />
        </div>
      </div>
    </li>
  );
}
