import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettings } from "./useSettings";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
  }),
}));
import type { SettingsService } from "@/services/SettingsService";
import { ACCENT_COLORS, BOX, DEFAULT_ACCENT_COLOR, SETTING_KEYS, STORAGE_KEYS } from "@/constants";
import type { AccentColor } from "@/types/common";

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

  it("should call set with SETTING_KEYS.DEFAULT_BOX when setDefaultBox is called", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDefaultBox(BOX.WEEK);
    });

    expect(mockSettingsService.set).toHaveBeenCalledWith(SETTING_KEYS.DEFAULT_BOX, BOX.WEEK);
    expect(mockSettingsService.getDefaultBox).toHaveBeenCalledTimes(2);
  });

  it("should call set with SETTING_KEYS.ACCENT_COLOR when setAccentColor is called", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setAccentColor("orange");
    });

    expect(mockSettingsService.set).toHaveBeenCalledWith(SETTING_KEYS.ACCENT_COLOR, "orange");
    expect(mockSettingsService.getAccentColor).toHaveBeenCalledTimes(2);
  });

  it("should update defaultBox state after setDefaultBox is called", async () => {
    mockSettingsService = createMockSettingsService({
      getDefaultBox: vi.fn()
        .mockResolvedValueOnce(BOX.INBOX)
        .mockResolvedValueOnce(BOX.WEEK),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDefaultBox(BOX.WEEK);
    });

    expect(result.current.defaultBox).toBe(BOX.WEEK);
  });

  it("should update accentColor state after setAccentColor is called", async () => {
    mockSettingsService = createMockSettingsService({
      getAccentColor: vi.fn()
        .mockResolvedValueOnce(DEFAULT_ACCENT_COLOR)
        .mockResolvedValueOnce("purple"),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setAccentColor("purple");
    });

    expect(result.current.accentColor).toBe("purple");
  });

  it("should use STORAGE_KEYS.DEFAULT_BOX constant (not 'default_box' magic string)", () => {
    expect(STORAGE_KEYS.DEFAULT_BOX).toBe("default_box");
  });

  it("should use STORAGE_KEYS.ACCENT_COLOR constant (not 'accent_color' magic string)", () => {
    expect(STORAGE_KEYS.ACCENT_COLOR).toBe("accent_color");
  });

  it("should reload settings when settingsService changes", async () => {
    const firstService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(BOX.INBOX),
    });
    const secondService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(BOX.WEEK),
    });
    const { result, rerender } = renderHook(
      ({ service }: { service: SettingsService }) => useSettings(service),
      { initialProps: { service: firstService } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ service: secondService });
    await waitFor(() => expect(result.current.defaultBox).toBe(BOX.WEEK));
    expect(secondService.getDefaultBox).toHaveBeenCalled();
  });

  it.each(ACCENT_COLORS)("should accept '%s' as valid accent color", async (color: AccentColor) => {
    mockSettingsService = createMockSettingsService({
      getAccentColor: vi.fn().mockResolvedValue(color),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.accentColor).toBe(color);
  });

  it.each([BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER])("should accept '%s' as valid default box", async (box) => {
    mockSettingsService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(box),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultBox).toBe(box);
  });
});
