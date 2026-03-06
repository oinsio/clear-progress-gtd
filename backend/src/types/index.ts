// Shared types for GAS backend

type Box = 'inbox' | 'today' | 'week' | 'later';
type GoalStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

interface Task {
  id: string;
  title: string;
  notes: string;
  box: Box;
  goal_id: string;
  context_id: string;
  category_id: string;
  is_completed: boolean;
  completed_at: string;
  repeat_rule: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  cover_file_id: string;
  status: GoalStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

interface Context {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

type EntityName = 'tasks' | 'goals' | 'contexts' | 'categories' | 'checklist_items';

interface VersionMap {
  tasks: number;
  goals: number;
  contexts: number;
  categories: number;
  checklist_items: number;
}

interface PushItemResult {
  id: string;
  status: 'created' | 'accepted' | 'conflict';
  version?: number;
  server_record?: Task | Goal | Context | Category | ChecklistItem;
}

interface ApiResponse {
  ok: boolean;
  error?: string;
  message?: string;
}
