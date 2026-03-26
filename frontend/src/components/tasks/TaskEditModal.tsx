import { useState, useEffect, useCallback, useRef } from "react";
import { useChecklistItemEditing } from "@/hooks/useChecklistItemEditing";
import { useTaskEditLabels } from "@/hooks/useTaskEditLabels";
import { useTaskFormState } from "@/hooks/useTaskFormState";
import { X, ChevronRight, ArrowLeft } from "lucide-react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDndSensors } from "@/hooks/useDndSensors";
import type { ChecklistItem } from "@/types/entities";
import { useTranslation } from "react-i18next";
import type { Task, Goal, Context, Category } from "@/types/entities";
import { cn } from "@/shared/lib/cn";
import { useChecklist } from "@/hooks/useChecklist";
import { useSync } from "@/app/providers/SyncProvider";
import type { ChecklistService } from "@/services/ChecklistService";
import { parseRepeatRule, serializeRepeatRule, formatRepeatRuleLabel } from "@/utils/repeatRule";
import { RepeatRuleSelector } from "./RepeatRuleSelector";
import {
  ACTIVE_TAB,
  type ActiveTab,
  BOX_OPTIONS,
  BOX_ICONS,
  SELECTOR_TYPE,
  type SelectorType,
  SELECTOR_TITLE_KEYS,
  CHECKLIST_ITEM_VARIANT
} from "./taskEditShared";
import { SortableChecklistItem } from "./SortableChecklistItem";
import * as React from "react";

interface TaskEditModalProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => void;
  onChecklistChange?: () => void;
  checklistService?: ChecklistService;
}


