import { useState, useEffect, useCallback, useRef } from "react";
import { X, Trash2, ChevronRight, ArrowLeft } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import type { Task, Goal, Context, Category, ChecklistItem } from "@/types/entities";
import type { Box, RepeatRule } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { useChecklist } from "@/hooks/useChecklist";
import { useSync } from "@/app/providers/SyncProvider";
import { parseRepeatRule, serializeRepeatRule, formatRepeatRuleLabel } from "@/utils/repeatRule";
import { useChecklistItemEditing } from "@/hooks/useChecklistItemEditing";
import { useTaskEditLabels } from "@/hooks/useTaskEditLabels";
import { useTaskFormState } from "@/hooks/useTaskFormState";
import { RepeatRuleSelector } from "./RepeatRuleSelector";
import {
  ACTIVE_TAB,
  type ActiveTab,
  BOX_OPTIONS,
  BOX_ICONS,
  SELECTOR_TYPE,
  type SelectorType,
  SELECTOR_TITLE_KEYS,
  CHECKLIST_ITEM_VARIANT,
  type ChecklistItemVariant,
} from "./taskEditShared";
import { SortableChecklistItem } from "./SortableChecklistItem";
import * as React from "react";

interface TaskDetailPanelProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}


interface DrillDownRowProps {
  label: string;
  value: string;
  hasValue: boolean;
  onClick: () => void;
}

function DrillDownRow({ label, value, hasValue, onClick }: DrillDownRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
    >
      <span className="text-gray-500 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <span className={cn(hasValue ? "text-gray-800" : "text-gray-400")}>{value}</span>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </button>
  );
}

interface SelectorOption {
  id: string;
  label: string;
}

interface SelectorOptionListProps {
  options: SelectorOption[];
  selectedId: string;
  noSelectionLabel: string;
  onSelect: (id: string) => void;
}

