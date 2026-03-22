import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CoverSyncService } from "./CoverSyncService";
import type { ApiClient } from "./ApiClient";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingCoverRecord } from "@/types/entities";
import { localCoverCache } from "./LocalCoverCache";
import { LOCAL_COVER_ID_PREFIX, FALLBACK_COVER_MIME_TYPE } from "@/constants";
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

  describe("reuploadLocalCovers", () => {
    const EXISTING_SERVER_FILE_ID = "existing-server-file-id";
    const NEW_SERVER_FILE_ID = "new-server-file-id";

    function createGoalWithServerCover(overrides: Record<string, unknown> = {}) {
      return {
        id: "goal-reupload",
        title: "Test Goal",
        description: "",
        cover_file_id: EXISTING_SERVER_FILE_ID,
        status: "in_progress" as const,
        sort_order: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 3,
        ...overrides,
      };
    }

    function createCoverRecord(fileId = EXISTING_SERVER_FILE_ID) {
      return {
        file_id: fileId,
        thumbnail_url: buildCoverThumbnailUrl(fileId),
        data_hash: "cover-hash-xyz",
        data: new Blob(["img data"], { type: "image/jpeg" }),
      };
    }

    beforeEach(() => {
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createGoalWithServerCover()]),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(createCoverRecord()),
      });
      mockApiClient = createMockApiClient({
        uploadCover: vi.fn().mockResolvedValue({
          file_id: EXISTING_SERVER_FILE_ID,
          thumbnail_url: buildCoverThumbnailUrl(EXISTING_SERVER_FILE_ID),
          reused: true,
        }),
      });
    });

    it("should skip goals with empty cover_file_id", async () => {
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createGoalWithServerCover({ cover_file_id: "" })]),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
    });

    it("should skip goals with local: cover_file_id prefix", async () => {
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([
          createGoalWithServerCover({ cover_file_id: `${LOCAL_COVER_ID_PREFIX}some-uuid` }),
        ]),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
    });

    it("should skip goals without a cover blob in CoverRepository", async () => {
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue({ file_id: EXISTING_SERVER_FILE_ID, data_hash: "h", thumbnail_url: "", data: undefined }),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
    });

    it("should skip goals with no CoverRecord at all", async () => {
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
    });

    it("should call uploadCover with goal_id and base64 data when blob exists", async () => {
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).toHaveBeenCalledWith(
        expect.objectContaining({ goal_id: "goal-reupload" }),
      );
    });

    it("should form filename as hash prefix + extension matching server format", async () => {
      // cover-hash-xyz → first 12 chars: "cover-hash-x", image/jpeg → jpg
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).toHaveBeenCalledWith(
        expect.objectContaining({ filename: "cover-hash-x.jpg" }),
      );
    });

    it("should use blob.type as mime_type in upload request", async () => {
      const coverWithType = { ...createCoverRecord(), data: new Blob(["img"], { type: "image/png" }) };
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(coverWithType),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).toHaveBeenCalledWith(
        expect.objectContaining({ mime_type: "image/png" }),
      );
    });

    it("should use FALLBACK_COVER_MIME_TYPE when blob.type is empty", async () => {
      const coverWithEmptyType = { ...createCoverRecord(), data: new Blob(["img"], { type: "" }) };
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(coverWithEmptyType),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).toHaveBeenCalledWith(
        expect.objectContaining({ mime_type: FALLBACK_COVER_MIME_TYPE }),
      );
    });

    it("should not update goal when server returns the same file_id (file still alive)", async () => {
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockGoalRepository.update).not.toHaveBeenCalled();
    });

    it("should continue processing other goals when one upload fails", async () => {
      const goals = [
        createGoalWithServerCover({ id: "goal-fail", cover_file_id: "file-fail" }),
        createGoalWithServerCover({ id: "goal-ok", cover_file_id: "file-ok" }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      mockApiClient = createMockApiClient({
        uploadCover: vi.fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({
            file_id: "file-ok",
            thumbnail_url: buildCoverThumbnailUrl("file-ok"),
            reused: true,
          }),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).toHaveBeenCalledTimes(2);
    });

    it("should not update goal when upload fails", async () => {
      mockApiClient = createMockApiClient({
        uploadCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockGoalRepository.update).not.toHaveBeenCalled();
    });

    describe("when server returns a different file_id", () => {
      let coverRecord: ReturnType<typeof createCoverRecord>;

      beforeEach(() => {
        coverRecord = createCoverRecord();
        mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(coverRecord),
        });
        mockApiClient = createMockApiClient({
          uploadCover: vi.fn().mockResolvedValue({
            file_id: NEW_SERVER_FILE_ID,
            thumbnail_url: buildCoverThumbnailUrl(NEW_SERVER_FILE_ID),
            reused: false,
          }),
        });
      });

      it("should update goal cover_file_id (file was lost)", async () => {
        const service = createService();

        await service.reuploadLocalCovers();

        expect(mockGoalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ cover_file_id: NEW_SERVER_FILE_ID }),
        );
      });

      it("should increment goal version", async () => {
        const goalWithVersion = createGoalWithServerCover({ version: 5 });
        mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([goalWithVersion]),
        });
        const service = createService();

        await service.reuploadLocalCovers();

        expect(mockGoalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ version: 6 }),
        );
      });

      it("should save new CoverRecord", async () => {
        const service = createService();

        await service.reuploadLocalCovers();

        expect(mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            file_id: NEW_SERVER_FILE_ID,
            data: coverRecord.data,
            data_hash: coverRecord.data_hash,
          }),
        );
      });

      it("should delete old CoverRecord", async () => {
        const service = createService();

        await service.reuploadLocalCovers();

        expect(mockCoverRepository.delete).toHaveBeenCalledWith(EXISTING_SERVER_FILE_ID);
      });

      it("should transfer localCoverCache entry", async () => {
        const originalUrl = "blob:http://localhost/cover-original";
        localCoverCache.set(EXISTING_SERVER_FILE_ID, originalUrl);
        const service = createService();

        await service.reuploadLocalCovers();

        expect(localCoverCache.get(NEW_SERVER_FILE_ID)).toBe(originalUrl);
        expect(localCoverCache.get(EXISTING_SERVER_FILE_ID)).toBeUndefined();
      });
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

      it("should populate localCoverCache from existing blob", async () => {
        const service = createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_FILE_ID)).toBeDefined();
      });
    });

    describe("when CoverRecord is missing from repository", () => {
      beforeEach(() => {
        mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_FILE_ID)]),
        });
        mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(undefined),
        });
      });

      it("should not attempt to download cover (Service Worker handles caching)", async () => {
        const service = createService();

        await service.fullSync();

        expect(mockCoverRepository.save).not.toHaveBeenCalled();
      });

      it("should not add cover to localCoverCache when no local blob exists", async () => {
        const service = createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_FILE_ID)).toBeUndefined();
      });
    });

    it("should not attempt download when CoverRecord exists without blob data", async () => {
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

      expect(mockCoverRepository.save).not.toHaveBeenCalled();
    });
  });
});
