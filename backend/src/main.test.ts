import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ACTIONS, ERROR_MESSAGES, AUTH_FAILURE_REASONS } from './helpers/constants';
import { ERROR_CODES } from './helpers/response';

vi.mock('./actions/ping', () => ({ ping: vi.fn() }));
vi.mock('./actions/init', () => ({ init: vi.fn() }));
vi.mock('./actions/pull', () => ({ pull: vi.fn() }));
vi.mock('./actions/push', () => ({ push: vi.fn() }));
vi.mock('./actions/purge', () => ({ purge: vi.fn() }));
vi.mock('./actions/upload-cover', () => ({ uploadCover: vi.fn() }));
vi.mock('./actions/upload-covers', () => ({ uploadCovers: vi.fn() }));
vi.mock('./actions/delete-cover', () => ({ deleteCover: vi.fn() }));
vi.mock('./actions/get-cover', () => ({ getCover: vi.fn() }));
vi.mock('./helpers/auth', () => ({ verifyToken: vi.fn() }));

import { ping } from './actions/ping';
import { init } from './actions/init';
import { pull } from './actions/pull';
import { push } from './actions/push';
import { purge } from './actions/purge';
import { uploadCover } from './actions/upload-cover';
import { uploadCovers } from './actions/upload-covers';
import { deleteCover } from './actions/delete-cover';
import { getCover } from './actions/get-cover';
import { verifyToken } from './helpers/auth';

// Import main.ts to trigger globalThis assignment of doGet/doPost
import './main';

const globals = globalThis as unknown as Record<string, Function>;

const VALID_TOKEN = 'valid-access-token';
const OWNER_EMAIL = 'owner@example.com';

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

/** Creates a POST event with a valid access_token included */
function makeAuthenticatedPostEvent(body: Record<string, unknown>): GoogleAppsScript.Events.DoPost {
  return makePostEvent({ ...body, access_token: VALID_TOKEN });
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

  it('should return INVALID_ACTION when doGet event has no parameter property', () => {
    globals.doGet({} as never);

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });
});

