import { useState, useCallback } from "react";
import { CircleMinus, Pause, Square, Play, Check, Image } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";

const GOAL_TITLE_PLACEHOLDER = "Название цели";
const GOAL_DESCRIPTION_PLACEHOLDER = "Добавить описание";
const SHEET_TITLE = "Новая цель";
const CANCEL_LABEL = "Отмена";
const CREATE_LABEL = "Создать";
const DEFAULT_GOAL_STATUS: GoalStatus = "planning";

interface GoalStatusOption {
  status: GoalStatus;
  icon: LucideIcon;
  label: string;
}

const STATUS_OPTIONS: GoalStatusOption[] = [
  { status: "cancelled", icon: CircleMinus, label: "Отменена" },
  { status: "paused", icon: Pause, label: "На паузе" },
  { status: "planning", icon: Square, label: "Планирую" },
  { status: "in_progress", icon: Play, label: "В процессе" },
  { status: "completed", icon: Check, label: "Завершена" },
];

export interface GoalCreateData {
  title: string;
  description: string;
  status: GoalStatus;
}

interface GoalCreateSheetProps {
  onSave: (data: GoalCreateData) => Promise<void>;
  onClose: () => void;
}

export function GoalCreateSheet({ onSave, onClose }: GoalCreateSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<GoalStatus>(DEFAULT_GOAL_STATUS);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setIsSaving(true);
    try {
      await onSave({ title: trimmedTitle, description: description.trim(), status });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [title, description, status, onSave, onClose]);

  const canSave = title.trim().length > 0 && !isSaving;

  return (
    <div data-testid="goal-create-sheet" className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Navigation bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button
          type="button"
          onClick={onClose}
          aria-label={CANCEL_LABEL}
          className="text-sm text-accent"
        >
          {CANCEL_LABEL}
        </button>
        <h1 className="text-base font-semibold text-gray-800">{SHEET_TITLE}</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          aria-label={CREATE_LABEL}
          data-testid="goal-create-save-button"
          className="text-sm text-accent font-semibold disabled:opacity-40"
        >
          {CREATE_LABEL}
        </button>
      </header>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover + Title row */}
        <div className="flex items-center gap-4 px-4 pt-5 pb-4 bg-white">
          <button
            type="button"
            aria-label="Выбрать обложку"
            className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden"
          >
            <Image className="w-7 h-7 text-gray-300" aria-hidden="true" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={GOAL_TITLE_PLACEHOLDER}
            autoFocus
            className="flex-1 text-base text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            data-testid="goal-create-title-input"
          />
        </div>

        {/* Description */}
        <div className="px-4 pt-3 pb-4 bg-white border-t border-gray-100">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={GOAL_DESCRIPTION_PLACEHOLDER}
            rows={2}
            className="w-full text-base text-gray-600 bg-transparent outline-none placeholder:text-gray-400 resize-none"
            data-testid="goal-create-description-input"
          />
        </div>

        {/* Status segmented control */}
        <div className="mx-4 mt-4">
          <div className="flex rounded-full border border-accent overflow-hidden">
            {STATUS_OPTIONS.map(({ status: optionStatus, icon: Icon, label }) => {
              const isSelected = status === optionStatus;
              return (
                <button
                  key={optionStatus}
                  type="button"
                  aria-label={label}
                  aria-pressed={isSelected}
                  onClick={() => setStatus(optionStatus)}
                  className={cn(
                    "flex-1 flex items-center justify-center py-3 transition-colors",
                    isSelected ? "bg-accent text-white" : "text-accent bg-white hover:bg-accent/10",
                  )}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
