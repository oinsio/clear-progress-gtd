import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken } from './auth';
import { PROPERTY_KEYS } from './constants';
import { resetScriptProperties, setScriptProperty } from '../../tests/setup/gas-mocks';

function mockTokenInfoResponse(data: object): void {
  vi.mocked(UrlFetchApp.fetch).mockReturnValue({
    getContentText: () => JSON.stringify(data),
  } as never);
}

function mockTokenInfoError(): void {
  vi.mocked(UrlFetchApp.fetch).mockImplementation(() => {
    throw new Error('Network error');
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

  it('should return null when UrlFetchApp throws a network error', () => {
    mockTokenInfoError();
    expect(verifyToken('any-token')).toBeNull();
  });

  it('should return null when tokeninfo response has email_verified !== "true"', () => {
    mockTokenInfoResponse({ email: VALID_EMAIL, email_verified: 'false' });
    expect(verifyToken('some-token')).toBeNull();
  });

  it('should return null when tokeninfo response is missing email field', () => {
    mockTokenInfoResponse({ email_verified: 'true', sub: '123' });
    expect(verifyToken('some-token')).toBeNull();
  });

  it('should return null when tokeninfo response is not a valid object', () => {
    mockTokenInfoResponse('invalid' as unknown as object);
    expect(verifyToken('some-token')).toBeNull();
  });

  it('should self-register OWNER_EMAIL on first valid call', () => {
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    const result = verifyToken('first-token');
    expect(result).toBe(VALID_EMAIL);
    expect(PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.OWNER_EMAIL)).toBe(VALID_EMAIL);
  });

  it('should return the email when token matches registered OWNER_EMAIL', () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    expect(verifyToken('valid-token')).toBe(VALID_EMAIL);
  });

  it('should return null when token email does not match registered OWNER_EMAIL', () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse({ email: OTHER_EMAIL, email_verified: 'true' });
    expect(verifyToken('other-token')).toBeNull();
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
});
