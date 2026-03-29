import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken } from './auth';
import { PROPERTY_KEYS, AUTH_FAILURE_REASONS } from './constants';
import { resetScriptProperties, setScriptProperty } from '../../tests/setup/gas-mocks';

function mockTokenInfoResponse(data: object, statusCode = 200): void {
  vi.mocked(UrlFetchApp.fetch).mockReturnValue({
    getResponseCode: () => statusCode,
    getContentText: () => JSON.stringify(data),
  } as never);
}

function mockTokenInfoHttpError(statusCode: number): void {
  vi.mocked(UrlFetchApp.fetch).mockReturnValue({
    getResponseCode: () => statusCode,
    getContentText: () => JSON.stringify({ error: 'invalid_token' }),
  } as never);
}

function mockTokenInfoError(): void {
  vi.mocked(UrlFetchApp.fetch).mockImplementation(() => {
    throw new Error('Network error');
  });
}

function mockTokenInfoPermissionError(scope = 'https://www.googleapis.com/auth/script.external_request'): void {
  vi.mocked(UrlFetchApp.fetch).mockImplementation(() => {
    throw new Error(`You do not have permission to call UrlFetchApp.fetch. Required permissions: ${scope}.`);
  });
}

const VALID_EMAIL = 'owner@example.com';
const OTHER_EMAIL = 'other@example.com';

const VALID_TOKEN_INFO = {
  email: VALID_EMAIL,
  email_verified: 'true',
  sub: '12345',
};

describe('verifyToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
  });

  it('should return INVALID_RESPONSE reason when tokeninfo returns non-200 HTTP status', () => {
    mockTokenInfoHttpError(400);
    const result = verifyToken('expired-or-invalid-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE });
  });

  it('should return NETWORK_ERROR reason when UrlFetchApp throws', () => {
    mockTokenInfoError();
    const result = verifyToken('any-token');
    expect(result).toMatchObject({ ok: false, reason: AUTH_FAILURE_REASONS.NETWORK_ERROR });
  });

  it('should include error details in result when UrlFetchApp throws', () => {
    mockTokenInfoError();
    const result = verifyToken('any-token');
    expect(result).toMatchObject({ ok: false, details: 'Network error' });
  });

  it('should log the error to console when UrlFetchApp throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTokenInfoError();
    verifyToken('any-token');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[verifyToken] UrlFetchApp error:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should return GAS_PERMISSION_ERROR reason when UrlFetchApp throws a permission error', () => {
    mockTokenInfoPermissionError();
    const result = verifyToken('any-token');
    expect(result).toMatchObject({ ok: false, reason: AUTH_FAILURE_REASONS.GAS_PERMISSION_ERROR });
  });

  it('should include error details when GAS permission error is thrown', () => {
    mockTokenInfoPermissionError();
    const result = verifyToken('any-token');
    expect(result).toMatchObject({ ok: false, details: expect.stringContaining('script.external_request') });
  });

  it('should return GAS_PERMISSION_ERROR for any googleapis.com/auth scope, not just external_request', () => {
    mockTokenInfoPermissionError('https://www.googleapis.com/auth/spreadsheets');
    const result = verifyToken('any-token');
    expect(result).toMatchObject({ ok: false, reason: AUTH_FAILURE_REASONS.GAS_PERMISSION_ERROR });
  });

  it('should return EMAIL_NOT_VERIFIED reason when email_verified !== "true"', () => {
    mockTokenInfoResponse({ email: VALID_EMAIL, email_verified: 'false' });
    const result = verifyToken('some-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.EMAIL_NOT_VERIFIED });
  });

  it('should return INVALID_RESPONSE reason when tokeninfo response is missing email field', () => {
    mockTokenInfoResponse({ email_verified: 'true', sub: '123' });
    const result = verifyToken('some-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE });
  });

  it('should return INVALID_RESPONSE reason when tokeninfo response is not a valid object', () => {
    mockTokenInfoResponse('invalid' as unknown as object);
    const result = verifyToken('some-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE });
  });

  it('should self-register OWNER_EMAIL on first valid call and return ok with email', () => {
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    const result = verifyToken('first-token');
    expect(result).toEqual({ ok: true, email: VALID_EMAIL });
    expect(PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.OWNER_EMAIL)).toBe(VALID_EMAIL);
  });

  it('should return ok with email when token matches registered OWNER_EMAIL', () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    const result = verifyToken('valid-token');
    expect(result).toEqual({ ok: true, email: VALID_EMAIL });
  });

  it('should return WRONG_ACCOUNT reason when token email does not match registered OWNER_EMAIL', () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse({ email: OTHER_EMAIL, email_verified: 'true' });
    const result = verifyToken('other-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.WRONG_ACCOUNT });
  });

  it('should call UrlFetchApp.fetch with the tokeninfo URL containing the token', () => {
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    verifyToken('my-access-token');
    const fetchCall = vi.mocked(UrlFetchApp.fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain('my-access-token');
    expect(fetchCall).toContain('googleapis.com');
  });

  it('should not overwrite OWNER_EMAIL if already registered', () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse({ email: OTHER_EMAIL, email_verified: 'true' });
    verifyToken('token');
    expect(PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.OWNER_EMAIL)).toBe(VALID_EMAIL);
  });

  it('should return INVALID_RESPONSE when tokeninfo JSON body is null', () => {
    vi.mocked(UrlFetchApp.fetch).mockReturnValue({
      getResponseCode: () => 200,
      getContentText: () => 'null',
    } as never);
    const result = verifyToken('some-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE });
  });

  it('should return INVALID_RESPONSE when tokeninfo response has email but no email_verified field', () => {
    mockTokenInfoResponse({ email: VALID_EMAIL } as unknown as object);
    const result = verifyToken('some-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE });
  });

  it('should call UrlFetchApp.fetch with muteHttpExceptions: true', () => {
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    verifyToken('my-token');
    expect(UrlFetchApp.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ muteHttpExceptions: true })
    );
  });

  it('should return INVALID_RESPONSE when response code is non-200 even if body looks valid', () => {
    vi.mocked(UrlFetchApp.fetch).mockReturnValue({
      getResponseCode: () => 401,
      getContentText: () => JSON.stringify({ email: VALID_EMAIL, email_verified: 'true' }),
    } as never);
    const result = verifyToken('expired-token');
    expect(result).toEqual({ ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE });
  });
});