export function TaskEditModal({
  task,
  goals,
  contexts,
  categories,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onChecklistChange,
  checklistService,
}: TaskEditModalProps) {
  const { t } = useTranslation();
  const {
    title, setTitle,
    notes, setNotes,
    selectedGoalId, setSelectedGoalId,
    selectedContextId, setSelectedContextId,
    selectedCategoryId, setSelectedCategoryId,
    selectedBox, setSelectedBox,
    selectedRepeatRule, setSelectedRepeatRule,
  } = useTaskFormState(task);
  const [isSaving, setIsSaving] = useState(false);
  const [openSelector, setOpenSelector] = useState<SelectorType | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(ACTIVE_TAB.DETAILS);
  const [newItemTitle, setNewItemTitle] = useState("");
  const newItemInputRef = useRef<HTMLInputElement>(null);

  const { items, progress, createItem: rawCreateItem, toggleItem: rawToggleItem, deleteItem: rawDeleteItem, updateItem: rawUpdateItem, reorderItems: rawReorderItems } = useChecklist(task.id, checklistService);
  const { lastSyncedAt } = useSync();

  const createItem = useCallback(async (title: string) => {
    await rawCreateItem(title);
    onChecklistChange?.();
  }, [rawCreateItem, onChecklistChange]);

  const toggleItem = useCallback(async (id: string) => {
    await rawToggleItem(id);
    onChecklistChange?.();
  }, [rawToggleItem, onChecklistChange]);

  const deleteItem = useCallback(async (id: string) => {
    await rawDeleteItem(id);
    onChecklistChange?.();
  }, [rawDeleteItem, onChecklistChange]);

  const updateItem = useCallback(async (id: string, title: string) => {
    await rawUpdateItem(id, title);
    onChecklistChange?.();
  }, [rawUpdateItem, onChecklistChange]);

  const reorderItems = useCallback(async (reorderedItems: ChecklistItem[]) => {
    await rawReorderItems(reorderedItems);
    onChecklistChange?.();
  }, [rawReorderItems, onChecklistChange]);

  const {
    editingItemId,
    editingItemTitle,
    setEditingItemTitle,
    handleItemTitleClick,
    commitItemEdit,
    handleItemEditKeyDown,
  } = useChecklistItemEditing(updateItem);

  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setNotes(task.notes);
      setSelectedGoalId(task.goal_id);
      setSelectedContextId(task.context_id);
      setSelectedCategoryId(task.category_id);
      setSelectedBox(task.box);
      setSelectedRepeatRule(parseRepeatRule(task.repeat_rule));
      setOpenSelector(null);
      setIsConfirmingDelete(false);
      setActiveTab(ACTIVE_TAB.DETAILS);
      setNewItemTitle("");
    }
  }, [isOpen, task]);

  const handleDeleteClick = useCallback(() => {
    setIsConfirmingDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(task.id);
    onClose();
  }, [task.id, onDelete, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        notes,
        goal_id: selectedGoalId,
        context_id: selectedContextId,
        category_id: selectedCategoryId,
        box: selectedBox,
        repeat_rule: selectedRepeatRule ? serializeRepeatRule(selectedRepeatRule) : "",
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [task.id, title, notes, selectedGoalId, selectedContextId, selectedCategoryId, selectedBox, selectedRepeatRule, onUpdate, onClose]);

  const handleNewItemKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && newItemTitle.trim()) {
        await createItem(newItemTitle.trim());
        setNewItemTitle("");
      }
    },
    [newItemTitle, createItem],
  );


  const dndSensors = useDndSensors();

  const activeItems = items.filter((item) => !item.is_completed);
  const completedItems = items.filter((item) => item.is_completed);

  const handleSectionDragEnd = useCallback(
    (sectionItems: ChecklistItem[], event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sectionItems.findIndex((item) => item.id === active.id);
      const newIndex = sectionItems.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(sectionItems, oldIndex, newIndex);
      void reorderItems(reordered);
    },
    [reorderItems],
  );

  const { selectedGoalTitle, selectedContextName, selectedCategoryName, checklistTabLabel } =
    useTaskEditLabels(selectedGoalId, selectedContextId, selectedCategoryId, goals, contexts, categories, progress);

  if (!isOpen) return null;

  return (
    <div data-testid="task-edit-modal" className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        data-testid="task-edit-modal-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Main bottom sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{t("taskEdit.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("taskEdit.close")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-4 pt-3 pb-1 gap-2">
          <button
            type="button"
            data-testid="task-edit-tab-details"
            onClick={() => setActiveTab(ACTIVE_TAB.DETAILS)}
            className={cn(
              "flex-1 py-1.5 text-sm rounded-full border transition-colors",
              activeTab === ACTIVE_TAB.DETAILS
                ? "bg-accent text-white border-accent"
                : "text-accent border-accent/40 hover:bg-accent/5",
            )}
          >
            {t("taskEdit.tabDetails")}
          </button>
          <button
            type="button"
            data-testid="task-edit-tab-checklist"
            onClick={() => setActiveTab(ACTIVE_TAB.CHECKLIST)}
            className={cn(
              "flex-1 py-1.5 text-sm rounded-full border transition-colors",
              activeTab === ACTIVE_TAB.CHECKLIST
                ? "bg-accent text-white border-accent"
                : "text-accent border-accent/40 hover:bg-accent/5",
            )}
          >
            {checklistTabLabel}
          </button>
        </div>

        {/* Details tab content */}
        {activeTab === ACTIVE_TAB.DETAILS && (
          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t("taskEdit.fieldTitle")}</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("goal.titlePlaceholder")}
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
                data-testid="task-edit-title"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t("taskEdit.fieldNotes")}</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("taskEdit.notesPlaceholder")}
                rows={3}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
                data-testid="task-edit-notes"
              />
            </div>

            {/* Box selector */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">{t("taskEdit.fieldBox")}</label>
              <div className="flex gap-1">
                {BOX_OPTIONS.map((box) => {
                  const BoxIcon = BOX_ICONS[box];
                  const isSelected = selectedBox === box;
                  return (
                    <button
                      key={box}
                      type="button"
                      aria-label={t(`box.${box}`)}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedBox(box)}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                        isSelected
                          ? "text-accent"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      <BoxIcon className="w-7 h-7" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goal drill-down row */}
            {goals.length > 0 && (
              <button
                type="button"
                data-testid="task-edit-goal-row"
                onClick={() => setOpenSelector(SELECTOR_TYPE.GOAL)}
                className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
              >
                <span className="text-gray-500 font-medium">{t("selector.goal")}</span>
                <div className="flex items-center gap-1">
                  <span className={cn(selectedGoalId ? "text-gray-800" : "text-gray-400")}>
                    {selectedGoalTitle}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            )}

            {/* Context drill-down row */}
            {contexts.length > 0 && (
              <button
                type="button"
                data-testid="task-edit-context-row"
                onClick={() => setOpenSelector(SELECTOR_TYPE.CONTEXT)}
                className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
              >
                <span className="text-gray-500 font-medium">{t("selector.context")}</span>
                <div className="flex items-center gap-1">
                  <span className={cn(selectedContextId ? "text-gray-800" : "text-gray-400")}>
                    {selectedContextName}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            )}

            {/* Category drill-down row */}
            {categories.length > 0 && (
              <button
                type="button"
                data-testid="task-edit-category-row"
                onClick={() => setOpenSelector(SELECTOR_TYPE.CATEGORY)}
                className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
              >
                <span className="text-gray-500 font-medium">{t("selector.category")}</span>
                <div className="flex items-center gap-1">
                  <span className={cn(selectedCategoryId ? "text-gray-800" : "text-gray-400")}>
                    {selectedCategoryName}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            )}

            {/* Repeat drill-down row */}
            <button
              type="button"
              data-testid="task-edit-repeat-row"
              onClick={() => setOpenSelector(SELECTOR_TYPE.REPEAT)}
              className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
            >
              <span className="text-gray-500 font-medium">{t("taskEdit.fieldRepeat")}</span>
              <div className="flex items-center gap-1">
                <span className={cn(selectedRepeatRule ? "text-gray-800" : "text-gray-400")}>
                  {selectedRepeatRule ? formatRepeatRuleLabel(selectedRepeatRule, t) : t("repeat.none")}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>
          </div>
        )}

        {/* Checklist tab content */}
        {activeTab === ACTIVE_TAB.CHECKLIST && (
          <div data-testid="task-edit-checklist-panel" className="px-4 py-4 flex flex-col gap-4">
            {/* Active items section */}
            <div data-testid="task-edit-checklist-active-section">
              <p className="text-center text-sm font-medium text-accent mb-2">
                {t("taskEdit.activeSection", { count: activeItems.length })}
              </p>
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleSectionDragEnd(activeItems, event)}
              >
                <SortableContext
                  items={activeItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-1">
                    {activeItems.map((item) => (
                      <SortableChecklistItem
                        key={item.id}
                        item={item}
                        isEditing={editingItemId === item.id}
                        editingTitle={editingItemTitle}
                        lastSyncedAt={lastSyncedAt}
                        variant={CHECKLIST_ITEM_VARIANT.ACTIVE}
                        toggleAriaLabel={t("taskEdit.checkItemMark", { title: item.title })}
                        deleteAriaLabel={t("taskEdit.checkItemDelete", { title: item.title })}
                        onToggle={() => void toggleItem(item.id)}
                        onStartEdit={() => handleItemTitleClick(item)}
                        onEditChange={setEditingItemTitle}
                        onEditBlur={() => void commitItemEdit(item.id)}
                        onEditKeyDown={(event) => void handleItemEditKeyDown(event, item.id)}
                        onDelete={() => void deleteItem(item.id)}
                      />
                    ))}
                    {/* New item input */}
                    <div className="flex items-center gap-3 py-1.5">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="w-3.5 h-5 flex-shrink-0" />
                        <span className="w-0.5 h-5" />
                        <div className="w-5 h-5 rounded border-2 border-gray-200 flex-shrink-0" />
                      </div>
                      <input
                        ref={newItemInputRef}
                        type="text"
                        data-testid="task-edit-checklist-new-item-input"
                        value={newItemTitle}
                        onChange={(event) => setNewItemTitle(event.target.value)}
                        onKeyDown={(event) => void handleNewItemKeyDown(event)}
                        placeholder={t("taskEdit.newChecklistItemPlaceholder")}
                        className="flex-1 text-sm text-gray-400 outline-none placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Done items section */}
            {completedItems.length > 0 && (
              <div data-testid="task-edit-checklist-done-section">
                <p className="text-center text-sm font-medium text-accent mb-2">
                  {t("taskEdit.doneSection", { count: completedItems.length })}
                </p>
                <DndContext
                  sensors={dndSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleSectionDragEnd(completedItems, event)}
                >
                  <SortableContext
                    items={completedItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-1">
                      {completedItems.map((item) => (
                        <SortableChecklistItem
                          key={item.id}
                          item={item}
                          isEditing={editingItemId === item.id}
                          editingTitle={editingItemTitle}
                          lastSyncedAt={lastSyncedAt}
                          variant={CHECKLIST_ITEM_VARIANT.COMPLETED}
                          toggleAriaLabel={t("taskEdit.checkItemUnmark", { title: item.title })}
                          deleteAriaLabel={t("taskEdit.checkItemDelete", { title: item.title })}
                          onToggle={() => void toggleItem(item.id)}
                          onStartEdit={() => handleItemTitleClick(item)}
                          onEditChange={setEditingItemTitle}
                          onEditBlur={() => void commitItemEdit(item.id)}
                          onEditKeyDown={(event) => void handleItemEditKeyDown(event, item.id)}
                          onDelete={() => void deleteItem(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex gap-2 px-4 pb-6 pt-2">
          <button
            type="button"
            data-testid="task-edit-delete-btn"
            onClick={handleDeleteClick}
            aria-label={t("taskEdit.deleteLabel")}
            className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            {t("taskEdit.delete")}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("taskEdit.cancelLabel")}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t("taskEdit.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            aria-label={t("taskEdit.saveLabel")}
            disabled={!title.trim() || isSaving}
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t("taskEdit.save")}
          </button>
        </div>

        {/* Delete confirmation overlay */}
        {isConfirmingDelete && (
          <div
            data-testid="task-edit-delete-confirm"
            className="absolute inset-0 bg-white/95 rounded-t-2xl flex flex-col items-center justify-center gap-4 px-6"
          >
            <p className="text-base font-medium text-gray-800 text-center">{t("taskEdit.deleteConfirmTitle")}</p>
            <p className="text-sm text-gray-500 text-center">{task.title}</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                data-testid="task-edit-delete-cancel"
                onClick={handleDeleteCancel}
                aria-label={t("taskEdit.deleteConfirmCancel")}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t("taskEdit.deleteConfirmCancel")}
              </button>
              <button
                type="button"
                data-testid="task-edit-delete-confirm-btn"
                onClick={handleDeleteConfirm}
                aria-label={t("taskEdit.deleteConfirmOk")}
                className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                {t("taskEdit.deleteConfirmOk")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selector sheet — overlays the main bottom sheet */}
      {openSelector !== null && (
        <div
          data-testid="task-edit-selector-sheet"
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        >
          {openSelector === SELECTOR_TYPE.REPEAT ? (
            <RepeatRuleSelector
              value={selectedRepeatRule}
              onChange={(rule) => {
                setSelectedRepeatRule(rule);
                setOpenSelector(null);
              }}
              onBack={() => setOpenSelector(null)}
            />
          ) : (
            <>
          {/* Selector header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setOpenSelector(null)}
              aria-label={t("taskEdit.back")}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-gray-800">
              {t(SELECTOR_TITLE_KEYS[openSelector])}
            </h2>
          </div>

          {/* Selector list */}
          <div className="px-4 py-3 flex flex-col gap-1">
            {openSelector === SELECTOR_TYPE.GOAL && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGoalId("");
                    setOpenSelector(null);
                  }}
                  className={cn(
                    "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                    selectedGoalId === ""
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {t("selector.noGoal")}
                </button>
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setOpenSelector(null);
                    }}
                    className={cn(
                      "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      selectedGoalId === goal.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {goal.title}
                  </button>
                ))}
              </>
            )}

            {openSelector === SELECTOR_TYPE.CONTEXT && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContextId("");
                    setOpenSelector(null);
                  }}
                  className={cn(
                    "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                    selectedContextId === ""
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {t("selector.noContext")}
                </button>
                {contexts.map((context) => (
                  <button
                    key={context.id}
                    type="button"
                    onClick={() => {
                      setSelectedContextId(context.id);
                      setOpenSelector(null);
                    }}
                    className={cn(
                      "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      selectedContextId === context.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {context.name}
                  </button>
                ))}
              </>
            )}

            {openSelector === SELECTOR_TYPE.CATEGORY && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("");
                    setOpenSelector(null);
                  }}
                  className={cn(
                    "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                    selectedCategoryId === ""
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {t("selector.noCategory")}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setOpenSelector(null);
                    }}
                    className={cn(
                      "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      selectedCategoryId === category.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
