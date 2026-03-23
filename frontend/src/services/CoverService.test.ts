import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CoverService, buildCoverFilename, buildCoverThumbnailUrl, getCoverDisplayUrl } from "./CoverService";
import type { ApiClient } from "./ApiClient";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { MAX_COVER_SIZE_BYTES } from "@/constants";
import { localCoverCache } from "./LocalCoverCache";

const FAKE_ARRAY_BUFFER = new TextEncoder().encode("fake image content").buffer as ArrayBuffer;

// jsdom does not implement File.prototype.arrayBuffer — add polyfill for tests
Object.defineProperty(File.prototype, "arrayBuffer", {
  value() {
    return Promise.resolve(FAKE_ARRAY_BUFFER);
  },
  configurable: true,
  writable: true,
});

function createImageFile(opts: { name?: string; type?: string; size?: number } = {}): File {
  const { name = "cover.jpg", type = "image/jpeg", size } = opts;
  const content = size ? new Uint8Array(size) : new TextEncoder().encode("fake image content");
  return new File([content], name, { type });
}

function createMockCoverRepository(
  overrides: Partial<Record<keyof CoverRepository, unknown>> = {},
): CoverRepository {
  return {
    getByHash: vi.fn().mockResolvedValue(undefined),
    getByFileId: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as CoverRepository;
}

function createMockPendingCoverRepository(
  overrides: Partial<Record<keyof PendingCoverRepository, unknown>> = {},
): PendingCoverRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    getByHash: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as PendingCoverRepository;
}

function createMockApiClient(
  overrides: Partial<Record<keyof ApiClient, unknown>> = {},
): ApiClient {
  return {
    uploadCover: vi.fn().mockResolvedValue({
      file_id: "new-file-id",
      thumbnail_url: buildCoverThumbnailUrl("new-file-id"),
      reused: false,
    }),
    deleteCover: vi.fn().mockResolvedValue({ deleted: true, ref_count: 0 }),
    ping: vi.fn(),
    init: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    ...overrides,
  } as ApiClient;
}

describe("buildCoverFilename", () => {
  it("should use first 12 chars of hash and jpeg → jpg extension", () => {
    expect(buildCoverFilename("abcdef012345678901", "image/jpeg")).toBe("abcdef012345.jpg");
  });

  it("should preserve png extension", () => {
    expect(buildCoverFilename("abcdef012345678901", "image/png")).toBe("abcdef012345.png");
  });

  it("should preserve webp extension", () => {
    expect(buildCoverFilename("abcdef012345678901", "image/webp")).toBe("abcdef012345.webp");
  });

  it("should fall back to jpg when mime subtype is empty", () => {
    expect(buildCoverFilename("abcdef012345678901", "image/")).toBe("abcdef012345.jpg");
  });

  it("should fall back to jpg when mime type is unrecognizable", () => {
    expect(buildCoverFilename("abcdef012345678901", "")).toBe("abcdef012345.jpg");
  });
});

