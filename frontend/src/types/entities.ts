import type { Box, GoalStatus } from "./common";

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

interface NamedEntity {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export type Context = NamedEntity;

export type Category = NamedEntity;

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

export interface CoverRecord {
  file_id: string;
  thumbnail_url: string;
  data_hash: string;
}
