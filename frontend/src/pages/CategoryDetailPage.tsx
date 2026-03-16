import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, X, Trash2, Plus } from "lucide-react";
import { useCategoryTasks } from "@/hooks/useCategoryTasks";
import { useCategories } from "@/hooks/useCategories";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { usePanelSide } from "@/hooks/usePanelSide";
import { TaskList } from "@/components/tasks/TaskList";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { cn } from "@/shared/lib/cn";
import { BOX, BOX_FILTER_LABELS, ROUTES } from "@/constants";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TodayBoxIcon, WeekBoxIcon, LaterBoxIcon } from "@/components/tasks/BoxIcons";
import * as React from "react";

const NO_TASKS_MESSAGE = "Задач нет. Нажмите сюда, чтобы добавить.";
const ADD_TASK_TITLE_PLACEHOLDER = "Название задачи...";
const CATEGORY_NOT_FOUND_MESSAGE = "Категория не найдена";

const BOX_SECTION_ORDER: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];

const BOX_SECTION_LABELS: Record<Box, string> = {
  [BOX.INBOX]: BOX_FILTER_LABELS.inbox,
  [BOX.TODAY]: BOX_FILTER_LABELS.today,
  [BOX.WEEK]: BOX_FILTER_LABELS.week,
  [BOX.LATER]: BOX_FILTER_LABELS.later,
};

const BOX_SECTION_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }) => <Tag className={className} />,
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

// ── Category edit bottom sheet ────────────────────────────────────────────────

interface CategoryEditSheetProps {
  categoryName: string;
  onSave: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

function CategoryEditSheet({ categoryName, onSave, onDelete, onClose }: CategoryEditSheetProps) {
  const [name, setName] = useState(categoryName);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete]);

  return (
    <div data-testid="category-edit-sheet" className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Редактировать категорию</h2>
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
              placeholder="Название категории"
              autoFocus
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              data-testid="category-edit-name-input"
            />
          </div>
        </div>
        <div className="flex gap-3 px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Удалить категорию"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
}

// ── Task create bottom sheet ──────────────────────────────────────────────────

interface TaskCreateSheetProps {
  categoryName: string;
  onSave: (title: string, box: Box, notes: string) => Promise<void>;
  onClose: () => void;
}

function TaskCreateSheet({ categoryName, onSave, onClose }: TaskCreateSheetProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBox, setSelectedBox] = useState<Box>(BOX.TODAY);
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

  const BOX_OPTIONS: Box[] = [BOX.TODAY, BOX.WEEK, BOX.LATER];

  return (
    <div data-testid="task-create-sheet" className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Новая задача</h2>
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
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={ADD_TASK_TITLE_PLACEHOLDER}
              autoFocus
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              data-testid="task-create-title-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Категория</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
              <Tag className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-accent font-medium">{categoryName}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Заметки</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Добавить заметку..."
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              data-testid="task-create-notes-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Коробочка</label>
            <div className="flex gap-1">
              {BOX_OPTIONS.map((box) => {
                const BoxIcon = BOX_SECTION_ICONS[box];
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
                    <BoxIcon className="w-7 h-7" />
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
            aria-label="Отмена"
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            aria-label="Создать задачу"
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { categories, updateCategory, deleteCategory } = useCategories();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { panelSide } = usePanelSide();
  const { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask } =
    useCategoryTasks(id ?? "");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isCreateTaskSheetOpen, setIsCreateTaskSheetOpen] = useState(false);

  const category = useMemo(
    () => categories.find((c) => c.id === id && !c.is_deleted),
    [categories, id],
  );

  const tasksByBox = useMemo(() => {
    const grouped: Record<Box, Task[]> = {
      [BOX.INBOX]: [],
      [BOX.TODAY]: [],
      [BOX.WEEK]: [],
      [BOX.LATER]: [],
    };
    for (const task of tasks) {
      grouped[task.box].push(task);
    }
    return grouped;
  }, [tasks]);

  const handleSaveCategory = useCallback(
    async (name: string) => {
      if (!id) return;
      await updateCategory(id, name);
    },
    [id, updateCategory],
  );

  const handleDeleteCategory = useCallback(async () => {
    if (!id) return;
    await deleteCategory(id);
    navigate(ROUTES.CATEGORIES);
  }, [id, deleteCategory, navigate]);

  const handleCreateTask = useCallback(
    async (title: string, box: Box, notes: string) => {
      await createTask(title, box, notes);
    },
    [createTask],
  );

  const handlePanelToggle = useCallback(() => {
    setIsPanelOpen((previous) => !previous);
  }, []);

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "goals") navigate(ROUTES.GOALS);
      else if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") navigate(ROUTES.INBOX);
    },
    [navigate],
  );

  if (!isLoading && !category) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{CATEGORY_NOT_FOUND_MESSAGE}</p>
      </div>
    );
  }

  const hasAnyTasks = tasks.length > 0;

  return (
    <div data-testid="category-detail-page" className="flex h-screen overflow-hidden bg-white">
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          aria-label="Назад"
          onClick={() => navigate(ROUTES.CATEGORIES)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-accent">Категория</h1>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        {/* Category card */}
        {category && (
          <button
            type="button"
            data-testid="category-card"
            onClick={() => setIsEditSheetOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-accent" />
            </div>
            <span className="text-gray-800 font-medium">{category.name}</span>
          </button>
        )}

        {/* Task content */}
        {!isLoading && !hasAnyTasks ? (
          <button
            type="button"
            data-testid="no-tasks-add-prompt"
            onClick={() => setIsCreateTaskSheetOpen(true)}
            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-accent hover:bg-gray-50 transition-colors"
          >
            {NO_TASKS_MESSAGE}
          </button>
        ) : (
          BOX_SECTION_ORDER.map((box) => {
            const boxTasks = tasksByBox[box];
            if (boxTasks.length === 0) return null;
            return (
              <section key={box}>
                <h2 className="px-4 py-2 text-sm font-semibold text-accent bg-gray-50 sticky top-0">
                  {BOX_SECTION_LABELS[box]} ({boxTasks.length})
                </h2>
                <TaskList
                  tasks={boxTasks}
                  goals={goals}
                  onComplete={completeTask}
                  onUpdate={updateTask}
                  onMove={moveTask}
                  onDelete={deleteTask}
                />
              </section>
            );
          })
        )}
      </main>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end border-t border-gray-200 bg-white px-3 py-2">
        <button
          type="button"
          aria-label="Добавить задачу"
          data-testid="add-task-button"
          onClick={() => setIsCreateTaskSheetOpen(true)}
          className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Category edit sheet */}
      {isEditSheetOpen && category && (
        <CategoryEditSheet
          categoryName={category.name}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setIsEditSheetOpen(false)}
        />
      )}

      {/* Task create sheet */}
      {isCreateTaskSheetOpen && category && (
        <TaskCreateSheet
          categoryName={category.name}
          onSave={handleCreateTask}
          onClose={() => setIsCreateTaskSheetOpen(false)}
        />
      )}
      </div>{/* end main content column */}

      {/* Right filter panel — full height */}
      <RightFilterPanel
        mode="categories"
        isOpen={isPanelOpen}
        goals={goals}
        contexts={contexts}
        selectedGoalId={null}
        selectedContextId={null}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
        onGoalSelect={() => {}}
        onContextSelect={() => {}}
      />
    </div>
  );
}
