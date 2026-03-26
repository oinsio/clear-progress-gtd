import { useState, useCallback } from "react";
import * as React from "react";

export function useChecklistItemEditing(
  updateItem: (id: string, title: string) => Promise<void>,
) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");

  const handleItemTitleClick = useCallback((item: { id: string; title: string }) => {
    setEditingItemId(item.id);
    setEditingItemTitle(item.title);
  }, []);

  const commitItemEdit = useCallback(
    async (id: string) => {
      const trimmedTitle = editingItemTitle.trim();
      if (trimmedTitle) {
        await updateItem(id, trimmedTitle);
      }
      setEditingItemId(null);
      setEditingItemTitle("");
    },
    [editingItemTitle, updateItem],
  );

  const handleItemEditKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>, id: string) => {
      if (event.key === "Enter") {
        await commitItemEdit(id);
      }
    },
    [commitItemEdit],
  );

  return {
    editingItemId,
    editingItemTitle,
    setEditingItemTitle,
    handleItemTitleClick,
    commitItemEdit,
    handleItemEditKeyDown,
  };
}
