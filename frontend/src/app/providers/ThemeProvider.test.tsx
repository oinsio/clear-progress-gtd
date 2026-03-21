import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider } from "./ThemeProvider";

const { syncVersionStore, mockGetValue } = vi.hoisted(() => ({
  syncVersionStore: { version: 0 },
  mockGetValue: vi.fn(),
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: syncVersionStore.version,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
  }),
}));

vi.mock("@/db/repositories/SettingsRepository", () => ({
  SettingsRepository: vi.fn(() => ({
    getValue: mockGetValue,
    set: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe("ThemeProvider", () => {
  beforeEach(() => {
    syncVersionStore.version = 0;
    mockGetValue.mockReset();
    document.documentElement.removeAttribute("data-accent");
  });

  it("should apply accent color from IndexedDB on mount", async () => {
    mockGetValue.mockResolvedValue("orange");

    render(<ThemeProvider><div /></ThemeProvider>);

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-accent")).toBe("orange");
    });
  });

  it("should re-read and apply accent color when syncVersion changes", async () => {
    mockGetValue
      .mockResolvedValueOnce("green")
      .mockResolvedValueOnce("purple");

    const { rerender } = render(<ThemeProvider><div /></ThemeProvider>);
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-accent")).toBe("green"),
    );

    syncVersionStore.version = 1;
    rerender(<ThemeProvider><div /></ThemeProvider>);

    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-accent")).toBe("purple"),
    );
  });
});
