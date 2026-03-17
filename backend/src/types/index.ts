// Shared types for GAS backend

export type Box = 'inbox' | 'today' | 'week' | 'later';
export type GoalStatus = 'planning' |'in_progress' | 'paused' | 'completed' | 'cancelled';

export interface Task {
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

export interface Goal {
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

export interface Context {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ChecklistItem {
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

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface VersionMap {
  tasks: number;
  goals: number;
  contexts: number;
  categories: number;
  checklist_items: number;
}

export interface PushItemResult {
  id: string;
  status: 'created' | 'accepted' | 'conflict' | 'rejected';
  version?: number;
  server_record?: Task | Goal | Context | Category | ChecklistItem;
  reason?: string;
}
