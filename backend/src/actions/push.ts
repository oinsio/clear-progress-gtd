import { PUSH_STATUSES, CONFLICT_RESOLUTION, ERROR_MESSAGES, VALID_BOXES, isBlankString, isValidUuid } from '../helpers/constants';
import { jsonOk, jsonError, jsonNotInitialized, ERROR_CODES } from '../helpers/response';
import { resolveConflict } from '../helpers/conflict';
import { getAllTasks, upsertTasks } from '../sheets/tasks.sheet';
import { getAllGoals, upsertGoals } from '../sheets/goals.sheet';
import { getAllContexts, upsertContexts } from '../sheets/contexts.sheet';
import { getAllCategories, upsertCategories } from '../sheets/categories.sheet';
import { getAllChecklistItems, upsertChecklistItems } from '../sheets/checklists.sheet';
import { getAllSettings, upsertSettings } from '../sheets/settings.sheet';
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
  batchUpsertFn: (records: T[]) => void
): PushItemResult[] {
  const recordsToUpsert: T[] = [];

  const results = incoming.map(record => {
    if (!isValidUuid(record.id)) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.INVALID_ID };
    }

    if (isBlankString(getEntityLabel(record))) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.BLANK_TITLE };
    }

    if ('box' in record && !VALID_BOXES.includes(record.box)) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.INVALID_BOX };
    }

    const fkError = getInvalidForeignKeyReason(record);
    if (fkError) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: fkError };
    }

    const serverRecord = existing.find(e => e.id === record.id);

    if (!serverRecord) {
      recordsToUpsert.push({ ...record });
      return { id: record.id, status: PUSH_STATUSES.CREATED, version: record.version };
    }

    const resolution = resolveConflict(record.updated_at, serverRecord.updated_at);
    if (resolution === CONFLICT_RESOLUTION.ACCEPT) {
      const updated = { ...record, version: serverRecord.version + 1 };
      recordsToUpsert.push(updated);
      return { id: record.id, status: PUSH_STATUSES.ACCEPTED, version: updated.version };
    }

    return { id: record.id, status: PUSH_STATUSES.CONFLICT, server_record: serverRecord };
  });

  batchUpsertFn(recordsToUpsert);
  return results;
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
      results.tasks = processRecords(changes.tasks, getAllTasks(), upsertTasks);
    }
    if (changes.goals?.length) {
      results.goals = processRecords(changes.goals, getAllGoals(), upsertGoals);
    }
    if (changes.contexts?.length) {
      results.contexts = processRecords(changes.contexts, getAllContexts(), upsertContexts);
    }
    if (changes.categories?.length) {
      results.categories = processRecords(changes.categories, getAllCategories(), upsertCategories);
    }
    if (changes.checklist_items?.length) {
      results.checklist_items = processRecords(changes.checklist_items, getAllChecklistItems(), upsertChecklistItems);
    }
    if (changes.settings?.length) {
      const serverSettings = getAllSettings();
      const settingsToUpsert: typeof changes.settings = [];
      results.settings = changes.settings.map(clientSetting => {
        const serverSetting = serverSettings.find(s => s.key === clientSetting.key);
        const resolution = serverSetting
          ? resolveConflict(clientSetting.updated_at, serverSetting.updated_at)
          : CONFLICT_RESOLUTION.ACCEPT;

        if (resolution === CONFLICT_RESOLUTION.ACCEPT) {
          settingsToUpsert.push(clientSetting);
          return { id: clientSetting.key, status: PUSH_STATUSES.ACCEPTED };
        }

        return { id: clientSetting.key, status: PUSH_STATUSES.CONFLICT };
      });
      upsertSettings(settingsToUpsert);
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
