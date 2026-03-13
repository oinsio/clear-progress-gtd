import { useInboxTasks } from "@/hooks/useInboxTasks";
import { TaskList } from "@/components/tasks/TaskList";

export default function InboxPage() {
  const { tasks, isLoading, completeTask, deleteTask } = useInboxTasks();

  if (isLoading) {
    return (
      <div
        data-testid="inbox-loading"
        className="flex items-center justify-center h-full text-gray-400"
      >
        Loading...
      </div>
    );
  }

  return (
    <div data-testid="inbox-page" className="flex flex-col h-full">
      <header className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold">Inbox</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <TaskList
          tasks={tasks}
          onComplete={completeTask}
          onDelete={deleteTask}
        />
      </main>
    </div>
  );
}
