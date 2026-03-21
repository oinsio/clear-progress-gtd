import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContexts } from "./useContexts";
import type { ContextService } from "@/services/ContextService";
import { buildContext } from "@/test/factories/contextFactory";

const syncState = { version: 0 };

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: syncState.version,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
  }),
}));

function createMockContextService(
  overrides: Partial<Record<keyof ContextService, unknown>> = {},
): ContextService {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ContextService;
}

describe("useContexts", () => {
  let mockContextService: ContextService;

  beforeEach(() => {
    mockContextService = createMockContextService();
    syncState.version = 0;
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useContexts(mockContextService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after contexts are fetched", async () => {
    const { result } = renderHook(() => useContexts(mockContextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no contexts exist", async () => {
    const { result } = renderHook(() => useContexts(mockContextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contexts).toEqual([]);
  });

  it("should return contexts after loading", async () => {
    const contexts = [buildContext(), buildContext()];
    mockContextService = createMockContextService({
      getAll: vi.fn().mockResolvedValue(contexts),
    });
    const { result } = renderHook(() => useContexts(mockContextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contexts).toEqual(contexts);
  });

  it("should call create and refresh when createContext is called", async () => {
    const mockGetAll = vi.fn().mockResolvedValue([]);
    mockContextService = createMockContextService({ getAll: mockGetAll });
    const { result } = renderHook(() => useContexts(mockContextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createContext("@Home");
    });

    expect(mockContextService.create).toHaveBeenCalledWith("@Home");
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it("should call update and refresh when updateContext is called", async () => {
    const context = buildContext();
    const mockGetAll = vi.fn().mockResolvedValue([context]);
    mockContextService = createMockContextService({ getAll: mockGetAll });
    const { result } = renderHook(() => useContexts(mockContextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateContext(context.id, "@Office");
    });

    expect(mockContextService.update).toHaveBeenCalledWith(
      context.id,
      "@Office",
    );
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it("should reload when syncVersion changes", async () => {
    const mockGetAll = vi.fn().mockResolvedValue([]);
    mockContextService = createMockContextService({ getAll: mockGetAll });

    const { rerender } = renderHook(() => useContexts(mockContextService));
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(1));

    syncState.version = 1;
    rerender();

    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(2));
  });

  it("should call softDelete and refresh when deleteContext is called", async () => {
    const context = buildContext();
    const mockGetAll = vi.fn().mockResolvedValue([]);
    mockContextService = createMockContextService({ getAll: mockGetAll });
    const { result } = renderHook(() => useContexts(mockContextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteContext(context.id);
    });

    expect(mockContextService.softDelete).toHaveBeenCalledWith(context.id);
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });
});
