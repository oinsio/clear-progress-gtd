import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, screen } from "@testing-library/react";
import { PING_INTERVAL_MS } from "@/constants";

const {
  mockPing,
  mockInit,
  mockPull,
  mockPush,
  mockInitializeLocalCovers,
  mockCoverSync,
} = vi.hoisted(() => ({
  mockPing: vi.fn(),
  mockInit: vi.fn(),
  mockPull: vi.fn(),
  mockPush: vi.fn(),
  mockInitializeLocalCovers: vi.fn(),
  mockCoverSync: vi.fn(),
}));

vi.mock("@/services/ApiClient", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    ping: mockPing,
    init: mockInit,
  })),
}));

vi.mock("@/services/SyncService", () => ({
  SyncService: vi.fn().mockImplementation(() => ({
    pull: mockPull,
    push: mockPush,
  })),
}));

vi.mock("@/services/defaultServices", () => ({
  defaultCoverSyncService: {
    initializeLocalCovers: mockInitializeLocalCovers,
    sync: mockCoverSync,
  },
}));

vi.mock("@/db/repositories/TaskRepository", () => ({ TaskRepository: vi.fn() }));
vi.mock("@/db/repositories/GoalRepository", () => ({ GoalRepository: vi.fn() }));
vi.mock("@/db/repositories/ContextRepository", () => ({ ContextRepository: vi.fn() }));
vi.mock("@/db/repositories/CategoryRepository", () => ({ CategoryRepository: vi.fn() }));
vi.mock("@/db/repositories/ChecklistRepository", () => ({ ChecklistRepository: vi.fn() }));
vi.mock("@/db/repositories/SettingsRepository", () => ({ SettingsRepository: vi.fn() }));

import { SyncProvider, useSync } from "./SyncProvider";

const VALID_PING_INITIALIZED = {
  ok: true,
  app: "Clear Progress",
  version: "1.0",
  initialized: true,
};

const VALID_PING_NOT_INITIALIZED = {
  ok: true,
  app: "Clear Progress",
  version: "1.0",
  initialized: false,
};

function SyncStatusDisplay() {
  const { syncStatus } = useSync();
  return <div data-testid="status">{syncStatus}</div>;
}

function SyncVersionDisplay() {
  const { syncVersion } = useSync();
  return <div data-testid="version">{syncVersion}</div>;
}

function renderProvider() {
  return render(
    <SyncProvider>
      <SyncStatusDisplay />
    </SyncProvider>,
  );
}

function renderProviderWithVersion() {
  return render(
    <SyncProvider>
      <SyncVersionDisplay />
    </SyncProvider>,
  );
}

describe("SyncProvider — ping reconnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockPull.mockResolvedValue(undefined);
    mockPush.mockResolvedValue(undefined);
    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);
    mockInit.mockResolvedValue({ ok: true });
    mockInitializeLocalCovers.mockResolvedValue(undefined);
    mockCoverSync.mockResolvedValue(undefined);

    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start ping interval when navigator is offline on initial pull", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });

    renderProvider();
    await act(async () => {});

    expect(mockPing).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });

    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should start ping interval when pull throws a network error", async () => {
    mockPull.mockRejectedValue(new Error("Network error"));

    renderProvider();
    await act(async () => {});

    expect(mockPing).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });

    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should show offline status when navigator is offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });

    renderProvider();
    await act(async () => {});

    expect(screen.getByTestId("status").textContent).toBe("offline");
  });

  it("should show error status when pull throws a network error", async () => {
    mockPull.mockRejectedValue(new Error("Network error"));

    renderProvider();
    await act(async () => {});

    expect(screen.getByTestId("status").textContent).toBe("error");
  });

  it("should not start duplicate ping intervals when already pinging", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    mockPing.mockRejectedValue(new Error("Still offline"));

    renderProvider();
    await act(async () => {});

    // Advance three ping intervals — interval should fire exactly 3 times, not exponentially
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS * 3);
    });

    expect(mockPing).toHaveBeenCalledTimes(3);
  });

  it("should call push and pull when ping succeeds with initialized=true", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);

    renderProvider();
    await act(async () => {});

    // Initial pull was skipped (offline), clear that call count
    vi.clearAllMocks();
    mockPull.mockResolvedValue(undefined);
    mockPush.mockResolvedValue(undefined);
    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });

    expect(mockInit).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should call init before push and pull when ping returns initialized=false", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    mockPing.mockResolvedValue(VALID_PING_NOT_INITIALIZED);

    const callOrder: string[] = [];
    mockInit.mockImplementation(async () => { callOrder.push("init"); });
    mockPush.mockImplementation(async () => { callOrder.push("push"); });
    mockPull.mockImplementation(async () => { callOrder.push("pull"); });

    renderProvider();
    await act(async () => {});

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });

    expect(callOrder).toEqual(["init", "push", "pull"]);
  });

  it("should continue pinging when ping fails", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    mockPing.mockRejectedValue(new Error("Still unreachable"));

    renderProvider();
    await act(async () => {});

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockPing).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockPing).toHaveBeenCalledTimes(2);
  });

  it("should stop pinging after successful ping", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);

    renderProvider();
    await act(async () => {});

    // First interval fires and ping succeeds
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockPing).toHaveBeenCalledTimes(1);

    // Advance more — interval should be cleared, no more pings
    vi.clearAllMocks();
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS * 3);
    });
    expect(mockPing).not.toHaveBeenCalled();
  });

  it("should trigger immediate ping when browser online event fires", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });

    renderProvider();
    await act(async () => {});

    expect(mockPing).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should expose syncVersion starting at 0", () => {
    renderProviderWithVersion();

    expect(screen.getByTestId("version").textContent).toBe("0");
  });

  it("should increment syncVersion after successful pull", async () => {
    renderProviderWithVersion();
    await act(async () => {});

    expect(screen.getByTestId("version").textContent).toBe("1");
  });

  it("should clear ping interval on unmount", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    mockPing.mockRejectedValue(new Error("offline"));

    const { unmount } = renderProvider();
    await act(async () => {});

    unmount();

    vi.clearAllMocks();
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS * 2);
    });

    expect(mockPing).not.toHaveBeenCalled();
  });
});
