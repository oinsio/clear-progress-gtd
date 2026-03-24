import { ACTIONS, ERROR_MESSAGES } from './helpers/constants';
import { jsonError, ERROR_CODES } from './helpers/response';
import { ping } from './actions/ping';
import { init } from './actions/init';
import { pull } from './actions/pull';
import { push } from './actions/push';
import { purge } from './actions/purge';
import { uploadCover } from './actions/upload-cover';
import { uploadCovers } from './actions/upload-covers';
import { deleteCover } from './actions/delete-cover';
import { getCover } from './actions/get-cover';

// GAS entry points — must be global functions
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  const action = e.parameter?.action;
  if (action === ACTIONS.PING) return ping();
  return jsonError(ERROR_CODES.INVALID_ACTION, `${ERROR_MESSAGES.UNKNOWN_ACTION}: ${action}`);
}

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  let body: { action?: string; [key: string]: unknown };

  try {
    body = JSON.parse(e.postData?.contents ?? '{}');
  } catch {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.INVALID_JSON);
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
    case ACTIONS.UPLOAD_COVERS:
      return uploadCovers(payload as Parameters<typeof uploadCovers>[0]);
    case ACTIONS.DELETE_COVER:
      return deleteCover(payload as Parameters<typeof deleteCover>[0]);
    case ACTIONS.GET_COVER:
      return getCover(payload as Parameters<typeof getCover>[0]);
    case ACTIONS.PURGE:
      return purge(payload as Parameters<typeof purge>[0]);
    default:
      return jsonError(ERROR_CODES.INVALID_ACTION, `${ERROR_MESSAGES.UNKNOWN_ACTION}: ${action}`);
  }
}

// Expose GAS entry points to global scope (required when bundled with esbuild IIFE format)
(globalThis as Record<string, unknown>)['doGet'] = doGet;
(globalThis as Record<string, unknown>)['doPost'] = doPost;
