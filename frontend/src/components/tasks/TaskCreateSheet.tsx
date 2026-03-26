import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/shared/lib/cn";
import { BOX, BOX_FILTER_LABELS } from "@/constants";
import type { Box } from "@/types/common";
import { InboxBoxIcon, TodayBoxIcon, WeekBoxIcon, LaterBoxIcon } from "@/components/tasks/BoxIcons";
import { useSettings } from "@/hooks/useSettings";

const BOX_OPTIONS: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];
const BOX_PICKER_ICONS: Partial<Record<Box, React.FC<{ className?: string }>>> = {
  [BOX.INBOX]: InboxBoxIcon,
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

interface TaskCreateSheetProps {
  entityLabel: string;
  entityName: string;
  entityIcon: React.ComponentType<{ className?: string }>;
  onSave: (title: string, box: Box, notes: string) => Promise<void>;
  onClose: () => void;
}

export function TaskCreateSheet({
  entityLabel,
  entityName,
  entityIcon: EntityIcon,
  onSave,
  onClose,
}: TaskCreateSheetProps) {
  const { t } = useTranslation();
  const { defaultBox } = useSettings();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBox, setSelectedBox] = useState<Box>(() => defaultBox);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setIsSaving(true);
    try {
      await onSave(trimmedTitle, selectedBox, notes);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [title, notes, selectedBox, onSave, onClose]);

  return (
    <div data-testid="task-create-sheet" className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{t("task.newTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("taskEdit.close")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t("taskEdit.fieldTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("task.titlePlaceholder")}
              autoFocus
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              data-testid="task-create-title-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{entityLabel}</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
              <EntityIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-accent font-medium">{entityName}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t("taskEdit.fieldNotes")}</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("taskEdit.notesPlaceholder")}
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              data-testid="task-create-notes-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">{t("taskEdit.fieldBox")}</label>
            <div className="flex gap-1">
              {BOX_OPTIONS.map((box) => {
                const BoxIcon = BOX_PICKER_ICONS[box];
                const isSelected = selectedBox === box;
                return (
                  <button
                    key={box}
                    type="button"
                    aria-label={BOX_FILTER_LABELS[box]}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedBox(box)}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      isSelected
                        ? "text-accent"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    {BoxIcon && <BoxIcon className="w-7 h-7" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("task.cancel")}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t("task.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            aria-label={t("task.createLabel")}
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t("task.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
