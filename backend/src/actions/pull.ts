function pull(versions: VersionMap): GoogleAppsScript.Content.TextOutput {
  try {
    return jsonOk({
      data: {
        tasks: getTasksByVersion(versions.tasks ?? 0),
        goals: getGoalsByVersion(versions.goals ?? 0),
        contexts: getContextsByVersion(versions.contexts ?? 0),
        categories: getCategoriesByVersion(versions.categories ?? 0),
        checklist_items: getChecklistItemsByVersion(versions.checklist_items ?? 0),
      },
      settings: getAllSettings(),
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