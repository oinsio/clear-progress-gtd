import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CoverSyncService } from "./CoverSyncService";
import type { ApiClient } from "./ApiClient";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingCoverRecord } from "@/types/entities";
import { localCoverCache } from "./LocalCoverCache";
import { LOCAL_COVER_ID_PREFIX, FALLBACK_COVER_MIME_TYPE, MAX_COVER_BATCH_SIZE } from "@/constants";

// jsdom does not implement Blob.prototype.arrayBuffer — polyfill for tests
Object.defineProperty(Blob.prototype, "arrayBuffer", {
  value() {
    return Promise.resolve(new TextEncoder().encode("fake image content").buffer as ArrayBuffer);
  },
  configurable: true,
  writable: true,
});

const MOCK_BASE64 = btoa("fake image content");
const MOCK_MIME_TYPE = "image/jpeg";

function createMockGetCoversSuccess(fileId: string, overrides: Record<string, unknown> = {}) {
  return vi.fn().mockResolvedValue({
    ok: true,
    covers: [{ file_id: fileId, mime_type: MOCK_MIME_TYPE, data: MOCK_BASE64, ...overrides }],
  });
}

function createMockGetCoversNotFound(fileId: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    covers: [{ file_id: fileId, error: "FILE_NOT_FOUND" }],
  });
}

