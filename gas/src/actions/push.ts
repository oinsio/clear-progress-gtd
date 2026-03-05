import { jsonOk, jsonError } from '../helpers/response';
import { resolveConflict } from '../helpers/conflict';
import * as tasksSheet from '../sheets/tasks.sheet';
import * as goalsSheet from '../sheets/goals.sheet';
import * as contextsSheet from '../sheets/contexts.sheet';
import * as categoriesSheet from '../sheets/categories.sheet';
import * as checklistsSheet from '../sheets/checklists.sheet';
import * as settingsSheet from '../sheets/settings.sheet';
import type { Task, Goal, Context, Category, ChecklistItem, Setting, PushItemResult } from '../types';

type AnyEntity = Task | Goal | Context | Category | ChecklistItem;

function processRecords<T extends AnyEntity>(
  incoming: T[],
  existing: T[],
  upsertFn: (record: T) => void
): PushItemResult[] {
  return incoming.map(record => {
    const serverRecord = existing.find(e => e.id === record.id);

    if (!serverRecord) {
      upsertFn({ ...record, version: record.version });
      return { id: record.id, status: 'created', version: record.version };
    }

    const resolution = resolveConflict(record.updated_at, serverRecord.updated_at);
    if (resolution === 'accept') {
      const updated = { ...record, version: serverRecord.version + 1 };
      upsertFn(updated);
      return { id: record.id, status: 'accepted', version: updated.version };
    }

    return { id: record.id, status: 'conflict', server_record: serverRecord };
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
      results.tasks = processRecords(changes.tasks, tasksSheet.getAll(), tasksSheet.upsert);
    }
    if (changes.goals?.length) {
      results.goals = processRecords(changes.goals, goalsSheet.getAll(), goalsSheet.upsert);
    }
    if (changes.contexts?.length) {
      results.contexts = processRecords(changes.contexts, contextsSheet.getAll(), contextsSheet.upsert);
    }
    if (changes.categories?.length) {
      results.categories = processRecords(changes.categories, categoriesSheet.getAll(), categoriesSheet.upsert);
    }
    if (changes.checklist_items?.length) {
      results.checklist_items = processRecords(changes.checklist_items, checklistsSheet.getAll(), checklistsSheet.upsert);
    }
    if (changes.settings?.length) {
      changes.settings.forEach(s => settingsSheet.upsert(s));
      results.settings = changes.settings.map(s => ({ id: s.key, status: 'accepted' }));
    }

    return jsonOk({ results, server_time: new Date().toISOString() });
  } catch (e) {
    const err = e as Error;
    if (err.message === 'NOT_INITIALIZED') {
      return jsonError('NOT_INITIALIZED', 'Call init before using the API');
    }
    return jsonError('INTERNAL_ERROR', err.message);
  }
}