function SelectorOptionList({ options, selectedId, noSelectionLabel, onSelect }: SelectorOptionListProps) {
  return (
    <div className="px-4 py-3 flex flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
          selectedId === ""
            ? "bg-accent/10 text-accent font-medium"
            : "text-gray-500 hover:bg-gray-100",
        )}
      >
        {noSelectionLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={cn(
            "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
            selectedId === option.id
              ? "bg-accent/10 text-accent font-medium"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ChecklistSectionProps {
  title: string;
  items: ChecklistItem[];
  editingItemId: string | null;
  editingItemTitle: string;
  lastSyncedAt: string | null;
  variant: ChecklistItemVariant;
  onDragEnd: (event: DragEndEvent) => void;
  onToggle: (id: string) => void;
  onStartEdit: (item: ChecklistItem) => void;
  onEditChange: (value: string) => void;
  onCommitEdit: (id: string) => void;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, id: string) => void;
  onDelete: (id: string) => void;
  getToggleAriaLabel: (item: ChecklistItem) => string;
  getDeleteAriaLabel: (item: ChecklistItem) => string;
}

function ChecklistSection({
  title,
  items,
  editingItemId,
  editingItemTitle,
  lastSyncedAt,
  variant,
  onDragEnd,
  onToggle,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onEditKeyDown,
  onDelete,
  getToggleAriaLabel,
  getDeleteAriaLabel,
}: ChecklistSectionProps) {
  const sensors = useDndSensors();
  return (
    <div>
      <p className="text-center text-sm font-medium text-accent mb-2">{title}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                editingTitle={editingItemTitle}
                lastSyncedAt={lastSyncedAt}
                variant={variant}
                toggleAriaLabel={getToggleAriaLabel(item)}
                deleteAriaLabel={getDeleteAriaLabel(item)}
                onToggle={() => onToggle(item.id)}
                onStartEdit={() => onStartEdit(item)}
                onEditChange={onEditChange}
                onEditBlur={() => onCommitEdit(item.id)}
                onEditKeyDown={(event) => onEditKeyDown(event, item.id)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export function TaskDetailPanel({
  task,
  goals,
  contexts,
  categories,
  onUpdate,
  onDelete,
  onClose,
  className,
  style,
}: TaskDetailPanelProps) {
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
  const [activeTab, setActiveTab] = useState<ActiveTab>(ACTIVE_TAB.DETAILS);
  const [openSelector, setOpenSelector] = useState<SelectorType | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");

  const { items, progress, createItem: rawCreateItem, toggleItem, deleteItem, updateItem, reorderItems: rawReorderItems } = useChecklist(task.id);
  const {
    editingItemId,
    editingItemTitle,
    setEditingItemTitle,
    handleItemTitleClick,
    commitItemEdit,
    handleItemEditKeyDown,
  } = useChecklistItemEditing(updateItem);
  const { lastSyncedAt } = useSync();

  // Reset state when selected task changes
  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes);
    setSelectedGoalId(task.goal_id);
    setSelectedContextId(task.context_id);
    setSelectedCategoryId(task.category_id);
    setSelectedBox(task.box);
    setSelectedRepeatRule(parseRepeatRule(task.repeat_rule));
    setActiveTab(ACTIVE_TAB.DETAILS);
    setOpenSelector(null);
    setIsConfirmingDelete(false);
    setNewItemTitle("");
  }, [task.id, task.title, task.notes, task.goal_id, task.context_id, task.category_id, task.box, task.repeat_rule]);

  const handleTitleBlur = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== task.title) {
      await onUpdate(task.id, { title: trimmedTitle });
    }
  }, [title, task.title, task.id, onUpdate]);

  const handleNotesBlur = useCallback(async () => {
    if (notes !== task.notes) {
      await onUpdate(task.id, { notes });
    }
  }, [notes, task.notes, task.id, onUpdate]);

  const handleBoxChange = useCallback(async (box: Box) => {
    setSelectedBox(box);
    await onUpdate(task.id, { box });
  }, [task.id, onUpdate]);

  const handleGoalChange = useCallback(async (goalId: string) => {
    setSelectedGoalId(goalId);
    setOpenSelector(null);
    await onUpdate(task.id, { goal_id: goalId });
  }, [task.id, onUpdate]);

  const handleContextChange = useCallback(async (contextId: string) => {
    setSelectedContextId(contextId);
    setOpenSelector(null);
    await onUpdate(task.id, { context_id: contextId });
  }, [task.id, onUpdate]);

  const handleCategoryChange = useCallback(async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setOpenSelector(null);
    await onUpdate(task.id, { category_id: categoryId });
  }, [task.id, onUpdate]);

  const handleRepeatChange = useCallback(async (rule: RepeatRule | null) => {
    setSelectedRepeatRule(rule);
    setOpenSelector(null);
    await onUpdate(task.id, { repeat_rule: rule ? serializeRepeatRule(rule) : "" });
  }, [task.id, onUpdate]);

  const handleDeleteClick = useCallback(() => {
    setIsConfirmingDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(task.id);
  }, [task.id, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  const handleNewItemKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && newItemTitle.trim()) {
        await rawCreateItem(newItemTitle.trim());
        setNewItemTitle("");
      }
    },
    [newItemTitle, rawCreateItem],
  );


  const activeItems = items.filter((item) => !item.is_completed);
  const completedItems = items.filter((item) => item.is_completed);

  const handleSectionDragEnd = useCallback(
    (sectionItems: ChecklistItem[], event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sectionItems.findIndex((item) => item.id === active.id);
      const newIndex = sectionItems.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(sectionItems, oldIndex, newIndex);
      void rawReorderItems(reordered);
    },
    [rawReorderItems],
  );

  const { selectedGoalTitle, selectedContextName, selectedCategoryName, checklistTabLabel } =
    useTaskEditLabels(selectedGoalId, selectedContextId, selectedCategoryId, goals, contexts, categories, progress);

  const newItemInputRef = useRef<HTMLInputElement>(null);

  const goalOptions: SelectorOption[] = goals.map((goal) => ({ id: goal.id, label: goal.title }));
  const contextOptions: SelectorOption[] = contexts.map((context) => ({ id: context.id, label: context.name }));
  const categoryOptions: SelectorOption[] = categories.map((category) => ({ id: category.id, label: category.name }));

  return (
    <div
      data-testid="task-detail-panel"
      className={cn("border-l border-gray-100 flex flex-col h-full bg-white overflow-hidden relative", className)}
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={t("taskDetail.delete")}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("taskDetail.close")}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex px-4 pt-3 pb-1 gap-2 flex-shrink-0">
        <button
          type="button"
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Details tab */}
        {activeTab === ACTIVE_TAB.DETAILS && openSelector === null && (
          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t("taskEdit.fieldTitle")}</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => void handleTitleBlur()}
                placeholder={t("task.titlePlaceholder")}
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
                data-testid="task-detail-title"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t("taskEdit.fieldNotes")}</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => void handleNotesBlur()}
                placeholder={t("taskEdit.notesPlaceholder")}
                rows={4}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
                data-testid="task-detail-notes"
              />
            </div>

            {/* Box selector */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">{t("taskEdit.fieldBox")}</label>
              <div className="flex gap-1">
                {BOX_OPTIONS.map((box) => {
                  const BoxIcon = BOX_ICONS[box];
                  const isBoxSelected = selectedBox === box;
                  return (
                    <button
                      key={box}
                      type="button"
                      aria-label={t(`box.${box}`)}
                      aria-pressed={isBoxSelected}
                      onClick={() => void handleBoxChange(box)}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                        isBoxSelected
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

            {goals.length > 0 && (
              <DrillDownRow
                label={t("selector.goal")}
                value={selectedGoalTitle}
                hasValue={!!selectedGoalId}
                onClick={() => setOpenSelector(SELECTOR_TYPE.GOAL)}
              />
            )}

            {contexts.length > 0 && (
              <DrillDownRow
                label={t("selector.context")}
                value={selectedContextName}
                hasValue={!!selectedContextId}
                onClick={() => setOpenSelector(SELECTOR_TYPE.CONTEXT)}
              />
            )}

            {categories.length > 0 && (
              <DrillDownRow
                label={t("selector.category")}
                value={selectedCategoryName}
                hasValue={!!selectedCategoryId}
                onClick={() => setOpenSelector(SELECTOR_TYPE.CATEGORY)}
              />
            )}

            <DrillDownRow
              label={t("taskEdit.fieldRepeat")}
              value={selectedRepeatRule ? formatRepeatRuleLabel(selectedRepeatRule, t) : t("repeat.none")}
              hasValue={!!selectedRepeatRule}
              onClick={() => setOpenSelector(SELECTOR_TYPE.REPEAT)}
            />
          </div>
        )}

        {/* Selector view — inline within panel */}
        {activeTab === ACTIVE_TAB.DETAILS && openSelector !== null && (
          <div className="flex flex-col h-full">
            {/* Selector header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setOpenSelector(null)}
                aria-label={t("taskEdit.back")}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="text-base font-semibold text-gray-800">
                {t(SELECTOR_TITLE_KEYS[openSelector])}
              </h3>
            </div>

            {/* Selector content */}
            <div className="flex-1 overflow-y-auto">
              {openSelector === SELECTOR_TYPE.REPEAT ? (
                <RepeatRuleSelector
                  value={selectedRepeatRule}
                  onChange={(rule) => void handleRepeatChange(rule)}
                  onBack={() => setOpenSelector(null)}
                />
              ) : (
                <>
                  {openSelector === SELECTOR_TYPE.GOAL && (
                    <SelectorOptionList
                      options={goalOptions}
                      selectedId={selectedGoalId}
                      noSelectionLabel={t("selector.noGoal")}
                      onSelect={(id) => void handleGoalChange(id)}
                    />
                  )}
                  {openSelector === SELECTOR_TYPE.CONTEXT && (
                    <SelectorOptionList
                      options={contextOptions}
                      selectedId={selectedContextId}
                      noSelectionLabel={t("selector.noContext")}
                      onSelect={(id) => void handleContextChange(id)}
                    />
                  )}
                  {openSelector === SELECTOR_TYPE.CATEGORY && (
                    <SelectorOptionList
                      options={categoryOptions}
                      selectedId={selectedCategoryId}
                      noSelectionLabel={t("selector.noCategory")}
                      onSelect={(id) => void handleCategoryChange(id)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Checklist tab */}
        {activeTab === ACTIVE_TAB.CHECKLIST && (
          <div className="px-4 py-4 flex flex-col gap-4">
            <ChecklistSection
              title={t("taskEdit.activeSection", { count: activeItems.length })}
              items={activeItems}
              editingItemId={editingItemId}
              editingItemTitle={editingItemTitle}
              lastSyncedAt={lastSyncedAt}
              variant={CHECKLIST_ITEM_VARIANT.ACTIVE}
              onDragEnd={(event) => handleSectionDragEnd(activeItems, event)}
              onToggle={(id) => void toggleItem(id)}
              onStartEdit={handleItemTitleClick}
              onEditChange={setEditingItemTitle}
              onCommitEdit={(id) => void commitItemEdit(id)}
              onEditKeyDown={(event, id) => void handleItemEditKeyDown(event, id)}
              onDelete={(id) => void deleteItem(id)}
              getToggleAriaLabel={(item) => t("taskEdit.checkItemMark", { title: item.title })}
              getDeleteAriaLabel={(item) => t("taskEdit.checkItemDelete", { title: item.title })}
            />

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
                value={newItemTitle}
                onChange={(event) => setNewItemTitle(event.target.value)}
                onKeyDown={(event) => void handleNewItemKeyDown(event)}
                placeholder={t("taskEdit.newChecklistItemPlaceholder")}
                className="flex-1 text-sm text-gray-400 outline-none placeholder:text-gray-300"
              />
            </div>

            {completedItems.length > 0 && (
              <ChecklistSection
                title={t("taskEdit.doneSection", { count: completedItems.length })}
                items={completedItems}
                editingItemId={editingItemId}
                editingItemTitle={editingItemTitle}
                lastSyncedAt={lastSyncedAt}
                variant={CHECKLIST_ITEM_VARIANT.COMPLETED}
                onDragEnd={(event) => handleSectionDragEnd(completedItems, event)}
                onToggle={(id) => void toggleItem(id)}
                onStartEdit={handleItemTitleClick}
                onEditChange={setEditingItemTitle}
                onCommitEdit={(id) => void commitItemEdit(id)}
                onEditKeyDown={(event, id) => void handleItemEditKeyDown(event, id)}
                onDelete={(id) => void deleteItem(id)}
                getToggleAriaLabel={(item) => t("taskEdit.checkItemUnmark", { title: item.title })}
                getDeleteAriaLabel={(item) => t("taskEdit.checkItemDelete", { title: item.title })}
              />
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-base font-medium text-gray-800 text-center">{t("taskEdit.deleteConfirmTitle")}</p>
          <p className="text-sm text-gray-500 text-center">{task.title}</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={handleDeleteCancel}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("taskEdit.deleteConfirmCancel")}
            </button>
            <button
              type="button"
              data-testid="task-detail-delete-confirm-btn"
              onClick={handleDeleteConfirm}
              className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
            >
              {t("taskEdit.deleteConfirmOk")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
