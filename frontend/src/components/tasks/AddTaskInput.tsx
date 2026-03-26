import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

export interface AddTaskInputProps {
  targetBox: string;
  onAdd: (title: string) => Promise<void>;
  onCancel: () => void;
}

export function AddTaskInput({ targetBox, onAdd, onCancel }: AddTaskInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && inputValue.trim()) {
        await onAdd(inputValue.trim());
        setInputValue("");
      } else if (event.key === "Escape") {
        onCancel();
      }
    },
    [inputValue, onAdd, onCancel],
  );

  return (
    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-accent flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        placeholder={t("task.addPlaceholder", { box: targetBox })}
        className="flex-1 text-sm outline-none placeholder:text-gray-400"
        data-testid="add-task-input"
      />
    </div>
  );
}
