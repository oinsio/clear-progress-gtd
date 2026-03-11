import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsonOk, jsonError, jsonNotInitialized, ERROR_CODES } from './response';
import { ERROR_MESSAGES } from './constants';

function parseLastOutput(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  return JSON.parse(calls[calls.length - 1][0]);
}

function lastMimeType(): string {
  const instance = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.results.slice(-1)[0].value;
  return (instance.setMimeType as ReturnType<typeof vi.fn>).mock.calls[0][0];
}

describe('jsonOk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set ok: true in the response', () => {
    jsonOk({});
    expect(parseLastOutput().ok).toBe(true);
  });

  it('should spread the provided data into the response', () => {
    jsonOk({ count: 3, items: ['a', 'b'] });
    const output = parseLastOutput();
    expect(output.count).toBe(3);
    expect(output.items).toEqual(['a', 'b']);
  });

  it('should set MIME type to JSON', () => {
    jsonOk({});
    expect(lastMimeType()).toBe(ContentService.MimeType.JSON);
  });

  it('should call ContentService.createTextOutput with serialized JSON', () => {
    jsonOk({ server_time: '2025-01-01T00:00:00.000Z' });
    const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
    const rawPayload = calls[calls.length - 1][0] as string;
    expect(() => JSON.parse(rawPayload)).not.toThrow();
    expect(JSON.parse(rawPayload)).toMatchObject({ ok: true, server_time: '2025-01-01T00:00:00.000Z' });
  });
});

describe('jsonError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set ok: false in the response', () => {
    jsonError('SOME_CODE', 'some message');
    expect(parseLastOutput().ok).toBe(false);
  });

  it('should include the error code in the response', () => {
    jsonError('MY_ERROR', 'details');
    expect(parseLastOutput().error).toBe('MY_ERROR');
  });

  it('should include the message in the response', () => {
    jsonError('MY_ERROR', 'Something went wrong');
    expect(parseLastOutput().message).toBe('Something went wrong');
  });

  it('should set MIME type to JSON', () => {
    jsonError('CODE', 'msg');
    expect(lastMimeType()).toBe(ContentService.MimeType.JSON);
  });
});

describe('jsonNotInitialized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set ok: false', () => {
    jsonNotInitialized();
    expect(parseLastOutput().ok).toBe(false);
  });

  it('should use NOT_INITIALIZED error code', () => {
    jsonNotInitialized();
    expect(parseLastOutput().error).toBe(ERROR_CODES.NOT_INITIALIZED);
  });

  it('should use INIT_REQUIRED error message', () => {
    jsonNotInitialized();
    expect(parseLastOutput().message).toBe(ERROR_MESSAGES.INIT_REQUIRED);
  });
});