import { useState, useCallback } from "react";
import { X, CircleMinus, Pause, Square, Play, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";

const GOAL_TITLE_PLACEHOLDER = "Название цели";
const GOAL_DESCRIPTION_PLACEHOLDER = "Добавить описание";
const SHEET_TITLE = "Новая цель";
const CANCEL_LABEL = "Отмена";
const CREATE_LABEL = "Создать";
const CLOSE_LABEL = "Закрыть";
const TITLE_FIELD_LABEL = "Название";
const DESCRIPTION_FIELD_LABEL = "Описание";
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
    <div data-testid="goal-create-sheet" className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        data-testid="goal-create-sheet-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{SHEET_TITLE}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={CLOSE_LABEL}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label
              htmlFor="goal-create-title"
              className="text-xs font-medium text-gray-500 mb-1 block"
            >
              {TITLE_FIELD_LABEL}
            </label>
            <input
              id="goal-create-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={GOAL_TITLE_PLACEHOLDER}
              autoFocus
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              data-testid="goal-create-title-input"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="goal-create-description"
              className="text-xs font-medium text-gray-500 mb-1 block"
            >
              {DESCRIPTION_FIELD_LABEL}
            </label>
            <textarea
              id="goal-create-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={GOAL_DESCRIPTION_PLACEHOLDER}
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              data-testid="goal-create-description-input"
            />
          </div>

          {/* Status segmented control */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Статус</label>
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

        {/* Footer */}
        <div className="flex gap-3 px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={CANCEL_LABEL}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {CANCEL_LABEL}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            aria-label={CREATE_LABEL}
            data-testid="goal-create-save-button"
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {CREATE_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
