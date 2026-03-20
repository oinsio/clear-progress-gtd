import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SetupPage from "./SetupPage";
import { STORAGE_KEYS, ROUTES } from "@/constants";
import { localStorageMock } from "@/test/mocks/localStorageMock";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const { mockPingUrl, mockInit } = vi.hoisted(() => ({
  mockPingUrl: vi.fn(),
  mockInit: vi.fn(),
}));

vi.mock("@/services/defaultServices", () => ({
  defaultApiClient: { pingUrl: mockPingUrl, init: mockInit },
}));

vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/components/tasks/RightFilterPanel");
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const TEST_URL = "https://script.google.com/macros/s/abc/exec";
const TEST_DEPLOYMENT_ID = "AKfycbxTestDeploymentId";

function renderPage() {
  return render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );
}

describe("SetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("when no URL is configured", () => {
    it("should render URL input", () => {
      renderPage();
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });

    it("should render connect button", () => {
      renderPage();
      expect(screen.getByTestId("setup-connect-button")).toBeInTheDocument();
    });

    it("should disable connect button when URL input is empty", () => {
      renderPage();
      expect(screen.getByTestId("setup-connect-button")).toBeDisabled();
    });

    it("should enable connect button when URL is entered", () => {
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      expect(screen.getByTestId("setup-connect-button")).not.toBeDisabled();
    });
  });

  describe("when connecting", () => {
    it("should call pingUrl with the entered full URL", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      expect(mockPingUrl).toHaveBeenCalledWith(TEST_URL);
    });

    it("should build full URL from deployment ID and call pingUrl with it", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_DEPLOYMENT_ID },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      expect(mockPingUrl).toHaveBeenCalledWith(
        `https://script.google.com/macros/s/${TEST_DEPLOYMENT_ID}/exec`,
      );
    });

    it("should save full URL to localStorage when deployment ID is entered", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_DEPLOYMENT_ID },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBe(
          `https://script.google.com/macros/s/${TEST_DEPLOYMENT_ID}/exec`,
        );
      });
    });

    it("should show loading state while pinging", () => {
      mockPingUrl.mockReturnValue(new Promise(() => {}));
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      expect(screen.getByTestId("setup-loading")).toBeInTheDocument();
    });
  });

  describe("when ping succeeds with initialized: true", () => {
    it("should save URL to localStorage", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBe(TEST_URL);
      });
    });

    it("should navigate to inbox", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
      });
    });
  });

  describe("when ping succeeds with initialized: false", () => {
    it("should save URL to localStorage", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBe(TEST_URL);
      });
    });

    it("should show initialize button", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(screen.getByTestId("setup-initialize-button")).toBeInTheDocument();
      });
    });
  });

  describe("when initializing", () => {
    beforeEach(async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => screen.getByTestId("setup-initialize-button"));
    });

    it("should call init when initialize button is clicked", () => {
      mockInit.mockResolvedValue({ ok: true });
      fireEvent.click(screen.getByTestId("setup-initialize-button"));
      expect(mockInit).toHaveBeenCalled();
    });

    it("should navigate to inbox after successful initialization", async () => {
      mockInit.mockResolvedValue({ ok: true });
      fireEvent.click(screen.getByTestId("setup-initialize-button"));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
      });
    });

    it("should show error message when init fails", async () => {
      mockInit.mockRejectedValue(new Error("init failed"));
      fireEvent.click(screen.getByTestId("setup-initialize-button"));
      await waitFor(() => {
        expect(screen.getByTestId("setup-error")).toBeInTheDocument();
      });
    });
  });

  describe("when ping fails", () => {
    it("should show error message", async () => {
      mockPingUrl.mockRejectedValue(new Error("connection failed"));
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(screen.getByTestId("setup-error")).toBeInTheDocument();
      });
    });

    it("should not save URL to localStorage", async () => {
      mockPingUrl.mockRejectedValue(new Error("connection failed"));
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => screen.getByTestId("setup-error"));
      expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBeNull();
    });
  });

  describe("when URL is already configured", () => {
    const EXISTING_URL = "https://script.google.com/macros/s/existing/exec";

    beforeEach(() => {
      localStorage.setItem(STORAGE_KEYS.GAS_URL, EXISTING_URL);
    });

    it("should show current URL", () => {
      renderPage();
      expect(screen.getByTestId("setup-current-url")).toBeInTheDocument();
    });

    it("should show disconnect button", () => {
      renderPage();
      expect(screen.getByTestId("setup-disconnect-button")).toBeInTheDocument();
    });

    it("should clear URL from localStorage when disconnect is clicked", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBeNull();
    });

    it("should show input form after disconnecting", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });
  });
});
