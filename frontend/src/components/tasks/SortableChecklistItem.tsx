import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/lib/cn";
import type { ChecklistItem } from "@/types/entities";
import { CHECKLIST_ITEM_VARIANT, type ChecklistItemVariant } from "./taskEditShared";
import * as React from "react";

export interface SortableChecklistItemProps {
  item: ChecklistItem;
  isEditing: boolean;
  editingTitle: string;
  lastSyncedAt: string | null;
  variant: ChecklistItemVariant;
  toggleAriaLabel: string;
  deleteAriaLabel: string;
  onToggle: () => void;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onEditBlur: () => void;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}

export function SortableChecklistItem({
  item,
  isEditing,
  editingTitle,
  lastSyncedAt,
  variant,
  toggleAriaLabel,
  deleteAriaLabel,
  onToggle,
  onStartEdit,
  onEditChange,
  onEditBlur,
  onEditKeyDown,
  onDelete,
}: SortableChecklistItemProps) {
  const isCompleted = variant === CHECKLIST_ITEM_VARIANT.COMPLETED;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={dragStyle} className="flex items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isEditing ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
            aria-label="drag"
          >
            <GripVertical size={14} />
          </button>
        ) : (
          <span className="w-3.5 h-5 flex-shrink-0" />
        )}
        <span
          className={cn(
            "w-0.5 h-5 rounded-sm transition-colors",
            lastSyncedAt === null || item.updated_at > lastSyncedAt
              ? "bg-amber-400"
              : "bg-transparent",
          )}
        />
        <button
          type="button"
          data-testid={`checklist-item-checkbox-${item.id}`}
          aria-label={toggleAriaLabel}
          onClick={onToggle}
          className={
            isCompleted
              ? "w-5 h-5 rounded border-2 border-accent bg-accent flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
              : "w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 flex items-center justify-center hover:border-accent transition-colors"
          }
        >
          {isCompleted && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      {isEditing ? (
        <input
          type="text"
          data-testid={`checklist-item-edit-input-${item.id}`}
          value={editingTitle}
          onChange={(event) => onEditChange(event.target.value)}
          onBlur={onEditBlur}
          onKeyDown={onEditKeyDown}
          autoFocus
          className={cn(
            "flex-1 text-sm outline-none",
            isCompleted ? "text-gray-400 line-through" : "text-gray-800",
          )}
        />
      ) : (
        <span
          data-testid={`checklist-item-title-${item.id}`}
          onClick={onStartEdit}
          className={cn(
            "flex-1 text-sm cursor-text",
            isCompleted ? "text-gray-400 line-through" : "text-gray-800",
          )}
        >
          {item.title}
        </span>
      )}
      {isEditing && (
        <button
          type="button"
          data-testid={`checklist-item-delete-btn-${item.id}`}
          aria-label={deleteAriaLabel}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onDelete}
          className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M5 4V2.5A.5.5 0 0 1 5.5 2h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9.5A.5.5 0 0 0 4.5 14h7a.5.5 0 0 0 .5-.5L13 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
