import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ACTIONS, ERROR_MESSAGES } from './helpers/constants';
import { ERROR_CODES } from './helpers/response';

vi.mock('./actions/ping', () => ({ ping: vi.fn() }));
vi.mock('./actions/init', () => ({ init: vi.fn() }));
vi.mock('./actions/pull', () => ({ pull: vi.fn() }));
vi.mock('./actions/push', () => ({ push: vi.fn() }));
vi.mock('./actions/purge', () => ({ purge: vi.fn() }));
vi.mock('./actions/upload-cover', () => ({ uploadCover: vi.fn() }));
vi.mock('./actions/delete-cover', () => ({ deleteCover: vi.fn() }));

import { ping } from './actions/ping';
import { init } from './actions/init';
import { pull } from './actions/pull';
import { push } from './actions/push';
import { purge } from './actions/purge';
import { uploadCover } from './actions/upload-cover';
import { deleteCover } from './actions/delete-cover';

// Import main.ts to trigger globalThis assignment of doGet/doPost
import './main';

const globals = globalThis as unknown as Record<string, Function>;

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  return JSON.parse(calls[calls.length - 1][0]);
}

function makeGetEvent(params: Record<string, string> = {}): GoogleAppsScript.Events.DoGet {
  return { parameter: params } as never;
}

function makePostEvent(body: unknown): GoogleAppsScript.Events.DoPost {
  return { postData: { contents: JSON.stringify(body) } } as never;
}

function makePostEventRaw(raw: string): GoogleAppsScript.Events.DoPost {
  return { postData: { contents: raw } } as never;
}

describe('doGet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call ping() when action is "ping"', () => {
    globals.doGet(makeGetEvent({ action: ACTIONS.PING }));
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('should return the result of ping()', () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(ping).mockReturnValue(mockOutput as never);

    const result = globals.doGet(makeGetEvent({ action: ACTIONS.PING }));

    expect(result).toBe(mockOutput);
  });

  it('should return INVALID_ACTION error for unknown action', () => {
    globals.doGet(makeGetEvent({ action: 'unknown_action' }));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_ACTION);
  });

  it('should include the unknown action name in the error message', () => {
    globals.doGet(makeGetEvent({ action: 'bad_action' }));

    expect(parseResponse().message).toContain('bad_action');
  });

  it('should return INVALID_ACTION when no action parameter is provided', () => {
    globals.doGet(makeGetEvent());

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });
});

describe('doPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return INVALID_PAYLOAD when body is not valid JSON', () => {
    globals.doPost(makePostEventRaw('{not valid json'));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    expect(response.message).toBe(ERROR_MESSAGES.INVALID_JSON);
  });

  it('should handle missing postData gracefully', () => {
    globals.doPost({} as never);

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });

  it('should call init() for "init" action', () => {
    globals.doPost(makePostEvent({ action: ACTIONS.INIT }));
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('should call pull() with versions from the request body', () => {
    const versions = { tasks: 5, goals: 2, contexts: 0, categories: 0, checklist_items: 10 };

    globals.doPost(makePostEvent({ action: ACTIONS.PULL, versions }));

    expect(pull).toHaveBeenCalledWith(versions);
  });

  it('should call push() with changes from the request body', () => {
    const changes = { tasks: [{ id: 'task-1' }] };

    globals.doPost(makePostEvent({ action: ACTIONS.PUSH, changes }));

    expect(push).toHaveBeenCalledWith(changes);
  });

  it('should call uploadCover() with payload fields (excluding action)', () => {
    const coverPayload = { goal_id: 'goal-1', filename: 'cover.jpg', mime_type: 'image/jpeg', data: 'base64' };

    globals.doPost(makePostEvent({ action: ACTIONS.UPLOAD_COVER, ...coverPayload }));

    expect(uploadCover).toHaveBeenCalledWith(coverPayload);
  });

  it('should call deleteCover() with payload fields (excluding action)', () => {
    globals.doPost(makePostEvent({ action: ACTIONS.DELETE_COVER, file_id: 'file-abc' }));

    expect(deleteCover).toHaveBeenCalledWith({ file_id: 'file-abc' });
  });

  it('should call purge() with payload fields (excluding action)', () => {
    globals.doPost(makePostEvent({ action: ACTIONS.PURGE, confirm: true }));

    expect(purge).toHaveBeenCalledWith({ confirm: true });
  });

  it('should return the result from the matched action', () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(init).mockReturnValue(mockOutput as never);

    const result = globals.doPost(makePostEvent({ action: ACTIONS.INIT }));

    expect(result).toBe(mockOutput);
  });

  it('should return INVALID_ACTION error for unknown action', () => {
    globals.doPost(makePostEvent({ action: 'unknown_action' }));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_ACTION);
  });

  it('should include the unknown action name in the error message', () => {
    globals.doPost(makePostEvent({ action: 'bad_action' }));

    expect(parseResponse().message).toContain('bad_action');
  });

  it('should return INVALID_ACTION when no action field is present', () => {
    globals.doPost(makePostEvent({}));

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });
});