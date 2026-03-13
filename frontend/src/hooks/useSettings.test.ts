import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettings } from "./useSettings";
import type { SettingsService } from "@/services/SettingsService";
import { BOX, DEFAULT_ACCENT_COLOR } from "@/constants";

function createMockSettingsService(
  overrides: Partial<Record<keyof SettingsService, unknown>> = {},
): SettingsService {
  return {
    getDefaultBox: vi.fn().mockResolvedValue(BOX.INBOX),
    getAccentColor: vi.fn().mockResolvedValue(DEFAULT_ACCENT_COLOR),
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SettingsService;
}

describe("useSettings", () => {
  let mockSettingsService: SettingsService;

  beforeEach(() => {
    mockSettingsService = createMockSettingsService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after settings are loaded", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return default box after loading", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultBox).toBe(BOX.INBOX);
  });

  it("should return accent color after loading", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.accentColor).toBe(DEFAULT_ACCENT_COLOR);
  });

  it("should call service with configured default box", async () => {
    mockSettingsService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(BOX.TODAY),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultBox).toBe(BOX.TODAY);
  });

  it("should call set and refresh when setDefaultBox is called", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDefaultBox(BOX.WEEK);
    });

    expect(mockSettingsService.set).toHaveBeenCalledWith(
      expect.any(String),
      BOX.WEEK,
    );
    expect(mockSettingsService.getDefaultBox).toHaveBeenCalledTimes(2);
  });

  it("should call set and refresh when setAccentColor is called", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setAccentColor("orange");
    });

    expect(mockSettingsService.set).toHaveBeenCalledWith(
      expect.any(String),
      "orange",
    );
    expect(mockSettingsService.getAccentColor).toHaveBeenCalledTimes(2);
  });
});
