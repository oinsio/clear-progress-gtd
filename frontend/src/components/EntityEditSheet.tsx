import { useState, useCallback } from "react";
import { X } from "lucide-react";

interface EntityEditSheetProps {
  title: string;
  initialName: string;
  namePlaceholder: string;
  deleteLabel: string;
  onSave: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
  testId?: string;
  nameInputTestId?: string;
}

export function EntityEditSheet({
  title,
  initialName,
  namePlaceholder,
  deleteLabel,
  onSave,
  onDelete,
  onClose,
  testId,
  nameInputTestId,
}: EntityEditSheetProps) {
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setIsSaving(true);
    try {
      await onSave(trimmedName);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [name, onSave, onClose]);

  const handleDeleteClick = useCallback(() => {
    setIsConfirmingDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  return (
    <div data-testid={testId} className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Название</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={namePlaceholder}
              autoFocus
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              data-testid={nameInputTestId}
            />
          </div>
        </div>
        <div className="flex gap-3 px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label={deleteLabel}
            className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            Удалить
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Отмена"
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            aria-label="Сохранить"
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>

        {/* Delete confirmation overlay */}
        {isConfirmingDelete && (
          <div
            data-testid="entity-edit-delete-confirm"
            className="absolute inset-0 bg-white/95 rounded-t-2xl flex flex-col items-center justify-center gap-4 px-6"
          >
            <p className="text-base font-medium text-gray-800 text-center">{deleteLabel}?</p>
            <p className="text-sm text-gray-500 text-center">{name}</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                data-testid="entity-edit-delete-cancel"
                onClick={handleDeleteCancel}
                aria-label="Отмена"
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                data-testid="entity-edit-delete-confirm-btn"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                aria-label="Удалить"
                className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
