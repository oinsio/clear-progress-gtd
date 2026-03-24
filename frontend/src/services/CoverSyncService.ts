import type { PendingCoverRecord, CoverRecord } from "@/types/entities";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { ApiClient } from "./ApiClient";
import type { UploadCoverBatchItem } from "@/types/api";
import { localCoverCache } from "./LocalCoverCache";
import { LOCAL_COVER_ID_PREFIX, FALLBACK_COVER_MIME_TYPE, MAX_COVER_BATCH_SIZE } from "@/constants";
import { arrayBufferToBase64, buildCoverFilename, computeSha256Hex } from "./CoverService";

export class CoverSyncService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly pendingCoverRepository: PendingCoverRepository,
    private readonly coverRepository: CoverRepository,
    private readonly goalRepository: GoalRepository,
  ) {}

  async initializeLocalCovers(): Promise<void> {
    const [pendingCovers, covers] = await Promise.all([
      this.pendingCoverRepository.getAll(),
      this.coverRepository.getAll(),
    ]);

    for (const cover of covers) {
      if (cover.data && !localCoverCache.get(cover.file_id)) {
        const url = URL.createObjectURL(cover.data);
        localCoverCache.set(cover.file_id, url);
      }
    }

    for (const pendingCover of pendingCovers) {
      if (!localCoverCache.get(pendingCover.local_id)) {
        const url = URL.createObjectURL(pendingCover.data);
        localCoverCache.set(pendingCover.local_id, url);
      }
    }
  }

  async sync(): Promise<void> {
    const pendingCovers = await this.pendingCoverRepository.getAll();

    for (let offset = 0; offset < pendingCovers.length; offset += MAX_COVER_BATCH_SIZE) {
      const chunk = pendingCovers.slice(offset, offset + MAX_COVER_BATCH_SIZE);

      let batchItems: UploadCoverBatchItem[];
      try {
        batchItems = await Promise.all(chunk.map(cover => this.buildBatchItem(cover)));
      } catch {
        break;
      }

      let response;
      try {
        response = await this.apiClient.uploadCovers(batchItems);
      } catch {
        break;
      }

      const pendingByLocalId = new Map(chunk.map(cover => [cover.local_id, cover]));

      for (const result of response.results) {
        if (result.error || !result.file_id) continue;
        const pendingCover = pendingByLocalId.get(result.local_id);
        if (!pendingCover) continue;
        await this.handleSuccessfulUpload(pendingCover, result.file_id);
      }
    }
  }

  async fullSync(): Promise<void> {
    await this.sync();
    await this.ensureServerCoversAreCached();
  }

  async reuploadLocalCovers(): Promise<void> {
    const activeGoals = await this.goalRepository.getActive();

    type BatchEntry = {
      goal: (typeof activeGoals)[number];
      cover: CoverRecord;
      item: UploadCoverBatchItem;
    };

    const batchEntries: BatchEntry[] = [];

    for (const goal of activeGoals) {
      if (!goal.cover_file_id || goal.cover_file_id.startsWith(LOCAL_COVER_ID_PREFIX)) continue;

      let existingCover = await this.coverRepository.getByFileId(goal.cover_file_id);
      if (!existingCover?.data) {
        await this.cacheFromServer(goal.cover_file_id);
        existingCover = await this.coverRepository.getByFileId(goal.cover_file_id);
      }
      if (!existingCover?.data) continue;

      const buffer = await existingCover.data.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);
      const mimeType = existingCover.data.type || FALLBACK_COVER_MIME_TYPE;

      batchEntries.push({
        goal,
        cover: existingCover,
        item: {
          local_id: goal.id,
          goal_id: goal.id,
          filename: buildCoverFilename(existingCover.data_hash, mimeType),
          mime_type: mimeType,
          data: base64Data,
        },
      });
    }

    for (let offset = 0; offset < batchEntries.length; offset += MAX_COVER_BATCH_SIZE) {
      const chunk = batchEntries.slice(offset, offset + MAX_COVER_BATCH_SIZE);

      let response;
      try {
        response = await this.apiClient.uploadCovers(chunk.map(entry => entry.item));
      } catch {
        continue; // best-effort: skip this chunk
      }

      const entryByGoalId = new Map(chunk.map(entry => [entry.goal.id, entry]));

      for (const result of response.results) {
        if (result.error || !result.file_id) continue;
        const entry = entryByGoalId.get(result.goal_id);
        if (!entry || result.file_id === entry.goal.cover_file_id) continue;

        const now = new Date().toISOString();
        await this.goalRepository.update({
          ...entry.goal,
          cover_file_id: result.file_id,
          version: entry.goal.version + 1,
          updated_at: now,
        });
        await this.coverRepository.save({
          file_id: result.file_id,
          data_hash: entry.cover.data_hash,
          data: entry.cover.data,
        });
        await this.coverRepository.delete(entry.goal.cover_file_id);
        localCoverCache.transfer(entry.goal.cover_file_id, result.file_id);
      }
    }
  }

  private readonly inFlightCaches = new Map<string, Promise<void>>();

  async ensureCoverCached(fileId: string): Promise<void> {
    if (localCoverCache.get(fileId)) return;

    const inflightRequest = this.inFlightCaches.get(fileId);
    if (inflightRequest) return inflightRequest;

    const cachePromise = this.fetchAndPopulateCache(fileId).finally(() => {
      this.inFlightCaches.delete(fileId);
    });
    this.inFlightCaches.set(fileId, cachePromise);
    return cachePromise;
  }

  private async fetchAndPopulateCache(fileId: string): Promise<void> {
    const existingCover = await this.coverRepository.getByFileId(fileId);
    if (existingCover?.data) {
      const url = URL.createObjectURL(existingCover.data);
      localCoverCache.set(fileId, url);
      return;
    }
    await this.cacheFromServer(fileId);
  }

  async ensureServerCoversAreCached(): Promise<void> {
    const activeGoals = await this.goalRepository.getActive();
    const uncachedFileIds = activeGoals
      .map(goal => goal.cover_file_id)
      .filter(fileId => fileId && !fileId.startsWith(LOCAL_COVER_ID_PREFIX) && !localCoverCache.get(fileId));

    const missingFromDb: string[] = [];
    for (const fileId of uncachedFileIds) {
      const existingCover = await this.coverRepository.getByFileId(fileId);
      if (existingCover?.data) {
        const url = URL.createObjectURL(existingCover.data);
        localCoverCache.set(fileId, url);
      } else {
        missingFromDb.push(fileId);
      }
    }

    if (missingFromDb.length > 0) {
      await this.batchCacheFromServer(missingFromDb);
    }
  }

  async cacheFromServer(fileId: string): Promise<void> {
    const fetchedCover = await this.fetchFromServerAndStore(fileId);
    if (fetchedCover?.data) {
      const url = URL.createObjectURL(fetchedCover.data);
      localCoverCache.set(fileId, url);
    }
  }

  async batchCacheFromServer(fileIds: string[]): Promise<void> {
    for (let offset = 0; offset < fileIds.length; offset += MAX_COVER_BATCH_SIZE) {
      const chunk = fileIds.slice(offset, offset + MAX_COVER_BATCH_SIZE);
      try {
        const response = await this.apiClient.getCovers(chunk);
        for (const coverResult of response.covers) {
          if (coverResult.error || !coverResult.data) continue;
          try {
            const mimeType = coverResult.mime_type ?? FALLBACK_COVER_MIME_TYPE;
            const blob = base64ToBlob(coverResult.data, mimeType);
            const buffer = await blob.arrayBuffer();
            const dataHash = await computeSha256Hex(buffer);
            const coverRecord: CoverRecord = {
              file_id: coverResult.file_id,
              data_hash: dataHash,
              data: blob,
            };
            await this.coverRepository.save(coverRecord);
            const url = URL.createObjectURL(blob);
            localCoverCache.set(coverResult.file_id, url);
          } catch {
            // best-effort: skip this cover
          }
        }
      } catch {
        // best-effort: skip this chunk
      }
    }
  }

  private async fetchFromServerAndStore(fileId: string): Promise<CoverRecord | null> {
    try {
      const response = await this.apiClient.getCovers([fileId]);
      const coverResult = response.covers[0];
      if (!coverResult || coverResult.error || !coverResult.data) return null;

      const mimeType = coverResult.mime_type ?? FALLBACK_COVER_MIME_TYPE;
      const blob = base64ToBlob(coverResult.data, mimeType);
      const buffer = await blob.arrayBuffer();
      const dataHash = await computeSha256Hex(buffer);
      const coverRecord: CoverRecord = {
        file_id: fileId,
        data_hash: dataHash,
        data: blob,
      };
      await this.coverRepository.save(coverRecord);
      return coverRecord;
    } catch {
      return null;
    }
  }

  private async buildBatchItem(pending: PendingCoverRecord): Promise<UploadCoverBatchItem> {
    const buffer = await pending.data.arrayBuffer();
    const base64Data = arrayBufferToBase64(buffer);
    return {
      local_id: pending.local_id,
      goal_id: pending.goal_id,
      filename: pending.filename,
      mime_type: pending.mime_type,
      data: base64Data,
    };
  }

  private async handleSuccessfulUpload(pendingCover: PendingCoverRecord, fileId: string): Promise<void> {
    const localFileId = `${LOCAL_COVER_ID_PREFIX}${pendingCover.local_id}`;
    const allGoals = await this.goalRepository.getActive();
    const matchingGoals = allGoals.filter(goal => goal.cover_file_id === localFileId);
    const now = new Date().toISOString();
    for (const goal of matchingGoals) {
      await this.goalRepository.update({
        ...goal,
        cover_file_id: fileId,
        version: goal.version + 1,
        updated_at: now,
      });
    }

    await this.coverRepository.save({
      file_id: fileId,
      data_hash: pendingCover.data_hash,
      data: pendingCover.data,
    });

    await this.pendingCoverRepository.delete(pendingCover.local_id);
    localCoverCache.transfer(pendingCover.local_id, fileId);
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}
