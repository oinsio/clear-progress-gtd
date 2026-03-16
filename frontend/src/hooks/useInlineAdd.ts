import { useState, useCallback } from "react";
import type * as React from "react";

export function useInlineAdd(onCreate: (name: string) => Promise<unknown>) {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    await onCreate(trimmedValue);
    setValue("");
    setIsAdding(false);
  }, [value, onCreate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") void handleSubmit();
      if (event.key === "Escape") {
        setIsAdding(false);
        setValue("");
      }
    },
    [handleSubmit],
  );

  const handleBlur = useCallback(() => {
    if (!value.trim()) {
      setIsAdding(false);
    }
  }, [value]);

  return { isAdding, setIsAdding, value, setValue, handleKeyDown, handleBlur };
}
