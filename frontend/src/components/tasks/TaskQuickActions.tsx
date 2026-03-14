import { useState, useCallback } from "react";
import { FileText, Target, ArrowRightFromLine, Pencil } from "lucide-react";
import type { Task } from "@/types/entities";
import type { Goal } from "@/types/entities";
import type { Box } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { BOX, BOX_FILTER_LABELS } from "@/constants";
import * as React from "react";

type QuickActionMode = "none" | "notes" | "goal" | "box";

interface TaskQuickActionsProps {
  task: Task;
  goals: Goal[];
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onOpenEdit: () => void;
}

const BOX_OPTIONS: Box[] = [BOX.TODAY, BOX.WEEK, BOX.LATER];

export function TaskQuickActions({
  task,
  goals,
  onUpdate,
  onMove,
  onOpenEdit,
}: TaskQuickActionsProps) {
  const [activeMode, setActiveMode] = useState<QuickActionMode>("none");
  const [notesValue, setNotesValue] = useState(task.notes);

  const handleModeToggle = useCallback((mode: QuickActionMode) => {
    setActiveMode((current) => (current === mode ? "none" : mode));
  }, []);

  const handleNotesToggle = useCallback(() => {
    setNotesValue(task.notes);
    handleModeToggle("notes");
  }, [task.notes, handleModeToggle]);

  const handleNotesSave = useCallback(async () => {
    await onUpdate(task.id, { notes: notesValue });
    setActiveMode("none");
  }, [task.id, notesValue, onUpdate]);

  const handleNotesKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        await handleNotesSave();
      } else if (event.key === "Escape") {
        setActiveMode("none");
      }
    },
    [handleNotesSave],
  );

  const handleGoalSelect = useCallback(
    async (goalId: string) => {
      await onUpdate(task.id, { goal_id: goalId });
      setActiveMode("none");
    },
    [task.id, onUpdate],
  );

  const handleBoxSelect = useCallback(
    async (box: Box) => {
      await onMove(task.id, box);
      setActiveMode("none");
    },
    [task.id, onMove],
  );

  const actionButtonClass = (mode: QuickActionMode) =>
    cn(
      "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
      activeMode === mode
        ? "bg-accent/15 text-accent"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
    );

  return (
    <div data-testid="task-quick-actions" className="border-t border-gray-100 bg-gray-50">
      {/* Action icons row */}
      <div className="flex items-center gap-1 px-3 py-1.5">
        <button
          type="button"
          aria-label="Edit notes"
          aria-pressed={activeMode === "notes"}
          onClick={handleNotesToggle}
          className={actionButtonClass("notes")}
        >
          <FileText size={17} />
        </button>
        <button
          type="button"
          aria-label="Select goal"
          aria-pressed={activeMode === "goal"}
          onClick={() => handleModeToggle("goal")}
          className={actionButtonClass("goal")}
        >
          <Target size={17} />
        </button>
        <button
          type="button"
          aria-label="Move to box"
          aria-pressed={activeMode === "box"}
          onClick={() => handleModeToggle("box")}
          className={actionButtonClass("box")}
        >
          <ArrowRightFromLine size={17} />
        </button>
        <button
          type="button"
          aria-label="Full edit"
          onClick={onOpenEdit}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
            "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
          )}
        >
          <Pencil size={17} />
        </button>
      </div>

      {/* Notes panel */}
      {activeMode === "notes" && (
        <div className="px-3 pb-2">
          <textarea
            data-testid="quick-notes-input"
            value={notesValue}
            onChange={(event) => setNotesValue(event.target.value)}
            onKeyDown={handleNotesKeyDown}
            placeholder="Добавить заметку..."
            rows={3}
            autoFocus
            className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
          />
        </div>
      )}

      {/* Goal picker */}
      {activeMode === "goal" && (
        <div className="px-3 pb-2 flex flex-col gap-0.5 max-h-40 overflow-y-auto">
          <button
            type="button"
            aria-label="Без цели"
            onClick={() => handleGoalSelect("")}
            className={cn(
              "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
              task.goal_id === ""
                ? "bg-accent/10 text-accent font-medium"
                : "text-gray-500 hover:bg-gray-100",
            )}
          >
            Без цели
          </button>
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => handleGoalSelect(goal.id)}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                task.goal_id === goal.id
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {goal.title}
            </button>
          ))}
        </div>
      )}

      {/* Box picker */}
      {activeMode === "box" && (
        <div className="px-3 pb-2 flex gap-2">
          {BOX_OPTIONS.map((box) => (
            <button
              key={box}
              type="button"
              aria-label={BOX_FILTER_LABELS[box]}
              onClick={() => handleBoxSelect(box)}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-lg border transition-colors",
                task.box === box
                  ? "bg-accent text-white border-accent"
                  : "border-gray-200 text-gray-600 hover:border-accent hover:text-accent",
              )}
            >
              {BOX_FILTER_LABELS[box]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
