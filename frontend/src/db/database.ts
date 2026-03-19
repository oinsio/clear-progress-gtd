import Dexie, { type EntityTable } from "dexie";
import type {
  Task,
  Goal,
  Context,
  Category,
  ChecklistItem,
  Setting,
  CoverRecord,
} from "@/types/entities";
import { DB_NAME, DB_VERSION } from "@/constants";
import { DB_SCHEMA } from "./schema";

const V1_SCHEMA = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_deleted, sort_order, version, updated_at",
  goals: "id, status, is_deleted, sort_order, version, updated_at",
  contexts: "id, is_deleted, sort_order, version, updated_at",
  categories: "id, is_deleted, sort_order, version, updated_at",
  checklist_items: "id, task_id, is_deleted, sort_order, version, updated_at",
  settings: "key, updated_at",
};

export class ClearProgressDatabase extends Dexie {
  tasks!: EntityTable<Task, "id">;
  goals!: EntityTable<Goal, "id">;
  contexts!: EntityTable<Context, "id">;
  categories!: EntityTable<Category, "id">;
  checklist_items!: EntityTable<ChecklistItem, "id">;
  settings!: EntityTable<Setting, "key">;
  covers!: EntityTable<CoverRecord, "file_id">;

  constructor() {
    super(DB_NAME);
    this.version(1).stores(V1_SCHEMA);
    this.version(DB_VERSION).stores(DB_SCHEMA);
  }
}

export const db = new ClearProgressDatabase();
