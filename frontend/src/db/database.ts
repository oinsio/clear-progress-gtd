import Dexie, { type EntityTable } from "dexie";
import type {
  Task,
  Goal,
  Context,
  Category,
  ChecklistItem,
  Setting,
} from "@/types/entities";
import { DB_NAME, DB_VERSION } from "@/constants";
import { DB_SCHEMA } from "./schema";

export class ClearProgressDatabase extends Dexie {
  tasks!: EntityTable<Task, "id">;
  goals!: EntityTable<Goal, "id">;
  contexts!: EntityTable<Context, "id">;
  categories!: EntityTable<Category, "id">;
  checklist_items!: EntityTable<ChecklistItem, "id">;
  settings!: EntityTable<Setting, "key">;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores(DB_SCHEMA);
  }
}

export const db = new ClearProgressDatabase();