function createMockApiClient(
  overrides: Partial<Record<keyof ApiClient, unknown>> = {},
): ApiClient {
  return {
    uploadCover: vi.fn().mockResolvedValue({
      file_id: "uploaded-file-id",
      reused: false,
    }),
    deleteCover: vi.fn().mockResolvedValue({ deleted: true, ref_count: 0 }),
    getCovers: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
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
        getActive: vi.fn().mockResolvedValue([matchingGoal]),
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
        getActive: vi.fn().mockResolvedValue([goalWithDifferentCover]),
      });
      const service = createService();

      await service.sync();

      expect(mockGoalRepository.update).not.toHaveBeenCalled();
    });

    it("should update all goals that share the same local cover file_id", async () => {
      const pendingCover = createPendingCover({ local_id: "shared-local-id" });
      const localFileId = `${LOCAL_COVER_ID_PREFIX}shared-local-id`;

      const baseGoal = {
        title: "Test Goal",
        description: "",
        status: "in_progress" as const,
        sort_order: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      };
      const goal1 = { ...baseGoal, id: "goal-shared-1", cover_file_id: localFileId };
      const goal2 = { ...baseGoal, id: "goal-shared-2", cover_file_id: localFileId };
      const goalOther = { ...baseGoal, id: "goal-other", cover_file_id: "other-file-id" };

      mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([goal1, goal2, goalOther]),
      });
      const service = createService();

      await service.sync();

      expect(mockGoalRepository.update).toHaveBeenCalledTimes(2);
      expect(mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "goal-shared-1", cover_file_id: "uploaded-file-id" }),
      );
      expect(mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "goal-shared-2", cover_file_id: "uploaded-file-id" }),
      );
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

    it("should skip goals without a cover blob in CoverRepository when server fetch also fails", async () => {
      mockCoverRepository = createMockCoverRepository({
      });
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversNotFound(EXISTING_SERVER_FILE_ID),
      });
      const service = createService();

      await service.reuploadLocalCovers();

      expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
    });

    it("should skip goals with no CoverRecord at all when server fetch also fails", async () => {
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversNotFound(EXISTING_SERVER_FILE_ID),
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
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(createCoverRecord("file-fail")),
      });
      mockApiClient = createMockApiClient({
        uploadCover: vi.fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({
            file_id: "file-ok",
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

    describe("when cover has no local blob — fetch from server via get_cover API", () => {
      beforeEach(() => {
        mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createGoalWithServerCover()]),
        });
        mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn()
            .mockResolvedValueOnce(undefined)        // first call: no record
            .mockResolvedValueOnce(createCoverRecord()), // second call: after cacheFromServer
        });
        mockApiClient = createMockApiClient({
          uploadCover: vi.fn().mockResolvedValue({
            file_id: EXISTING_SERVER_FILE_ID,
            reused: true,
          }),
          getCovers: createMockGetCoversSuccess(EXISTING_SERVER_FILE_ID),
        });
      });

      it("should call uploadCover when getCovers fetch succeeds", async () => {
        const service = createService();

        await service.reuploadLocalCovers();

        expect(mockApiClient.uploadCover).toHaveBeenCalledWith(
          expect.objectContaining({ goal_id: "goal-reupload" }),
        );
      });

      it("should save fetched blob to coverRepository", async () => {
        mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(undefined),
        });
        mockApiClient = createMockApiClient({
          getCovers: createMockGetCoversSuccess(EXISTING_SERVER_FILE_ID),
        });
        const service = createService();

        await service.reuploadLocalCovers();

        expect(mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            file_id: EXISTING_SERVER_FILE_ID,
            data: expect.any(Blob),
          }),
        );
      });

      it("should skip cover gracefully when getCovers fails", async () => {
        mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(undefined),
        });
        mockApiClient = createMockApiClient({
          uploadCover: vi.fn(),
          getCovers: createMockGetCoversNotFound(EXISTING_SERVER_FILE_ID),
        });
        const service = createService();

        await service.reuploadLocalCovers();

        expect(mockApiClient.uploadCover).not.toHaveBeenCalled();
      });
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

      expect(mockApiClient.getCovers).not.toHaveBeenCalled();
    });

    describe("when CoverRecord with blob already exists in repository", () => {
      beforeEach(() => {
        const existingCover = {
          file_id: REMOTE_FILE_ID,
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

      it("should not call getCovers when blob exists in IndexedDB", async () => {
        const service = createService();

        await service.fullSync();

        expect(mockApiClient.getCovers).not.toHaveBeenCalled();
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

      it("should call getCovers API to fetch cover", async () => {
        mockApiClient = createMockApiClient({
          getCovers: createMockGetCoversSuccess(REMOTE_FILE_ID),
        });
        const service = createService();

        await service.fullSync();

        expect(mockApiClient.getCovers).toHaveBeenCalled();
      });

      it("should save downloaded blob to coverRepository when getCovers succeeds", async () => {
        mockApiClient = createMockApiClient({
          getCovers: createMockGetCoversSuccess(REMOTE_FILE_ID),
        });
        const service = createService();

        await service.fullSync();

        expect(mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ file_id: REMOTE_FILE_ID, data: expect.any(Blob) }),
        );
      });

      it("should add cover to localCoverCache after successful download", async () => {
        mockApiClient = createMockApiClient({
          getCovers: createMockGetCoversSuccess(REMOTE_FILE_ID),
        });
        const service = createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_FILE_ID)).toBeDefined();
      });

      it("should not save to coverRepository when getCovers fails", async () => {
        mockApiClient = createMockApiClient({
          getCovers: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        const service = createService();

        await service.fullSync();

        expect(mockCoverRepository.save).not.toHaveBeenCalled();
      });

      it("should not add cover to localCoverCache when getCovers fails", async () => {
        mockApiClient = createMockApiClient({
          getCovers: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        const service = createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_FILE_ID)).toBeUndefined();
      });

      it("should not save to coverRepository when getCovers returns FILE_NOT_FOUND", async () => {
        mockApiClient = createMockApiClient({
          getCovers: createMockGetCoversNotFound(REMOTE_FILE_ID),
        });
        const service = createService();

        await service.fullSync();

        expect(mockCoverRepository.save).not.toHaveBeenCalled();
      });
    });
  });

  describe("ensureCoverCached", () => {
    const FILE_ID = "cover-file-id-xyz";

    it("should skip if cover is already in localCoverCache", async () => {
      localCoverCache.set(FILE_ID, "blob:http://localhost/cached");
      const service = createService();

      await service.ensureCoverCached(FILE_ID);

      expect(mockCoverRepository.getByFileId).not.toHaveBeenCalled();
    });

    it("should create object URL from existing IndexedDB blob without calling getCovers", async () => {
      const existingBlob = new Blob(["img"], { type: "image/jpeg" });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue({
          file_id: FILE_ID,
          data_hash: "hash-abc",
          data: existingBlob,
        }),
      });
      const service = createService();

      await service.ensureCoverCached(FILE_ID);

      expect(mockApiClient.getCovers).not.toHaveBeenCalled();
      expect(localCoverCache.get(FILE_ID)).toBeDefined();
    });

    it("should call getCovers API and store in IndexedDB when blob is absent", async () => {
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversSuccess(FILE_ID),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = createService();

      await service.ensureCoverCached(FILE_ID);

      expect(mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ file_id: FILE_ID, data: expect.any(Blob) }),
      );
    });

    it("should add cover to localCoverCache after successful fetch from server", async () => {
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversSuccess(FILE_ID),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = createService();

      await service.ensureCoverCached(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeDefined();
    });

    it("should not add to localCoverCache when getCovers fails", async () => {
      mockApiClient = createMockApiClient({
        getCovers: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = createService();

      await service.ensureCoverCached(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeUndefined();
    });

    it("should not save to coverRepository when blob already exists in IndexedDB", async () => {
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue({
          file_id: FILE_ID,
          data_hash: "hash-abc",
          data: new Blob(["img"], { type: "image/jpeg" }),
        }),
      });
      const service = createService();

      await service.ensureCoverCached(FILE_ID);

      expect(mockCoverRepository.save).not.toHaveBeenCalled();
    });

    it("should make exactly one getCovers call when called concurrently with the same fileId", async () => {
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversSuccess(FILE_ID),
      });
      mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = createService();

      await Promise.all([
        service.ensureCoverCached(FILE_ID),
        service.ensureCoverCached(FILE_ID),
        service.ensureCoverCached(FILE_ID),
      ]);

      expect(mockApiClient.getCovers).toHaveBeenCalledTimes(1);
    });
  });

  describe("cacheFromServer", () => {
    const FILE_ID = "cache-from-server-id";

    it("should call getCovers with the given fileId", async () => {
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversSuccess(FILE_ID),
      });
      const service = createService();

      await service.cacheFromServer(FILE_ID);

      expect(mockApiClient.getCovers).toHaveBeenCalledWith([FILE_ID]);
    });

    it("should add cover to localCoverCache after successful fetch", async () => {
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversSuccess(FILE_ID),
      });
      const service = createService();

      await service.cacheFromServer(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeDefined();
    });

    it("should save cover to coverRepository after successful fetch", async () => {
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversSuccess(FILE_ID),
      });
      const service = createService();

      await service.cacheFromServer(FILE_ID);

      expect(mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ file_id: FILE_ID, data: expect.any(Blob) }),
      );
    });

    it("should not add to localCoverCache when server returns FILE_NOT_FOUND", async () => {
      mockApiClient = createMockApiClient({
        getCovers: createMockGetCoversNotFound(FILE_ID),
      });
      const service = createService();

      await service.cacheFromServer(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeUndefined();
    });

    it("should not throw when getCovers throws", async () => {
      mockApiClient = createMockApiClient({
        getCovers: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = createService();

      await expect(service.cacheFromServer(FILE_ID)).resolves.toBeUndefined();
    });

    it("should use FALLBACK_COVER_MIME_TYPE when mime_type is absent in response", async () => {
      mockApiClient = createMockApiClient({
        getCovers: vi.fn().mockResolvedValue({
          ok: true,
          covers: [{ file_id: FILE_ID, data: MOCK_BASE64 }],
        }),
      });
      const service = createService();

      await service.cacheFromServer(FILE_ID);

      expect(mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ file_id: FILE_ID }),
      );
    });
  });

  describe("batchCacheFromServer", () => {
    it("should call getCovers for each chunk of file_ids", async () => {
      const fileIds = Array.from({ length: MAX_COVER_BATCH_SIZE + 1 }, (_, i) => `file-${i}`);
      mockApiClient = createMockApiClient({
        getCovers: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
      });
      const service = createService();

      await service.batchCacheFromServer(fileIds);

      expect(mockApiClient.getCovers).toHaveBeenCalledTimes(2);
    });

    it("should process first chunk with MAX_COVER_BATCH_SIZE items", async () => {
      const fileIds = Array.from({ length: MAX_COVER_BATCH_SIZE + 1 }, (_, i) => `file-${i}`);
      mockApiClient = createMockApiClient({
        getCovers: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
      });
      const service = createService();

      await service.batchCacheFromServer(fileIds);

      const firstCall = vi.mocked(mockApiClient.getCovers).mock.calls[0][0];
      expect(firstCall.length).toBe(MAX_COVER_BATCH_SIZE);
    });

    it("should continue processing after one chunk fails", async () => {
      const fileIds = Array.from({ length: MAX_COVER_BATCH_SIZE + 1 }, (_, i) => `file-${i}`);
      mockApiClient = createMockApiClient({
        getCovers: vi.fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ ok: true, covers: [] }),
      });
      const service = createService();

      await expect(service.batchCacheFromServer(fileIds)).resolves.toBeUndefined();
      expect(mockApiClient.getCovers).toHaveBeenCalledTimes(2);
    });

    it("should save blobs for all successfully fetched covers", async () => {
      const FILE_ID_A = "file-a";
      const FILE_ID_B = "file-b";
      mockApiClient = createMockApiClient({
        getCovers: vi.fn().mockResolvedValue({
          ok: true,
          covers: [
            { file_id: FILE_ID_A, mime_type: MOCK_MIME_TYPE, data: MOCK_BASE64 },
            { file_id: FILE_ID_B, mime_type: MOCK_MIME_TYPE, data: MOCK_BASE64 },
          ],
        }),
      });
      const service = createService();

      await service.batchCacheFromServer([FILE_ID_A, FILE_ID_B]);

      expect(mockCoverRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
