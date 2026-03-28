import { PROPERTY_KEYS, GOOGLE_TOKENINFO_URL } from './constants';

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

/**
 * Verifies an OAuth access token via Google's tokeninfo endpoint.
 * On the first valid call, self-registers the token owner's email as OWNER_EMAIL
 * in PropertiesService. Subsequent calls must match that email.
 *
 * Returns the verified email on success, null on any failure.
 */
export function verifyToken(accessToken: string): string | null {
  try {
    const response = UrlFetchApp.fetch(
      `${GOOGLE_TOKENINFO_URL}?access_token=${encodeURIComponent(accessToken)}`
    );
    const parsed: unknown = JSON.parse(response.getContentText());

    if (!isTokenInfoResponse(parsed)) return null;
    if (parsed.email_verified !== 'true') return null;

    const properties = PropertiesService.getScriptProperties();
    const ownerEmail = properties.getProperty(PROPERTY_KEYS.OWNER_EMAIL);

    if (!ownerEmail) {
      properties.setProperty(PROPERTY_KEYS.OWNER_EMAIL, parsed.email);
      return parsed.email;
    }

    if (parsed.email !== ownerEmail) return null;
    return parsed.email;
  } catch {
    return null;
  }
}
