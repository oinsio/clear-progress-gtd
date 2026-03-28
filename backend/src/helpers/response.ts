import { ERROR_MESSAGES } from './constants';

export function jsonOk(data: object): GoogleAppsScript.Content.TextOutput {
  const payload = JSON.stringify({ ok: true, ...data });
  return ContentService.createTextOutput(payload).setMimeType(
    ContentService.MimeType.JSON
  );
}

export function jsonError(
  error: string,
  message: string
): GoogleAppsScript.Content.TextOutput {
  const payload = JSON.stringify({ ok: false, error, message });
  return ContentService.createTextOutput(payload).setMimeType(
    ContentService.MimeType.JSON
  );
}

export const ERROR_CODES = {
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export function jsonNotInitialized(): GoogleAppsScript.Content.TextOutput {
  return jsonError(ERROR_CODES.NOT_INITIALIZED, ERROR_MESSAGES.INIT_REQUIRED);
}

export function jsonUnauthorized(message: string): GoogleAppsScript.Content.TextOutput {
  return jsonError(ERROR_CODES.UNAUTHORIZED, message);
}