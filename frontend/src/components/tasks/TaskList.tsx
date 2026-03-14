import type { Task } from "@/types/entities";
import { TaskItem } from "./TaskItem";

const INBOX_EMPTY_MESSAGE = "Inbox is empty";

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void; // kept for API compatibility
}

export function TaskList({ tasks, onComplete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div
        data-testid="task-list-empty"
        className="flex flex-col items-center justify-center py-16 text-gray-400"
      >
        <p className="text-sm">{INBOX_EMPTY_MESSAGE}</p>
      </div>
    );
  }

  return (
    <ul data-testid="task-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem task={task} onComplete={onComplete} />
        </li>
      ))}
    </ul>
  );
}
