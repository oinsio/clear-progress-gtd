import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CoverSyncService } from "./CoverSyncService";
import type { ApiClient } from "./ApiClient";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingCoverRecord } from "@/types/entities";
import { localCoverCache } from "./LocalCoverCache";
import { LOCAL_COVER_ID_PREFIX } from "@/constants";
import { buildCoverThumbnailUrl } from "./CoverService";

// jsdom does not implement Blob.prototype.arrayBuffer — polyfill for tests
Object.defineProperty(Blob.prototype, "arrayBuffer", {
  value() {
    return Promise.resolve(new TextEncoder().encode("fake image content").buffer as ArrayBuffer);
  },
  configurable: true,
  writable: true,
});

function createMockApiClient(
  overrides: Partial<Record<keyof ApiClient, unknown>> = {},
): ApiClient {
  return {
    uploadCover: vi.fn().mockResolvedValue({
      file_id: "uploaded-file-id",
      thumbnail_url: buildCoverThumbnailUrl("uploaded-file-id"),
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

function createMockCoverRepository(
  overrides: Partial<Record<keyof CoverRepository, unknown>> = {},
): CoverRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getByHash: vi.fn().mockResolvedValue(undefined),
    getByFileId: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as CoverRepository;
}

function createMockGoalRepository(
  overrides: Partial<Record<keyof GoalRepository, unknown>> = {},
): GoalRepository {
  return {
    getById: vi.fn().mockResolvedValue(undefined),
    getActive: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as GoalRepository;
}

function createPendingCover(overrides: Partial<PendingCoverRecord> = {}): PendingCoverRecord {
  return {
    local_id: "test-local-id",
    goal_id: "test-goal-id",
    data: new Blob(["fake image content"], { type: "image/jpeg" }),
    filename: "cover.jpg",
    mime_type: "image/jpeg",
    data_hash: "test-hash-abc123",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("CoverSyncService", () => {
  let mockApiClient: ApiClient;
  let mockPendingCoverRepository: PendingCoverRepository;
  let mockCoverRepository: CoverRepository;
  let mockGoalRepository: GoalRepository;

  function createService(): CoverSyncService {
    return new CoverSyncService(
      mockApiClient,
      mockPendingCoverRepository,
      mockCoverRepository,
      mockGoalRepository,
    );
  }

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    mockPendingCoverRepository = createMockPendingCoverRepository();
    mockCoverRepository = createMockCoverRepository();
    mockGoalRepository = createMockGoalRepository();
  });

  afterEach(() => {
    localCoverCache.clear();
  });

  describe("initializeLocalCovers", () => {
    it("should create object URLs for covers with blob data in CoverRepository", async () => {
      const coverWithBlob = {
        file_id: "remote-file-id",
        thumbnail_url: buildCoverThumbnailUrl("remote-file-id"),
        data_hash: "hash-abc",
        data: new Blob(["img"], { type: "image/jpeg" }),
      };
      mockCoverRepository = createMockCoverRepository({
        getAll: vi.fn().mockResolvedValue([coverWithBlob]),
      });
      const service = createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("remote-file-id")).toBeDefined();
    });

    it("should create object URLs for all pending covers", async () => {
      const pendingCover = createPendingCover({ local_id: "init-local-id" });
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("init-local-id")).toBeDefined();
    });

    it("should not overwrite existing object URLs in cache", async () => {
      const existingUrl = "blob:http://localhost/existing";
      localCoverCache.set("cached-local-id", existingUrl);
      const pendingCover = createPendingCover({ local_id: "cached-local-id" });
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("cached-local-id")).toBe(existingUrl);
    });
  });

  describe("sync", () => {
    it("should upload pending covers and update goal cover_file_id", async () => {
      const pendingCover = createPendingCover();
      const localFileId = `${LOCAL_COVER_ID_PREFIX}${pendingCover.local_id}`;
      const matchingGoal = {
        id: pendingCover.goal_id,
        title: "Test Goal",
        description: "",
        cover_file_id: localFileId,
        status: "in_progress" as const,
        sort_order: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      };
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(matchingGoal),
      });
      const service = createService();

      await service.sync();

      expect(mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cover_file_id: "uploaded-file-id",
        }),
      );
    });

    it("should delete pending cover after upload", async () => {
      const pendingCover = createPendingCover({ local_id: "to-delete-id" });
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = createService();

      await service.sync();

      expect(mockPendingCoverRepository.delete).toHaveBeenCalledWith("to-delete-id");
    });

    it("should remove local: mapping from cache after upload", async () => {
      const pendingCover = createPendingCover({ local_id: "revoke-local-id" });
      localCoverCache.set("revoke-local-id", "blob:http://localhost/revoke");
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = createService();

      await service.sync();

      expect(localCoverCache.get("revoke-local-id")).toBeUndefined();
    });

    it("should transfer object URL to real file_id in cache after upload", async () => {
      const pendingCover = createPendingCover({ local_id: "transfer-local-id" });
      const originalUrl = "blob:http://localhost/original";
      localCoverCache.set("transfer-local-id", originalUrl);
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = createService();

      await service.sync();

      expect(localCoverCache.get("uploaded-file-id")).toBe(originalUrl);
    });

    it("should save cover blob data and hash to coverRepository after upload", async () => {
      const pendingCover = createPendingCover();
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = createService();

      await service.sync();

      expect(mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          file_id: "uploaded-file-id",
          data: pendingCover.data,
          data_hash: pendingCover.data_hash,
        }),
      );
    });

    it("should stop on first API failure", async () => {
      const pendingCovers = [
        createPendingCover({ local_id: "first-id" }),
        createPendingCover({ local_id: "second-id" }),
      ];
      mockApiClient = createMockApiClient({
        uploadCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue(pendingCovers),
      });
      const service = createService();

      await service.sync();

      expect(mockApiClient.uploadCover).toHaveBeenCalledTimes(1);
    });

    it("should not update goal if cover_file_id no longer matches", async () => {
      const pendingCover = createPendingCover({ local_id: "changed-local-id" });
      const goalWithDifferentCover = {
        id: pendingCover.goal_id,
        title: "Test Goal",
        description: "",
        cover_file_id: "some-other-remote-file-id",
        status: "in_progress" as const,
        sort_order: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 2,
      };
      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goalWithDifferentCover),
      });
      const service = createService();

      await service.sync();

      expect(mockGoalRepository.update).not.toHaveBeenCalled();
    });

  });

  describe("fullSync — ensureServerCoversAreCached", () => {
    const REMOTE_FILE_ID = "remote-file-id-abc";

    function createActiveGoal(coverFileId: string) {
      return {
        id: "goal-1",
        title: "Goal",
        description: "",
        cover_file_id: coverFileId,
        status: "in_progress" as const,
        sort_order: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      };
    }

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(["img"], { type: "image/jpeg" })),
      });
    });

    it("should skip goals with empty cover_file_id", async () => {
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal("")]),
      });
      const service = createService();

      await service.fullSync();

      expect(mockCoverRepository.getByFileId).not.toHaveBeenCalled();
    });

    it("should skip goals with local: cover_file_id", async () => {
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal(`${LOCAL_COVER_ID_PREFIX}some-uuid`)]),
      });
      const service = createService();

      await service.fullSync();

      expect(mockCoverRepository.getByFileId).not.toHaveBeenCalled();
    });

    it("should skip cover if already in localCoverCache", async () => {
      localCoverCache.set(REMOTE_FILE_ID, "blob:http://localhost/cached");
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_FILE_ID)]),
      });
      const service = createService();

      await service.fullSync();

      expect(mockCoverRepository.getByFileId).not.toHaveBeenCalled();
    });

    describe("when CoverRecord with blob already exists in repository", () => {
      beforeEach(() => {
        const existingCover = {
          file_id: REMOTE_FILE_ID,
          thumbnail_url: "https://example.com/thumb",
          data_hash: "existing-hash",
          data: new Blob(["img"], { type: "image/jpeg" }),
        };
        mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_FILE_ID)]),
        });
        mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(existingCover),
        });
      });

      it("should skip cover download", async () => {
        const service = createService();

        await service.fullSync();

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should populate localCoverCache without re-downloading", async () => {
        const service = createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_FILE_ID)).toBeDefined();
      });
    });

    it("should download and save cover when CoverRecord is missing", async () => {
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_FILE_ID)]),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = createService();

      await service.fullSync();

      expect(mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ file_id: REMOTE_FILE_ID }),
      );
    });

    it("should add downloaded cover to localCoverCache", async () => {
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_FILE_ID)]),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = createService();

      await service.fullSync();

      expect(localCoverCache.get(REMOTE_FILE_ID)).toBeDefined();
    });

    describe("when cover download fails", () => {
      beforeEach(() => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_FILE_ID)]),
        });
        mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(undefined),
        });
      });

      it("should not throw (best-effort)", async () => {
        const service = createService();

        await expect(service.fullSync()).resolves.not.toThrow();
      });

      it("should not save cover to repository", async () => {
        const service = createService();

        await service.fullSync();

        expect(mockCoverRepository.save).not.toHaveBeenCalled();
      });
    });

    it("should also download cover when CoverRecord exists without blob data", async () => {
      const coverWithoutBlob = {
        file_id: REMOTE_FILE_ID,
        thumbnail_url: "https://example.com/thumb",
        data_hash: "some-hash",
        // no data field
      };
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_FILE_ID)]),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(coverWithoutBlob),
      });
      const service = createService();

      await service.fullSync();

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
