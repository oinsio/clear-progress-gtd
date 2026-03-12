import { PUSH_STATUSES, CONFLICT_RESOLUTION, ERROR_MESSAGES, isBlankString, isValidUuid } from '../helpers/constants';
import { jsonOk, jsonError, jsonNotInitialized, ERROR_CODES } from '../helpers/response';
import { resolveConflict } from '../helpers/conflict';
import { getAllTasks, upsertTask } from '../sheets/tasks.sheet';
import { getAllGoals, upsertGoal } from '../sheets/goals.sheet';
import { getAllContexts, upsertContext } from '../sheets/contexts.sheet';
import { getAllCategories, upsertCategory } from '../sheets/categories.sheet';
import { getAllChecklistItems, upsertChecklistItem } from '../sheets/checklists.sheet';
import { upsertSetting } from '../sheets/settings.sheet';
import type { Task, Goal, Context, Category, ChecklistItem, Setting, PushItemResult } from '../types';

type AnyEntity = Task | Goal | Context | Category | ChecklistItem;

function getEntityLabel(entity: AnyEntity): string {
  return 'title' in entity ? entity.title : entity.name;
}

function getInvalidForeignKeyReason(record: AnyEntity): string | null {
  if ('task_id' in record) {
    if (!isValidUuid(record.task_id)) {
      return ERROR_MESSAGES.INVALID_REQUIRED_FK;
    }
  }
  if ('goal_id' in record) {
    if (record.goal_id !== '' && !isValidUuid(record.goal_id)) {
      return ERROR_MESSAGES.INVALID_OPTIONAL_FK;
    }
    if (record.context_id !== '' && !isValidUuid(record.context_id)) {
      return ERROR_MESSAGES.INVALID_OPTIONAL_FK;
    }
    if (record.category_id !== '' && !isValidUuid(record.category_id)) {
      return ERROR_MESSAGES.INVALID_OPTIONAL_FK;
    }
  }
  return null;
}

function processRecords<T extends AnyEntity>(
  incoming: T[],
  existing: T[],
  upsertFn: (record: T) => void
): PushItemResult[] {
  return incoming.map(record => {
    if (!isValidUuid(record.id)) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.INVALID_ID };
    }

    if (isBlankString(getEntityLabel(record))) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.BLANK_TITLE };
    }

    const fkError = getInvalidForeignKeyReason(record);
    if (fkError) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: fkError };
    }

    const serverRecord = existing.find(e => e.id === record.id);

    if (!serverRecord) {
      upsertFn({ ...record, version: record.version });
      return { id: record.id, status: PUSH_STATUSES.CREATED, version: record.version };
    }

    const resolution = resolveConflict(record.updated_at, serverRecord.updated_at);
    if (resolution === CONFLICT_RESOLUTION.ACCEPT) {
      const updated = { ...record, version: serverRecord.version + 1 };
      upsertFn(updated);
      return { id: record.id, status: PUSH_STATUSES.ACCEPTED, version: updated.version };
    }

    return { id: record.id, status: PUSH_STATUSES.CONFLICT, server_record: serverRecord };
  });
}

export function push(changes: {
  tasks?: Task[];
  goals?: Goal[];
  contexts?: Context[];
  categories?: Category[];
  checklist_items?: ChecklistItem[];
  settings?: Setting[];
}): GoogleAppsScript.Content.TextOutput {
  try {
    const results: Record<string, PushItemResult[]> = {};

    if (changes.tasks?.length) {
      results.tasks = processRecords(changes.tasks, getAllTasks(), upsertTask);
    }
    if (changes.goals?.length) {
      results.goals = processRecords(changes.goals, getAllGoals(), upsertGoal);
    }
    if (changes.contexts?.length) {
      results.contexts = processRecords(changes.contexts, getAllContexts(), upsertContext);
    }
    if (changes.categories?.length) {
      results.categories = processRecords(changes.categories, getAllCategories(), upsertCategory);
    }
    if (changes.checklist_items?.length) {
      results.checklist_items = processRecords(changes.checklist_items, getAllChecklistItems(), upsertChecklistItem);
    }
    if (changes.settings?.length) {
      changes.settings.forEach(s => upsertSetting(s));
      results.settings = changes.settings.map(s => ({ id: s.key, status: PUSH_STATUSES.ACCEPTED }));
    }

    return jsonOk({ results, server_time: new Date().toISOString() });
  } catch (e) {
    const err = e as Error;
    if (err.message === ERROR_CODES.NOT_INITIALIZED) {
      return jsonNotInitialized();
    }
    return jsonError(ERROR_CODES.INTERNAL_ERROR, err.message);
  }
}
