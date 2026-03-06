// GAS entry points — must be global functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  const action = e.parameter?.action;
  if (action === 'ping') return ping();
  return jsonError('INVALID_ACTION', `Unknown action: ${action}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  let body: { action?: string; [key: string]: unknown };

  try {
    body = JSON.parse(e.postData?.contents ?? '{}');
  } catch {
    return jsonError('INVALID_PAYLOAD', 'Request body must be valid JSON');
  }

  const { action, ...payload } = body;

  switch (action) {
    case 'init':
      return init();
    case 'pull':
      return pull(payload.versions as Parameters<typeof pull>[0]);
    case 'push':
      return push(payload.changes as Parameters<typeof push>[0]);
    case 'upload_cover':
      return uploadCover(payload as Parameters<typeof uploadCover>[0]);
    case 'delete_cover':
      return deleteCover(payload as Parameters<typeof deleteCover>[0]);
    default:
      return jsonError('INVALID_ACTION', `Unknown action: ${action}`);
  }
}