describe('doPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: token is valid
    vi.mocked(verifyToken).mockReturnValue({ ok: true, email: OWNER_EMAIL } as never);
  });

  describe('authentication', () => {
    it('should return UNAUTHORIZED when access_token is missing', () => {
      globals.doPost(makePostEvent({ action: ACTIONS.INIT }));

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should include TOKEN_REQUIRED message when access_token is missing', () => {
      globals.doPost(makePostEvent({ action: ACTIONS.INIT }));

      expect(parseResponse().message).toBe(ERROR_MESSAGES.TOKEN_REQUIRED);
    });

    it('should return UNAUTHORIZED when access_token is not a string', () => {
      globals.doPost(makePostEvent({ action: ACTIONS.INIT, access_token: 123 }));

      expect(parseResponse().error).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should include TOKEN_REQUIRED message when access_token is not a string', () => {
      globals.doPost(makePostEvent({ action: ACTIONS.INIT, access_token: 123 }));

      expect(parseResponse().message).toBe(ERROR_MESSAGES.TOKEN_REQUIRED);
    });

    it('should return UNAUTHORIZED when verifyToken returns NETWORK_ERROR', () => {
      vi.mocked(verifyToken).mockReturnValue({ ok: false, reason: AUTH_FAILURE_REASONS.NETWORK_ERROR } as never);
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(parseResponse().error).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should include NETWORK_ERROR message when verifyToken returns NETWORK_ERROR', () => {
      vi.mocked(verifyToken).mockReturnValue({ ok: false, reason: AUTH_FAILURE_REASONS.NETWORK_ERROR } as never);
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(parseResponse().message).toBe(ERROR_MESSAGES.AUTH_NETWORK_ERROR);
    });

    it('should include INVALID_RESPONSE message when verifyToken returns INVALID_RESPONSE', () => {
      vi.mocked(verifyToken).mockReturnValue({ ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE } as never);
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(parseResponse().message).toBe(ERROR_MESSAGES.AUTH_INVALID_RESPONSE);
    });

    it('should include EMAIL_NOT_VERIFIED message when verifyToken returns EMAIL_NOT_VERIFIED', () => {
      vi.mocked(verifyToken).mockReturnValue({ ok: false, reason: AUTH_FAILURE_REASONS.EMAIL_NOT_VERIFIED } as never);
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(parseResponse().message).toBe(ERROR_MESSAGES.AUTH_EMAIL_NOT_VERIFIED);
    });

    it('should include WRONG_ACCOUNT message when verifyToken returns WRONG_ACCOUNT', () => {
      vi.mocked(verifyToken).mockReturnValue({ ok: false, reason: AUTH_FAILURE_REASONS.WRONG_ACCOUNT } as never);
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(parseResponse().message).toBe(ERROR_MESSAGES.AUTH_WRONG_ACCOUNT);
    });

    it('should call verifyToken with the provided access_token', () => {
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(verifyToken).toHaveBeenCalledWith(VALID_TOKEN);
    });

    it('should not call any action handler when unauthorized', () => {
      vi.mocked(verifyToken).mockReturnValue({ ok: false, reason: AUTH_FAILURE_REASONS.WRONG_ACCOUNT } as never);
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(init).not.toHaveBeenCalled();
    });

    it('should include auth failure details in the error message when verifyToken returns details', () => {
      vi.mocked(verifyToken).mockReturnValue({
        ok: false,
        reason: AUTH_FAILURE_REASONS.NETWORK_ERROR,
        details: 'connection refused',
      } as never);
      globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

      expect(parseResponse().message).toContain('connection refused');
    });
  });

  it('should return INVALID_PAYLOAD when body is not valid JSON', () => {
    globals.doPost(makePostEventRaw('{not valid json'));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    expect(response.message).toBe(ERROR_MESSAGES.INVALID_JSON);
  });

  it('should return UNAUTHORIZED when postData is missing (no token in body)', () => {
    globals.doPost({} as never);

    expect(parseResponse().error).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it('should call init() for "init" action', () => {
    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('should call pull() with versions from the request body', () => {
    const versions = { tasks: 5, goals: 2, contexts: 0, categories: 0, checklist_items: 10 };

    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.PULL, versions }));

    expect(pull).toHaveBeenCalledWith(versions);
  });

  it('should call push() with changes from the request body', () => {
    const changes = { tasks: [{ id: 'task-1' }] };

    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.PUSH, changes }));

    expect(push).toHaveBeenCalledWith(changes);
  });

  it('should call uploadCover() with payload fields (excluding action and access_token)', () => {
    const coverPayload = { goal_id: 'goal-1', filename: 'cover.jpg', mime_type: 'image/jpeg', data: 'base64' };

    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.UPLOAD_COVER, ...coverPayload }));

    expect(uploadCover).toHaveBeenCalledWith(coverPayload);
  });

  it('should call deleteCover() with payload fields (excluding action and access_token)', () => {
    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.DELETE_COVER, file_id: 'file-abc' }));

    expect(deleteCover).toHaveBeenCalledWith({ file_id: 'file-abc' });
  });

  it('should call uploadCovers() with payload fields (excluding action and access_token)', () => {
    const coversPayload = { covers: [{ goal_id: 'g-1', filename: 'a.jpg', mime_type: 'image/jpeg', data: 'b64' }] };

    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.UPLOAD_COVERS, ...coversPayload }));

    expect(uploadCovers).toHaveBeenCalledWith(coversPayload);
  });

  it('should return the result of uploadCovers()', () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(uploadCovers).mockReturnValue(mockOutput as never);

    const result = globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.UPLOAD_COVERS }));

    expect(result).toBe(mockOutput);
  });

  it('should call getCover() with payload fields (excluding action and access_token)', () => {
    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.GET_COVER, file_ids: ['file-1'] }));

    expect(getCover).toHaveBeenCalledWith({ file_ids: ['file-1'] });
  });

  it('should return the result of getCover()', () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(getCover).mockReturnValue(mockOutput as never);

    const result = globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.GET_COVER }));

    expect(result).toBe(mockOutput);
  });

  it('should call purge() with payload fields (excluding action and access_token)', () => {
    globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.PURGE, confirm: true }));

    expect(purge).toHaveBeenCalledWith({ confirm: true });
  });

  it('should return the result from the matched action', () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(init).mockReturnValue(mockOutput as never);

    const result = globals.doPost(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

    expect(result).toBe(mockOutput);
  });

  it('should return INVALID_ACTION error for unknown action', () => {
    globals.doPost(makeAuthenticatedPostEvent({ action: 'unknown_action' }));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_ACTION);
  });

  it('should include the unknown action name in the error message', () => {
    globals.doPost(makeAuthenticatedPostEvent({ action: 'bad_action' }));

    expect(parseResponse().message).toContain('bad_action');
  });

  it('should return INVALID_ACTION when no action field is present', () => {
    globals.doPost(makeAuthenticatedPostEvent({}));

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });
});