describe("CoverService", () => {
  let mockApiClient: ApiClient;
  let mockCoverRepository: CoverRepository;
  let mockPendingCoverRepository: PendingCoverRepository;

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    mockCoverRepository = createMockCoverRepository();
    mockPendingCoverRepository = createMockPendingCoverRepository();
  });

  afterEach(() => {
    localCoverCache.clear();
  });

  describe("uploadCover", () => {
    it("should throw INVALID_TYPE if file is not an image", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);
      const file = createImageFile({ type: "application/pdf" });
      await expect(service.uploadCover(file, "goal-1")).rejects.toThrow("INVALID_TYPE");
    });

    it("should throw FILE_TOO_LARGE if file exceeds MAX_COVER_SIZE_BYTES", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);
      const file = createImageFile({ size: MAX_COVER_SIZE_BYTES + 1 });
      await expect(service.uploadCover(file, "goal-1")).rejects.toThrow("FILE_TOO_LARGE");
    });

    it("should return cached cover without API call if same hash exists in DB", async () => {
      const cached = {
        file_id: "cached-id",
        thumbnail_url: buildCoverThumbnailUrl("cached-id"),
        data_hash: "any-hash",
      };
      mockCoverRepository = createMockCoverRepository({
        getByHash: vi.fn().mockResolvedValue(cached),
      });
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      const result = await service.uploadCover(createImageFile(), "goal-1");

      expect(result.file_id).toBe("cached-id");
      expect(result.thumbnail_url).toBe(buildCoverThumbnailUrl("cached-id"));
      expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
    });

    it("should call API when no cached cover exists for the hash", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.uploadCover(createImageFile(), "goal-1");

      expect(mockApiClient.uploadCover).toHaveBeenCalledWith(
        expect.objectContaining({
          goal_id: "goal-1",
          filename: "cover.jpg",
          mime_type: "image/jpeg",
          data: expect.any(String),
        }),
      );
    });

    it("should save cover record to DB after successful upload", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.uploadCover(createImageFile(), "goal-1");

      expect(mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          file_id: "new-file-id",
          thumbnail_url: buildCoverThumbnailUrl("new-file-id"),
          data_hash: expect.any(String),
        }),
      );
    });

    it("should save blob data to cover record after successful online upload", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.uploadCover(createImageFile(), "goal-1");

      expect(mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Blob),
        }),
      );
    });

    it("should add blob URL to localCoverCache after successful online upload", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.uploadCover(createImageFile(), "goal-1");

      expect(localCoverCache.get("new-file-id")).toBeDefined();
    });

    it("should return file_id and thumbnail_url from API response", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      const result = await service.uploadCover(createImageFile(), "goal-1");

      expect(result.file_id).toBe("new-file-id");
      expect(result.thumbnail_url).toBe(buildCoverThumbnailUrl("new-file-id"));
    });

    it("should not save to DB when reusing cached cover", async () => {
      const cached = {
        file_id: "cached-id",
        thumbnail_url: buildCoverThumbnailUrl("cached-id"),
        data_hash: "any-hash",
      };
      mockCoverRepository = createMockCoverRepository({
        getByHash: vi.fn().mockResolvedValue(cached),
      });
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.uploadCover(createImageFile(), "goal-1");

      expect(mockCoverRepository.save).not.toHaveBeenCalled();
    });

    it("should save locally when API fails with network error", async () => {
      mockApiClient = createMockApiClient({
        uploadCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.uploadCover(createImageFile(), "goal-1");

      expect(mockPendingCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          goal_id: "goal-1",
          filename: "cover.jpg",
          mime_type: "image/jpeg",
          data_hash: expect.any(String),
        }),
      );
    });

    it("should return local:* file_id when saved locally", async () => {
      mockApiClient = createMockApiClient({
        uploadCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      const result = await service.uploadCover(createImageFile(), "goal-1");

      expect(result.file_id).toMatch(/^local:/);
    });

    it("should not save locally for INVALID_TYPE error", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);
      const file = createImageFile({ type: "application/pdf" });

      await expect(service.uploadCover(file, "goal-1")).rejects.toThrow("INVALID_TYPE");

      expect(mockPendingCoverRepository.save).not.toHaveBeenCalled();
    });

    it("should not save locally for FILE_TOO_LARGE error", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);
      const file = createImageFile({ size: MAX_COVER_SIZE_BYTES + 1 });

      await expect(service.uploadCover(file, "goal-1")).rejects.toThrow("FILE_TOO_LARGE");

      expect(mockPendingCoverRepository.save).not.toHaveBeenCalled();
    });

    it("should return existing local cover when same hash in pendingCoverRepository", async () => {
      const existingLocalId = "existing-local-uuid";
      const existingObjectUrl = "blob:http://localhost/existing";
      localCoverCache.set(existingLocalId, existingObjectUrl);
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getByHash: vi.fn().mockResolvedValue({
          local_id: existingLocalId,
          goal_id: "goal-1",
          data: new Blob(["fake"]),
          filename: "cover.jpg",
          mime_type: "image/jpeg",
          data_hash: "some-hash",
          created_at: new Date().toISOString(),
        }),
      });
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      const result = await service.uploadCover(createImageFile(), "goal-1");

      expect(result.file_id).toBe(`local:${existingLocalId}`);
      expect(result.thumbnail_url).toBe(existingObjectUrl);
      expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
    });
  });

  describe("deleteCover", () => {
    it("should call API deleteCover with the file_id", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.deleteCover("file-abc");

      expect(mockApiClient.deleteCover).toHaveBeenCalledWith({ file_id: "file-abc" });
    });

    it("should remove local record from DB when backend confirms deletion", async () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.deleteCover("file-abc");

      expect(mockCoverRepository.delete).toHaveBeenCalledWith("file-abc");
    });

    it("should keep local record when backend says not deleted (ref_count > 0)", async () => {
      mockApiClient = createMockApiClient({
        deleteCover: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
      });
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.deleteCover("file-abc");

      expect(mockCoverRepository.delete).not.toHaveBeenCalled();
    });

    it("should remove cover URL from localCoverCache when backend confirms deletion", async () => {
      localCoverCache.set("file-abc", "blob:http://localhost/abc");
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.deleteCover("file-abc");

      expect(localCoverCache.get("file-abc")).toBeUndefined();
    });

    it("should not remove cover from localCoverCache when backend says not deleted", async () => {
      localCoverCache.set("file-abc", "blob:http://localhost/abc");
      mockApiClient = createMockApiClient({
        deleteCover: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
      });
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);

      await service.deleteCover("file-abc");

      expect(localCoverCache.get("file-abc")).toBeDefined();
    });
  });

  describe("getCoverUrl", () => {
    it("should return null for empty fileId", () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);
      expect(service.getCoverUrl("")).toBeNull();
    });

    it("should return built thumbnail URL for non-empty fileId", () => {
      const service = new CoverService(mockApiClient, mockCoverRepository, mockPendingCoverRepository);
      const url = service.getCoverUrl("file-123");
      expect(url).toBe(buildCoverThumbnailUrl("file-123"));
    });
  });

  describe("buildCoverThumbnailUrl", () => {
    it("should build a Google Drive thumbnail URL", () => {
      const url = buildCoverThumbnailUrl("abc123");
      expect(url).toBe("https://drive.google.com/thumbnail?id=abc123&sz=w400");
    });
  });

  describe("getCoverDisplayUrl", () => {
    it("should return null for empty fileId", () => {
      expect(getCoverDisplayUrl("")).toBeNull();
    });

    it("should return object URL from cache for local:* fileId", () => {
      localCoverCache.set("some-local-id", "blob:http://localhost/test");
      const result = getCoverDisplayUrl("local:some-local-id");
      expect(result).toBe("blob:http://localhost/test");
    });

    it("should return null for local:* fileId not in cache", () => {
      const result = getCoverDisplayUrl("local:nonexistent-id");
      expect(result).toBeNull();
    });

    it("should return null for regular remote fileId not in cache", () => {
      const result = getCoverDisplayUrl("remote-file-id");
      expect(result).toBeNull();
    });

    it("should return cached object URL for remote fileId if present in cache", () => {
      localCoverCache.set("uploaded-remote-id", "blob:http://localhost/transferred");
      const result = getCoverDisplayUrl("uploaded-remote-id");
      expect(result).toBe("blob:http://localhost/transferred");
    });
  });
});
