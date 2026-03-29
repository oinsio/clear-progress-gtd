import { createContext, useCallback, useContext, useState } from "react";
import * as React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { setAccessToken } from "@/services/ApiClient";
import { GOOGLE_USERINFO_URL, STORAGE_KEYS } from "@/constants";

const GOOGLE_OAUTH_SCOPES =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile";

interface AuthContextValue {
  accessToken: string | null;
  userEmail: string | null;
  userPicture: string | null;
  signIn: () => void;
  signOut: () => void;
  silentRefresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

function isGoogleTokenResponse(data: unknown): data is GoogleTokenResponse {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return typeof record.access_token === "string" && typeof record.expires_in === "number";
}

interface GoogleUserInfo {
  picture?: string;
  email?: string;
}

/** Used when VITE_GOOGLE_CLIENT_ID is configured — enables real Google OAuth flow. */
function GoogleAuthInner({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.USER_PICTURE),
  );

  const handleLoginSuccess = useCallback(async (tokenResponse: unknown) => {
    if (!isGoogleTokenResponse(tokenResponse)) return;
    setAccessTokenState(tokenResponse.access_token);
    setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);
    const record = tokenResponse as unknown as Record<string, unknown>;
    if (typeof record.email === "string") {
      setUserEmail(record.email);
    }
    try {
      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
      const pictureUrl = userInfo.picture ?? null;
      setUserPicture(pictureUrl);
      if (pictureUrl) {
        localStorage.setItem(STORAGE_KEYS.USER_PICTURE, pictureUrl);
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
      }
    } catch {
      // non-critical — avatar is a nice-to-have
    }
  }, []);

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    scope: GOOGLE_OAUTH_SCOPES,
    onSuccess: (tokenResponse) => { void handleLoginSuccess(tokenResponse); },
    onError: () => {
      setAccessTokenState(null);
      setUserEmail(null);
      setUserPicture(null);
      localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
      setAccessToken(null);
    },
  });

  const silentGoogleLogin = useGoogleLogin({
    flow: "implicit",
    scope: GOOGLE_OAUTH_SCOPES,
    prompt: "none",
    onSuccess: (tokenResponse) => { void handleLoginSuccess(tokenResponse); },
    onError: () => {
      setAccessTokenState(null);
      setUserEmail(null);
      setUserPicture(null);
      localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
      setAccessToken(null);
    },
  });

  const signIn = useCallback(() => {
    googleLogin();
  }, [googleLogin]);

  const signOut = useCallback(() => {
    setAccessTokenState(null);
    setUserEmail(null);
    setUserPicture(null);
    localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
    setAccessToken(null);
  }, []);

  const silentRefresh = useCallback(() => {
    silentGoogleLogin();
  }, [silentGoogleLogin]);

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, userPicture, signIn, signOut, silentRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Used when Google Client ID is not configured — app works offline without auth. */
function NoAuthInner({ children }: { children: React.ReactNode }) {
  const signIn = useCallback(() => {}, []);
  const signOut = useCallback(() => {}, []);
  const silentRefresh = useCallback(() => {}, []);

  return (
    <AuthContext.Provider value={{ accessToken: null, userEmail: null, userPicture: null, signIn, signOut, silentRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isGoogleConfigured = !!localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);

  if (isGoogleConfigured) {
    return <GoogleAuthInner>{children}</GoogleAuthInner>;
  }
  return <NoAuthInner>{children}</NoAuthInner>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
