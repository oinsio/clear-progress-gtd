import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Не начата",
  in_progress: "В процессе",
  paused: "На паузе",
  completed: "Завершена",
  cancelled: "Отменена",
} as const;

const GOAL_STATUS_CLASSES: Record<GoalStatus, string> = {
  not_started: "text-gray-400",
  in_progress: "text-blue-500",
  paused: "text-orange-500",
  completed: "text-green-600",
  cancelled: "text-red-500",
} as const;

interface GoalStatusBadgeProps {
  status: GoalStatus;
}

export function GoalStatusBadge({ status }: GoalStatusBadgeProps) {
  return (
    <span
      data-testid="goal-status-badge"
      className={cn("text-xs font-medium", GOAL_STATUS_CLASSES[status])}
    >
      {GOAL_STATUS_LABELS[status]}
    </span>
  );
}
