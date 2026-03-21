import { useState, useCallback, useEffect } from "react";
import { MapPin, Plus, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { useContexts } from "@/hooks/useContexts";
import { useTasks } from "@/hooks/useTasks";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useInlineAdd } from "@/hooks/useInlineAdd";
import { BOX, ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Context } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

const defaultTaskService = new TaskService(new TaskRepository());

function SortableContextItem({
  context,
  taskCount,
  onNavigate,
}: {
  context: Context;
  taskCount: number;
  onNavigate: (id: string) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: context.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center border-b border-gray-100 bg-white"
    >
      <button
        type="button"
        onClick={() => onNavigate(context.id)}
        className="flex-1 text-left px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-800 text-sm">{context.name}</span>
        {taskCount > 0 && (
          <span className="block text-xs text-gray-400 mt-0.5">
            {t("context.taskCount")} {taskCount}
          </span>
        )}
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("context.drag")}
        className="flex-shrink-0 px-3 py-3 text-gray-300 hover:text-gray-400 touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function ContextsPage() {
  const { t } = useTranslation();
  const { contexts, isLoading, createContext, reorderContexts } = useContexts();
  const { createTask } = useTasks(BOX.INBOX);
  const { panelSide } = usePanelSide();
  const navigate = useNavigate();

  const sensors = useDndSensors();

  const [contextTaskCounts, setContextTaskCounts] = useState<Record<string, number>>({});
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();

  const {
    isAdding: isAddingContext,
    setIsAdding: setIsAddingContext,
    value: newContextName,
    setValue: setNewContextName,
    handleKeyDown: handleAddContextKeyDown,
    handleBlur: handleAddContextBlur,
  } = useInlineAdd(createContext);

  const {
    isAdding: isAddingTask,
    setIsAdding: setIsAddingTask,
    value: newTaskTitle,
    setValue: setNewTaskTitle,
    handleKeyDown: handleAddTaskKeyDown,
    handleBlur: handleAddTaskBlur,
  } = useInlineAdd(createTask);

  const activeContexts = contexts.filter((context) => !context.is_deleted);

  useEffect(() => {
    void defaultTaskService.getContextTaskCounts().then(setContextTaskCounts);
  }, []);

  const handlePanelToggle = togglePanelOpen;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeContexts.findIndex((c) => c.id === active.id);
      const newIndex = activeContexts.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(activeContexts, oldIndex, newIndex);
      void reorderContexts(reordered);
    },
    [activeContexts, reorderContexts],
  );

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "categories") navigate(ROUTES.CATEGORIES);
      else if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  return (
    <div data-testid="contexts-page" className="relative flex h-screen overflow-hidden bg-white">
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-accent">{t("filter.contexts")}</h1>
        </header>

        {/* Scrollable context list */}
        <main className="flex-1 overflow-y-auto">
          {!isLoading && activeContexts.length === 0 && !isAddingContext ? (
            <div className="flex flex-col items-center py-3" data-testid="empty-contexts-message">
              <p className="text-gray-400 text-sm">{t("context.empty")}</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeContexts.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul>
                  {activeContexts.map((context) => (
                    <SortableContextItem
                      key={context.id}
                      context={context}
                      taskCount={contextTaskCounts[context.id] ?? 0}
                      onNavigate={(id) => navigate(`/contexts/${id}`)}
                    />
                  ))}

                  {/* Inline add context input */}
                  {isAddingContext && (
                    <li className="px-4 py-3 border-b border-gray-100">
                      <input
                        type="text"
                        autoFocus
                        value={newContextName}
                        onChange={(event) => setNewContextName(event.target.value)}
                        onKeyDown={handleAddContextKeyDown}
                        onBlur={handleAddContextBlur}
                        placeholder={t("context.namePlaceholder")}
                        className="w-full text-sm outline-none placeholder:text-gray-400"
                        data-testid="add-context-input"
                      />
                    </li>
                  )}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {/* Inline add task input */}
          {isAddingTask && (
            <div className="px-4 py-3 border-b border-gray-100">
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                onKeyDown={handleAddTaskKeyDown}
                onBlur={handleAddTaskBlur}
                placeholder={t("context.taskPlaceholder")}
                className="w-full text-sm outline-none placeholder:text-gray-400"
                data-testid="add-task-input"
              />
            </div>
          )}
        </main>

        {/* Bottom action bar */}
        <div
          className={cn(
            "flex items-center border-t border-gray-200 bg-white px-3 py-2",
            panelSide === "left" && "flex-row-reverse",
          )}
        >
          {/* Add context button */}
          <button
            type="button"
            aria-label={t("context.add")}
            data-testid="add-context-button"
            onClick={() => setIsAddingContext(true)}
            className="relative flex items-center justify-center w-10 h-10 rounded-full text-accent hover:bg-accent/10 active:bg-accent/20 transition-colors"
          >
            <MapPin className="w-5 h-5" aria-hidden="true" />
            <Plus
              className="w-3 h-3 absolute bottom-1 right-1"
              aria-hidden="true"
            />
          </button>

          {/* Add task button */}
          <button
            type="button"
            aria-label={t("context.addTask")}
            data-testid="add-task-button"
            onClick={() => setIsAddingTask(true)}
            className="ml-auto flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Right filter panel */}
      <RightFilterPanel
        mode="contexts"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
