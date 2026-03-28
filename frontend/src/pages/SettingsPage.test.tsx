import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";
import type { UseSettingsReturn } from "@/hooks/useSettings";
import type { AccentColor } from "@/types/common";
import type { Language } from "@/constants";

vi.mock("@/hooks/useSettings");
vi.mock("@/app/providers/ThemeProvider");
vi.mock("@/hooks/useLanguage");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/components/tasks/RightFilterPanel");
vi.mock("@/components/settings/MenuOrderSection");
vi.mock("@/components/settings/ConfirmFullSyncDialog");
vi.mock("@/app/providers/SyncProvider");
vi.mock("@/app/providers/AuthProvider");
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { STORAGE_KEYS } from "@/constants";
import { useSettings } from "@/hooks/useSettings";
import { localStorageMock } from "@/test/mocks/localStorageMock";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSync } from "@/app/providers/SyncProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import { ConfirmFullSyncDialog } from "@/components/settings/ConfirmFullSyncDialog";

const mockUseSettings = vi.mocked(useSettings);
const mockUseTheme = vi.mocked(useTheme);
const mockUseLanguage = vi.mocked(useLanguage);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUseSync = vi.mocked(useSync);
const mockUseAuth = vi.mocked(useAuth);
const mockConfirmFullSyncDialog = vi.mocked(ConfirmFullSyncDialog);

