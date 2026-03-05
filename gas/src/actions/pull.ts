import { jsonOk, jsonError } from '../helpers/response';
import * as tasks from '../sheets/tasks.sheet';
import * as goals from '../sheets/goals.sheet';
import * as contexts from '../sheets/contexts.sheet';
import * as categories from '../sheets/categories.sheet';
import * as checklists from '../sheets/checklists.sheet';
import * as settings from '../sheets/settings.sheet';
import type { VersionMap } from '../types/index';

export function pull(versions: VersionMap): GoogleAppsScript.Content.TextOutput {
  try {
    return jsonOk({
      data: {
        tasks: tasks.getByVersion(versions.tasks ?? 0),
        goals: goals.getByVersion(versions.goals ?? 0),
        contexts: contexts.getByVersion(versions.contexts ?? 0),
        categories: categories.getByVersion(versions.categories ?? 0),
        checklist_items: checklists.getByVersion(versions.checklist_items ?? 0),
      },
      settings: settings.getAll(),
      server_time: new Date().toISOString(),
    });
  } catch (e) {
    const err = e as Error;
    if (err.message === 'NOT_INITIALIZED') {
      return jsonError('NOT_INITIALIZED', 'Call init before using the API');
    }
    return jsonError('INTERNAL_ERROR', err.message);
  }
}