import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import type { Task } from "@/types/entities";
import type { Goal } from "@/types/entities";
import type { Box } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { formatCompletedAt } from "@/shared/lib/utils";
import { TaskQuickActions } from "./TaskQuickActions";
import { TaskEditModal } from "./TaskEditModal";

interface TaskItemProps {
  task: Task;
  goals: Goal[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
}

export function TaskItem({ task, goals, onComplete, onUpdate, onMove }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleBodyClick = useCallback(() => {
    setIsExpanded((previous) => !previous);
  }, []);

  const handleOpenEdit = useCallback(() => {
    setIsEditModalOpen(true);
    setIsExpanded(false);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  return (
    <>
      <div data-testid="task-item" className="border-b border-gray-100">
        {/* Main task row */}
        <div className="flex items-center gap-3 px-4 py-3">
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
          <button
            type="button"
            data-testid="task-item-body"
            onClick={handleBodyClick}
            className="flex flex-col flex-1 min-w-0 text-left"
          >
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
            {task.notes && !task.is_completed && (
              <FileText size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Quick actions panel */}
        {isExpanded && (
          <TaskQuickActions
            task={task}
            goals={goals}
            onUpdate={onUpdate}
            onMove={onMove}
            onOpenEdit={handleOpenEdit}
          />
        )}
      </div>

      {/* Full edit modal */}
      <TaskEditModal
        task={task}
        goals={goals}
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        onUpdate={onUpdate}
      />
    </>
  );
}