function buildSettingsHook(overrides: Partial<UseSettingsReturn> = {}): UseSettingsReturn {
  return {
    defaultBox: "today",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn().mockResolvedValue(undefined),
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildThemeHook(overrides: { accentColor?: AccentColor; setAccentColor?: ReturnType<typeof vi.fn> } = {}): ReturnType<typeof useTheme> {
  return {
    accentColor: "green",
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    colorScheme: "system",
    setColorScheme: vi.fn(),
    ...overrides,
  };
}

function buildLanguageHook(overrides: { language?: Language; setLanguage?: ReturnType<typeof vi.fn> } = {}): ReturnType<typeof useLanguage> {
  return {
    language: "ru",
    setLanguage: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockUseSettings.mockReturnValue(buildSettingsHook());
    mockUseTheme.mockReturnValue(buildThemeHook());
    mockUseLanguage.mockReturnValue(buildLanguageHook());
    mockUsePanelOpen.mockReturnValue({ isPanelOpen: false, togglePanelOpen: vi.fn() });
    mockUsePanelSide.mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() });
    mockUseSync.mockReturnValue({
      syncStatus: "idle",
      syncVersion: 0,
      lastSyncedAt: null,
      pull: vi.fn(),
      push: vi.fn(),
      schedulePush: vi.fn(),
      triggerFullSync: vi.fn().mockResolvedValue(undefined),
    });
    mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn() });
    mockConfirmFullSyncDialog.mockReturnValue(null);
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("should render the settings page container", () => {
    renderPage();
    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
  });

  it("should render the default box section", () => {
    renderPage();
    expect(screen.getByTestId("settings-default-box")).toBeInTheDocument();
  });

  it("should render all four box options", () => {
    renderPage();
    expect(screen.getByTestId("settings-box-option-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("settings-box-option-today")).toBeInTheDocument();
    expect(screen.getByTestId("settings-box-option-week")).toBeInTheDocument();
    expect(screen.getByTestId("settings-box-option-later")).toBeInTheDocument();
  });

  it("should mark the current default box as active", () => {
    mockUseSettings.mockReturnValue(buildSettingsHook({ defaultBox: "week" }));
    renderPage();
    expect(screen.getByTestId("settings-box-option-week")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("settings-box-option-inbox")).toHaveAttribute("aria-pressed", "false");
  });

  it("should call setDefaultBox when a box option is clicked", async () => {
    const setDefaultBox = vi.fn().mockResolvedValue(undefined);
    mockUseSettings.mockReturnValue(buildSettingsHook({ defaultBox: "today", setDefaultBox }));
    renderPage();
    fireEvent.click(screen.getByTestId("settings-box-option-inbox"));
    expect(setDefaultBox).toHaveBeenCalledWith("inbox");
  });

  it("should render the accent color section", () => {
    renderPage();
    expect(screen.getByTestId("settings-accent-color")).toBeInTheDocument();
  });

  it("should render all eight color options", () => {
    renderPage();
    expect(screen.getByTestId("settings-color-option-coral")).toBeInTheDocument();
    expect(screen.getByTestId("settings-color-option-orange")).toBeInTheDocument();
    expect(screen.getByTestId("settings-color-option-yellow")).toBeInTheDocument();
    expect(screen.getByTestId("settings-color-option-green")).toBeInTheDocument();
    expect(screen.getByTestId("settings-color-option-teal")).toBeInTheDocument();
    expect(screen.getByTestId("settings-color-option-blue")).toBeInTheDocument();
    expect(screen.getByTestId("settings-color-option-indigo")).toBeInTheDocument();
    expect(screen.getByTestId("settings-color-option-purple")).toBeInTheDocument();
  });

  it("should mark the current accent color as active", () => {
    mockUseTheme.mockReturnValue(buildThemeHook({ accentColor: "orange" }));
    renderPage();
    expect(screen.getByTestId("settings-color-option-orange")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("settings-color-option-green")).toHaveAttribute("aria-pressed", "false");
  });

  it("should call setAccentColor when a color option is clicked", () => {
    const setAccentColor = vi.fn().mockResolvedValue(undefined);
    mockUseTheme.mockReturnValue(buildThemeHook({ setAccentColor }));
    renderPage();
    fireEvent.click(screen.getByTestId("settings-color-option-teal"));
    expect(setAccentColor).toHaveBeenCalledWith("teal");
  });

  it("should render the language section with three buttons", () => {
    renderPage();
    expect(screen.getByTestId("settings-language")).toBeInTheDocument();
    expect(screen.getByTestId("settings-language-option-ru")).toBeInTheDocument();
    expect(screen.getByTestId("settings-language-option-en")).toBeInTheDocument();
    expect(screen.getByTestId("settings-language-option-house")).toBeInTheDocument();
  });

  it("should mark the current language as active", () => {
    mockUseLanguage.mockReturnValue(buildLanguageHook({ language: "en" }));
    renderPage();
    expect(screen.getByTestId("settings-language-option-en")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("settings-language-option-ru")).toHaveAttribute("aria-pressed", "false");
  });

  it("should call setLanguage when a language option is clicked", () => {
    const setLanguage = vi.fn();
    mockUseLanguage.mockReturnValue(buildLanguageHook({ setLanguage }));
    renderPage();
    fireEvent.click(screen.getByTestId("settings-language-option-en"));
    expect(setLanguage).toHaveBeenCalledWith("en");
  });

  describe("account section", () => {
    it("should render account section", () => {
      renderPage();
      expect(screen.getByTestId("settings-account")).toBeInTheDocument();
    });

    it("should show sign-in button when not authenticated", () => {
      renderPage();
      expect(screen.getByTestId("settings-sign-in-btn")).toBeInTheDocument();
    });

    it("should not show sign-out button when not authenticated", () => {
      renderPage();
      expect(screen.queryByTestId("settings-sign-out-btn")).not.toBeInTheDocument();
    });

    it("should show user email when authenticated", () => {
      mockUseAuth.mockReturnValue({ accessToken: "token", userEmail: "test@example.com", signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn() });
      renderPage();
      expect(screen.getByTestId("settings-user-email")).toHaveTextContent("test@example.com");
    });

    it("should show sign-out button when authenticated", () => {
      mockUseAuth.mockReturnValue({ accessToken: "token", userEmail: "test@example.com", signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn() });
      renderPage();
      expect(screen.getByTestId("settings-sign-out-btn")).toBeInTheDocument();
    });

    it("should not show sign-in button when authenticated", () => {
      mockUseAuth.mockReturnValue({ accessToken: "token", userEmail: "test@example.com", signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn() });
      renderPage();
      expect(screen.queryByTestId("settings-sign-in-btn")).not.toBeInTheDocument();
    });

    it("should call signIn when sign-in button is clicked", () => {
      const signIn = vi.fn();
      mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn, signOut: vi.fn(), silentRefresh: vi.fn() });
      renderPage();
      fireEvent.click(screen.getByTestId("settings-sign-in-btn"));
      expect(signIn).toHaveBeenCalled();
    });

    it("should call signOut when sign-out button is clicked", () => {
      const signOut = vi.fn();
      mockUseAuth.mockReturnValue({ accessToken: "token", userEmail: "test@example.com", signIn: vi.fn(), signOut, silentRefresh: vi.fn() });
      renderPage();
      fireEvent.click(screen.getByTestId("settings-sign-out-btn"));
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe("sync section", () => {
    it("should render sync section", () => {
      renderPage();
      expect(screen.getByTestId("settings-sync")).toBeInTheDocument();
    });

    it("should show not connected status when no URL is configured", () => {
      renderPage();
      expect(screen.getByTestId("settings-sync-status")).toHaveTextContent("settings.syncNotConnected");
    });

    it("should show connected status when URL is configured", () => {
      localStorageMock.setItem(STORAGE_KEYS.GAS_URL, "https://script.google.com/macros/s/abc/exec");
      renderPage();
      expect(screen.getByTestId("settings-sync-status")).toHaveTextContent("settings.syncConnected");
    });

    it("should render configure button", () => {
      renderPage();
      expect(screen.getByTestId("settings-sync-connect")).toBeInTheDocument();
    });

    it("should not render full sync button when backend is not connected", () => {
      renderPage();
      expect(screen.queryByTestId("settings-full-sync-btn")).not.toBeInTheDocument();
    });

    it("should render full sync button when backend is connected", () => {
      localStorageMock.setItem(STORAGE_KEYS.GAS_URL, "https://script.google.com/macros/s/abc/exec");
      renderPage();
      expect(screen.getByTestId("settings-full-sync-btn")).toBeInTheDocument();
    });

    it("should open ConfirmFullSyncDialog when full sync button is clicked", () => {
      localStorageMock.setItem(STORAGE_KEYS.GAS_URL, "https://script.google.com/macros/s/abc/exec");
      renderPage();
      fireEvent.click(screen.getByTestId("settings-full-sync-btn"));
      expect(mockConfirmFullSyncDialog).toHaveBeenCalledWith(
        expect.objectContaining({ isOpen: true }),
        expect.anything(),
      );
    });

    it("should pass triggerFullSync as onSync to ConfirmFullSyncDialog", () => {
      localStorageMock.setItem(STORAGE_KEYS.GAS_URL, "https://script.google.com/macros/s/abc/exec");
      const triggerFullSync = vi.fn().mockResolvedValue(undefined);
      mockUseSync.mockReturnValue({
        syncStatus: "idle",
        syncVersion: 0,
        lastSyncedAt: null,
        pull: vi.fn(),
        push: vi.fn(),
        schedulePush: vi.fn(),
        triggerFullSync,
      });
      renderPage();
      fireEvent.click(screen.getByTestId("settings-full-sync-btn"));
      expect(mockConfirmFullSyncDialog).toHaveBeenCalledWith(
        expect.objectContaining({ onSync: triggerFullSync }),
        expect.anything(),
      );
    });
  });
});
