import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";

const GOAL_STATUS_CLASSES: Record<GoalStatus, string> = {
  planning: "text-blue-500",
  in_progress: "text-gray-400",
  paused: "text-orange-500",
  completed: "text-green-600",
  cancelled: "text-red-500",
} as const;

interface GoalStatusBadgeProps {
  status: GoalStatus;
}

export function GoalStatusBadge({ status }: GoalStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      data-testid="goal-status-badge"
      className={cn("text-xs font-medium", GOAL_STATUS_CLASSES[status])}
    >
      {t(`goal.status.${status}`)}
    </span>
  );
}
