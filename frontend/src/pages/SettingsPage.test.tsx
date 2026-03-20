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
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { STORAGE_KEYS } from "@/constants";
import { useSettings } from "@/hooks/useSettings";
import { localStorageMock } from "@/test/mocks/localStorageMock";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";

const mockUseSettings = vi.mocked(useSettings);
const mockUseTheme = vi.mocked(useTheme);
const mockUseLanguage = vi.mocked(useLanguage);

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

  it("should render the language section with two buttons", () => {
    renderPage();
    expect(screen.getByTestId("settings-language")).toBeInTheDocument();
    expect(screen.getByTestId("settings-language-option-ru")).toBeInTheDocument();
    expect(screen.getByTestId("settings-language-option-en")).toBeInTheDocument();
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
  });
});
