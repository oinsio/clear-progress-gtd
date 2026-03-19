export const DB_SCHEMA = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_deleted, sort_order, version, updated_at",
  goals: "id, status, is_deleted, sort_order, version, updated_at",
  contexts: "id, is_deleted, sort_order, version, updated_at",
  categories: "id, is_deleted, sort_order, version, updated_at",
  checklist_items: "id, task_id, is_deleted, sort_order, version, updated_at",
  settings: "key, updated_at",
  covers: "file_id, data_hash",
} as const;
