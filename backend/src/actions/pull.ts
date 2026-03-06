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
    if (err.message === ERROR_CODES.NOT_INITIALIZED) {
      return jsonNotInitialized();
    }
    return jsonError(ERROR_CODES.INTERNAL_ERROR, err.message);
  }
}