import { createContext, useCallback, useContext, useState } from "react";
import * as React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { setAccessToken } from "@/services/ApiClient";
import { STORAGE_KEYS } from "@/constants";

const GOOGLE_OAUTH_SCOPES =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets";

interface AuthContextValue {
  accessToken: string | null;
  userEmail: string | null;
  signIn: () => void;
  signOut: () => void;
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

/** Used when VITE_GOOGLE_CLIENT_ID is configured — enables real Google OAuth flow. */
function GoogleAuthInner({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const handleLoginSuccess = useCallback((tokenResponse: unknown) => {
    if (!isGoogleTokenResponse(tokenResponse)) return;
    setAccessTokenState(tokenResponse.access_token);
    setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);
    const record = tokenResponse as unknown as Record<string, unknown>;
    if (typeof record.email === "string") {
      setUserEmail(record.email);
    }
  }, []);

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    scope: GOOGLE_OAUTH_SCOPES,
    onSuccess: handleLoginSuccess,
    onError: () => {
      setAccessTokenState(null);
      setUserEmail(null);
      setAccessToken(null);
    },
  });

  const signIn = useCallback(() => {
    googleLogin();
  }, [googleLogin]);

  const signOut = useCallback(() => {
    setAccessTokenState(null);
    setUserEmail(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Used when Google Client ID is not configured — app works offline without auth. */
function NoAuthInner({ children }: { children: React.ReactNode }) {
  const signIn = useCallback(() => {}, []);
  const signOut = useCallback(() => {}, []);

  return (
    <AuthContext.Provider value={{ accessToken: null, userEmail: null, signIn, signOut }}>
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
