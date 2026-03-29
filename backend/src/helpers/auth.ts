import { PROPERTY_KEYS, GOOGLE_TOKENINFO_URL, AUTH_FAILURE_REASONS, AuthFailureReason } from './constants';

interface TokenInfoResponse {
  email: string;
  email_verified: string;
  sub: string;
}

function isTokenInfoResponse(data: unknown): data is TokenInfoResponse {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return typeof record.email === 'string' && typeof record.email_verified === 'string';
}

export type AuthResult =
  | { ok: true; email: string }
  | { ok: false; reason: AuthFailureReason; details?: string };

/**
 * Verifies an OAuth access token via Google's tokeninfo endpoint.
 * On the first valid call, self-registers the token owner's email as OWNER_EMAIL
 * in PropertiesService. Subsequent calls must match that email.
 *
 * Returns { ok: true, email } on success or { ok: false, reason, details } on failure.
 */
export function verifyToken(accessToken: string): AuthResult {
  let response: GoogleAppsScript.URL_Fetch.HTTPResponse;
  try {
    response = UrlFetchApp.fetch(
      `${GOOGLE_TOKENINFO_URL}?access_token=${encodeURIComponent(accessToken)}`,
      { muteHttpExceptions: true }
    );
  } catch (networkError) {
    const details = networkError instanceof Error ? networkError.message : String(networkError);
    console.error('[verifyToken] UrlFetchApp error:', networkError);
    if (details.includes('https://www.googleapis.com/auth/')) {
      return { ok: false, reason: AUTH_FAILURE_REASONS.GAS_PERMISSION_ERROR, details };
    }
    return { ok: false, reason: AUTH_FAILURE_REASONS.NETWORK_ERROR, details };
  }

  if (response.getResponseCode() !== 200) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE };
  }

  const parsed: unknown = JSON.parse(response.getContentText());

  if (!isTokenInfoResponse(parsed)) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE };
  }
  if (parsed.email_verified !== 'true') {
    return { ok: false, reason: AUTH_FAILURE_REASONS.EMAIL_NOT_VERIFIED };
  }

  const properties = PropertiesService.getScriptProperties();
  const ownerEmail = properties.getProperty(PROPERTY_KEYS.OWNER_EMAIL);

  if (!ownerEmail) {
    properties.setProperty(PROPERTY_KEYS.OWNER_EMAIL, parsed.email);
    return { ok: true, email: parsed.email };
  }

  if (parsed.email !== ownerEmail) {
    return { ok: false, reason: AUTH_FAILURE_REASONS.WRONG_ACCOUNT };
  }
  return { ok: true, email: parsed.email };
}
