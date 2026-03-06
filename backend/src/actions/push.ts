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

function push(changes: {
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