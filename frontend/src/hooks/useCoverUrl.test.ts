import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useCoverUrl } from "./useCoverUrl";
import { localCoverCache } from "@/services/LocalCoverCache";
import { LOCAL_COVER_ID_PREFIX } from "@/constants";

vi.mock("@/services/defaultServices", () => ({
  defaultCoverSyncService: {
    ensureCoverCached: vi.fn().mockResolvedValue(undefined),
  },
}));

import { defaultCoverSyncService } from "@/services/defaultServices";

const mockEnsureCoverCached = defaultCoverSyncService.ensureCoverCached as ReturnType<typeof vi.fn>;

describe("useCoverUrl", () => {
  afterEach(() => {
    localCoverCache.clear();
    vi.clearAllMocks();
  });

  it("should return null url for empty fileId", () => {
    const { result } = renderHook(() => useCoverUrl(""));
    expect(result.current.url).toBeNull();
  });

  it("should return object URL from cache for cached remote fileId", () => {
    const cachedUrl = "blob:http://localhost/cached";
    localCoverCache.set("remote-id", cachedUrl);

    const { result } = renderHook(() => useCoverUrl("remote-id"));

    expect(result.current.url).toBe(cachedUrl);
  });

  it("should return null for uncached remote fileId (no thumbnail fallback)", () => {
    const { result } = renderHook(() => useCoverUrl("remote-id"));

    expect(result.current.url).toBeNull();
  });

  it("should call ensureCoverCached for uncached remote fileId", () => {
    renderHook(() => useCoverUrl("remote-id-uncached"));

    expect(mockEnsureCoverCached).toHaveBeenCalledWith("remote-id-uncached");
  });

  it("should not call ensureCoverCached for empty fileId", () => {
    renderHook(() => useCoverUrl(""));

    expect(mockEnsureCoverCached).not.toHaveBeenCalled();
  });

  it("should not call ensureCoverCached for local: fileId", () => {
    renderHook(() => useCoverUrl(`${LOCAL_COVER_ID_PREFIX}some-uuid`));

    expect(mockEnsureCoverCached).not.toHaveBeenCalled();
  });

  it("should not call ensureCoverCached when cover already in localCoverCache", () => {
    localCoverCache.set("cached-remote-id", "blob:http://localhost/existing");

    renderHook(() => useCoverUrl("cached-remote-id"));

    expect(mockEnsureCoverCached).not.toHaveBeenCalled();
  });

  it("should call ensureCoverCached once when fileId does not change", () => {
    const { rerender } = renderHook(() => useCoverUrl("stable-id"));
    rerender();
    rerender();

    expect(mockEnsureCoverCached).toHaveBeenCalledTimes(1);
  });

  it("should update url to blob URL after ensureCoverCached resolves and populates cache", async () => {
    let resolveCache!: () => void;
    mockEnsureCoverCached.mockImplementation((fileId: string) => {
      return new Promise<void>((resolve) => {
        resolveCache = () => {
          localCoverCache.set(fileId, "blob:http://localhost/newly-cached");
          resolve();
        };
      });
    });

    const { result } = renderHook(() => useCoverUrl("remote-id-uncached-reactive"));

    expect(result.current.url).toBeNull();

    await act(async () => {
      resolveCache();
    });

    expect(result.current.url).toBe("blob:http://localhost/newly-cached");
  });

  it("should return null for local: fileId not in cache", () => {
    const { result } = renderHook(() => useCoverUrl(`${LOCAL_COVER_ID_PREFIX}nonexistent`));

    expect(result.current.url).toBeNull();
  });

  it("should return cached blob URL for local: fileId in cache", () => {
    localCoverCache.set("some-uuid", "blob:http://localhost/local");

    const { result } = renderHook(() => useCoverUrl(`${LOCAL_COVER_ID_PREFIX}some-uuid`));

    expect(result.current.url).toBe("blob:http://localhost/local");
  });
});
