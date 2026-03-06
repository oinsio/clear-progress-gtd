// GAS entry points — must be global functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  const action = e.parameter?.action;
  if (action === ACTIONS.PING) return ping();
  return jsonError(ERROR_CODES.INVALID_ACTION, `Unknown action: ${action}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  let body: { action?: string; [key: string]: unknown };

  try {
    body = JSON.parse(e.postData?.contents ?? '{}');
  } catch {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, 'Request body must be valid JSON');
  }

  const { action, ...payload } = body;

  switch (action) {
    case ACTIONS.INIT:
      return init();
    case ACTIONS.PULL:
      return pull(payload.versions as Parameters<typeof pull>[0]);
    case ACTIONS.PUSH:
      return push(payload.changes as Parameters<typeof push>[0]);
    case ACTIONS.UPLOAD_COVER:
      return uploadCover(payload as Parameters<typeof uploadCover>[0]);
    case ACTIONS.DELETE_COVER:
      return deleteCover(payload as Parameters<typeof deleteCover>[0]);
    default:
      return jsonError(ERROR_CODES.INVALID_ACTION, `Unknown action: ${action}`);
  }
}
