import { TaskList } from "@/components/tasks/TaskList";
import { BOX, BOX_FILTER_LABELS } from "@/constants";
import type { Task, Goal, Context, Category } from "@/types/entities";
import type { Box } from "@/types/common";

const NO_TASKS_MESSAGE = "Задач нет. Нажмите сюда, чтобы добавить.";

const BOX_SECTION_ORDER: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];

const BOX_SECTION_LABELS: Record<Box, string> = {
  [BOX.INBOX]: BOX_FILTER_LABELS.inbox,
  [BOX.TODAY]: BOX_FILTER_LABELS.today,
  [BOX.WEEK]: BOX_FILTER_LABELS.week,
  [BOX.LATER]: BOX_FILTER_LABELS.later,
};

interface BoxSectionListProps {
  isLoading: boolean;
  tasksByBox: Record<Box, Task[]>;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onAddPromptClick: () => void;
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
}

export function BoxSectionList({
  isLoading,
  tasksByBox,
  goals,
  contexts,
  categories,
  onAddPromptClick,
  onComplete,
  onUpdate,
  onMove,
  onDelete,
}: BoxSectionListProps) {
  const hasAnyTasks = BOX_SECTION_ORDER.some((box) => tasksByBox[box].length > 0);

  if (!isLoading && !hasAnyTasks) {
    return (
      <button
        type="button"
        data-testid="no-tasks-add-prompt"
        onClick={onAddPromptClick}
        className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-accent hover:bg-gray-50 transition-colors"
      >
        {NO_TASKS_MESSAGE}
      </button>
    );
  }

  return (
    <>
      {BOX_SECTION_ORDER.map((box) => {
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
              contexts={contexts}
              categories={categories}
              onComplete={onComplete}
              onUpdate={onUpdate}
              onMove={onMove}
              onDelete={onDelete}
            />
          </section>
        );
      })}
    </>
  );
}
