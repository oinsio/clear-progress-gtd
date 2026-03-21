import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, screen, fireEvent } from "@testing-library/react";
import { PING_INTERVAL_MS, SYNC_INTERVAL_MS, SYNC_DEBOUNCE_MS } from "@/constants";

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

function SyncMethodTrigger({ method }: { method: "pull" | "push" }) {
  const syncCtx = useSync();
  return (
    <button data-testid={`${method}-btn`} onClick={() => void syncCtx[method]()}>
      {method}
    </button>
  );
}

function SchedulePushTrigger() {
  const { schedulePush } = useSync();
  return (
    <button data-testid="schedule-btn" onClick={schedulePush}>
      schedule
    </button>
  );
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

function renderProviderWithMethod(method: "pull" | "push") {
  return render(
    <SyncProvider>
      <SyncMethodTrigger method={method} />
    </SyncProvider>,
  );
}

function renderProviderWithScheduler() {
  return render(
    <SyncProvider>
      <SchedulePushTrigger />
    </SyncProvider>,
  );
}

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

describe("SyncProvider — ping reconnect", () => {
  it("should start ping interval when navigator is offline on initial sync", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });

    renderProvider();
    await act(async () => {});

    expect(mockPing).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });

    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should start ping interval when sync throws a network error", async () => {
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

  it("should show error status when sync throws a network error", async () => {
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

    // Initial sync was skipped (offline), clear that call count
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

  it("should increment syncVersion after successful sync", async () => {
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

describe("SyncProvider — push+pull pairing", () => {
  it("should call push before pull on initial sync", async () => {
    const callOrder: string[] = [];
    mockPush.mockImplementation(async () => { callOrder.push("push"); });
    mockPull.mockImplementation(async () => { callOrder.push("pull"); });

    renderProvider();
    await act(async () => {});

    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should call push before pull on periodic interval sync", async () => {
    renderProvider();
    await act(async () => {});

    const callOrder: string[] = [];
    mockPush.mockImplementation(async () => { callOrder.push("push"); });
    mockPull.mockImplementation(async () => { callOrder.push("pull"); });

    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });

    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should call push before pull when pull() context method is invoked", async () => {
    renderProviderWithMethod("pull");
    await act(async () => {});

    const callOrder: string[] = [];
    mockPush.mockImplementation(async () => { callOrder.push("push"); });
    mockPull.mockImplementation(async () => { callOrder.push("pull"); });

    await act(async () => {
      fireEvent.click(screen.getByTestId("pull-btn"));
    });

    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should call pull after push when push() context method is invoked", async () => {
    renderProviderWithMethod("push");
    await act(async () => {});

    const callOrder: string[] = [];
    mockPush.mockImplementation(async () => { callOrder.push("push"); });
    mockPull.mockImplementation(async () => { callOrder.push("pull"); });

    await act(async () => {
      fireEvent.click(screen.getByTestId("push-btn"));
    });

    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should increment syncVersion after periodic sync", async () => {
    renderProviderWithVersion();
    await act(async () => {});
    // syncVersion is 1 after mount sync

    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });

    expect(screen.getByTestId("version").textContent).toBe("2");
  });
});

describe("SyncProvider — schedulePush", () => {
  it("should not call push immediately when schedulePush is triggered", async () => {
    renderProviderWithScheduler();
    await act(async () => {});

    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockPull.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should call push and pull after SYNC_DEBOUNCE_MS when schedulePush is triggered", async () => {
    renderProviderWithScheduler();
    await act(async () => {});

    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockPull.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });

    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should call push before pull when schedulePush fires", async () => {
    renderProviderWithScheduler();
    await act(async () => {});

    const callOrder: string[] = [];
    mockPush.mockImplementation(async () => { callOrder.push("push"); });
    mockPull.mockImplementation(async () => { callOrder.push("pull"); });

    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });

    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });

    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should reset debounce timer when schedulePush is called multiple times", async () => {
    renderProviderWithScheduler();
    await act(async () => {});

    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockPull.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });

    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS - 1000);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });

    // First debounce window has passed but timer was reset — push should not have fired
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should clear debounce timer on unmount without triggering push", async () => {
    const { unmount } = renderProviderWithScheduler();
    await act(async () => {});

    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
