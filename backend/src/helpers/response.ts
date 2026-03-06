function jsonOk(data: object): GoogleAppsScript.Content.TextOutput {
  const payload = JSON.stringify({ ok: true, ...data });
  return ContentService.createTextOutput(payload).setMimeType(
    ContentService.MimeType.JSON
  );
}

function jsonError(
  error: string,
  message: string
): GoogleAppsScript.Content.TextOutput {
  const payload = JSON.stringify({ ok: false, error, message });
  return ContentService.createTextOutput(payload).setMimeType(
    ContentService.MimeType.JSON
  );
}

const ERROR_CODES = {
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
} as const;

function jsonNotInitialized(): GoogleAppsScript.Content.TextOutput {
  return jsonError(ERROR_CODES.NOT_INITIALIZED, 'Call init before using the API');
}
