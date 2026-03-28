import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthProvider";

const mockLogin = vi.fn();

vi.mock("@react-oauth/google", () => ({
  useGoogleLogin: vi.fn((options: { onSuccess: (response: unknown) => void; onError: () => void }) => {
    // Expose the callbacks so tests can trigger them
    (globalThis as Record<string, unknown>).__googleLoginOptions = options;
    return mockLogin;
  }),
}));

vi.mock("@/services/ApiClient", () => ({
  setAccessToken: vi.fn(),
  ApiAuthError: class ApiAuthError extends Error {},
}));

import { setAccessToken } from "@/services/ApiClient";

function TestConsumer() {
  const { accessToken, userEmail, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="token">{accessToken ?? "null"}</span>
      <span data-testid="email">{userEmail ?? "null"}</span>
      <button onClick={signIn}>sign-in</button>
      <button onClick={signOut}>sign-out</button>
    </div>
  );
}

function ThrowingConsumer() {
  useAuth();
  return <div />;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as Record<string, unknown>).__googleLoginOptions;
  });

  it("should throw when useAuth is used outside AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<ThrowingConsumer />)).toThrow("useAuth must be used within AuthProvider");
    consoleSpy.mockRestore();
  });

  it("should have null accessToken and userEmail initially", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(screen.getByTestId("email").textContent).toBe("null");
  });

  it("should call the Google login function when signIn is invoked", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-in" }));
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it("should update accessToken and userEmail after successful Google login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({
        access_token: "test-access-token",
        expires_in: 3600,
      });
    });

    expect(screen.getByTestId("token").textContent).toBe("test-access-token");
  });

  it("should call setAccessToken with token and expiresIn after successful login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({ access_token: "my-token", expires_in: 3600 });
    });

    expect(setAccessToken).toHaveBeenCalledWith("my-token", 3600);
  });

  it("should call setAccessToken(null) when signOut is invoked", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-out" }));
    });

    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it("should clear accessToken and userEmail when signOut is invoked", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Sign in first
    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({ access_token: "my-token", expires_in: 3600 });
    });

    expect(screen.getByTestId("token").textContent).toBe("my-token");

    // Then sign out
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-out" }));
    });

    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(screen.getByTestId("email").textContent).toBe("null");
  });
});
