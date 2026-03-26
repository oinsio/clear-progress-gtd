import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Goal, Context, Category } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskItem } from "./TaskItem";

const INBOX_EMPTY_MESSAGE = "Inbox is empty";
const DRAG_ACTIVATION_DISTANCE_PX = 8;
const TOUCH_ACTIVATION_DELAY_MS = 250;
const TOUCH_ACTIVATION_TOLERANCE_PX = 5;

interface SortableTaskItemProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedTaskId?: string | null;
}

function SortableTaskItem({ task, goals, contexts, categories, onComplete, onUpdate, onMove, onDelete, onSelect, selectedTaskId }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        goals={goals}
        contexts={contexts}
        categories={categories}
        onComplete={onComplete}
        onUpdate={onUpdate}
        onMove={onMove}
        onDelete={onDelete}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          attributes,
          listeners,
        }}
        onSelect={onSelect}
        isSelected={selectedTaskId === task.id}
      />
    </li>
  );
}

interface TaskListProps {
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  onReorder?: (tasks: Task[]) => Promise<void>;
  emptyMessage?: string;
  onEmptyClick?: () => void;
  onSelect?: (id: string) => void;
  selectedTaskId?: string | null;
}

export function TaskList({ tasks, goals, contexts, categories, onComplete, onUpdate, onMove, onDelete, onReorder, emptyMessage, onEmptyClick, onSelect, selectedTaskId }: TaskListProps) {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: TOUCH_ACTIVATION_DELAY_MS,
      tolerance: TOUCH_ACTIVATION_TOLERANCE_PX,
    },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  if (tasks.length === 0) {
    if (onEmptyClick) {
      return (
        <button
          type="button"
          data-testid="task-list-empty"
          onClick={onEmptyClick}
          className={`w-full flex flex-col items-center justify-center text-gray-400 hover:text-accent transition-colors ${emptyMessage ? "py-3" : "py-16"}`}
        >
          <p className="text-sm">{emptyMessage ?? INBOX_EMPTY_MESSAGE}</p>
        </button>
      );
    }
    return (
      <div
        data-testid="task-list-empty"
        className={`flex flex-col items-center justify-center text-gray-400 ${emptyMessage ? "py-3" : "py-16"}`}
      >
        <p className="text-sm">{emptyMessage ?? INBOX_EMPTY_MESSAGE}</p>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);
    const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
    void onReorder(reorderedTasks);
  };

  if (!onReorder) {
    return (
      <ul data-testid="task-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskItem
              task={task}
              goals={goals}
              contexts={contexts}
              categories={categories}
              onComplete={onComplete}
              onUpdate={onUpdate}
              onMove={onMove}
              onDelete={onDelete}
              onSelect={onSelect}
              isSelected={selectedTaskId === task.id}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ul data-testid="task-list">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              goals={goals}
              contexts={contexts}
              categories={categories}
              onComplete={onComplete}
              onUpdate={onUpdate}
              onMove={onMove}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedTaskId={selectedTaskId}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
