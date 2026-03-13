import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextService } from "./ContextService";
import type { ContextRepository } from "@/db/repositories/ContextRepository";
import { buildContext } from "@/test/factories/contextFactory";

function createMockContextRepository(
  overrides: Partial<Record<keyof ContextRepository, unknown>> = {},
): ContextRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getActive: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    getMaxVersion: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as ContextRepository;
}

describe("ContextService", () => {
  let mockContextRepository: ContextRepository;

  beforeEach(() => {
    mockContextRepository = createMockContextRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no contexts exist", async () => {
      const contextService = new ContextService(mockContextRepository);
      const contexts = await contextService.getAll();
      expect(contexts).toEqual([]);
    });

    it("should return active contexts sorted by sort_order ascending", async () => {
      const unsortedContexts = [
        buildContext({ sort_order: 3 }),
        buildContext({ sort_order: 1 }),
        buildContext({ sort_order: 2 }),
      ];
      mockContextRepository = createMockContextRepository({
        getActive: vi.fn().mockResolvedValue(unsortedContexts),
      });
      const contextService = new ContextService(mockContextRepository);
      const result = await contextService.getAll();
      expect(result[0].sort_order).toBe(1);
      expect(result[1].sort_order).toBe(2);
      expect(result[2].sort_order).toBe(3);
    });

    it("should call getActive on repository", async () => {
      const contextService = new ContextService(mockContextRepository);
      await contextService.getAll();
      expect(mockContextRepository.getActive).toHaveBeenCalledOnce();
    });
  });

  describe("getById", () => {
    it("should return context when found", async () => {
      const context = buildContext();
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const result = await contextService.getById(context.id);
      expect(result).toEqual(context);
    });

    it("should return undefined when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      const result = await contextService.getById("nonexistent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should create context with given name", async () => {
      const contextService = new ContextService(mockContextRepository);
      const context = await contextService.create("@Home");
      expect(context.name).toBe("@Home");
    });

    it("should create context with sort_order 0", async () => {
      const contextService = new ContextService(mockContextRepository);
      const context = await contextService.create("@Home");
      expect(context.sort_order).toBe(0);
    });

    it("should create context with is_deleted false", async () => {
      const contextService = new ContextService(mockContextRepository);
      const context = await contextService.create("@Home");
      expect(context.is_deleted).toBe(false);
    });

    it("should create context with version 1", async () => {
      const contextService = new ContextService(mockContextRepository);
      const context = await contextService.create("@Home");
      expect(context.version).toBe(1);
    });

    it("should create context with a UUID id", async () => {
      const contextService = new ContextService(mockContextRepository);
      const context = await contextService.create("@Home");
      expect(context.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should call repository.create with the constructed context", async () => {
      const contextService = new ContextService(mockContextRepository);
      const context = await contextService.create("@Work");
      expect(mockContextRepository.create).toHaveBeenCalledWith(context);
    });

    it("should return the created context", async () => {
      const contextService = new ContextService(mockContextRepository);
      const context = await contextService.create("@Work");
      expect(context.name).toBe("@Work");
    });
  });

  describe("update", () => {
    it("should update the name of the context", async () => {
      const context = buildContext({ name: "@Home" });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "@Office");
      expect(updated.name).toBe("@Office");
    });

    it("should increment version on update", async () => {
      const context = buildContext({ version: 3 });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "New Name");
      expect(updated.version).toBe(4);
    });

    it("should update updated_at timestamp on update", async () => {
      const context = buildContext({ updated_at: "2025-01-01T00:00:00.000Z" });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "New Name");
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      await expect(
        contextService.update("nonexistent-id", "Name"),
      ).rejects.toThrow("Context not found: nonexistent-id");
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const context = buildContext({ is_deleted: false });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const deleted = await contextService.softDelete(context.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should increment version on soft delete", async () => {
      const context = buildContext({ version: 2 });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const deleted = await contextService.softDelete(context.id);
      expect(deleted.version).toBe(3);
    });

    it("should throw when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      await expect(
        contextService.softDelete("nonexistent-id"),
      ).rejects.toThrow("Context not found: nonexistent-id");
    });
  });
});
