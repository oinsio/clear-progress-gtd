import type { PendingCoverRecord, CoverRecord } from "@/types/entities";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { ApiClient } from "./ApiClient";
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
    for (const pendingCover of pendingCovers) {
      try {
        await this.uploadPendingCover(pendingCover);
      } catch {
        break;
      }
    }
  }

  async fullSync(): Promise<void> {
    await this.sync();
    await this.ensureServerCoversAreCached();
  }

  async reuploadLocalCovers(): Promise<void> {
    const activeGoals = await this.goalRepository.getActive();
    for (const goal of activeGoals) {
      if (!goal.cover_file_id || goal.cover_file_id.startsWith(LOCAL_COVER_ID_PREFIX)) {
        continue;
      }
      let existingCover = await this.coverRepository.getByFileId(goal.cover_file_id);
      if (!existingCover?.data) {
        await this.cacheFromServer(goal.cover_file_id);
        existingCover = await this.coverRepository.getByFileId(goal.cover_file_id);
      }
      if (!existingCover?.data) continue;
      try {
        const buffer = await existingCover.data.arrayBuffer();
        const base64Data = arrayBufferToBase64(buffer);
        const response = await this.apiClient.uploadCover({
          goal_id: goal.id,
          filename: buildCoverFilename(existingCover.data_hash, existingCover.data.type || FALLBACK_COVER_MIME_TYPE),
          mime_type: existingCover.data.type || FALLBACK_COVER_MIME_TYPE,
          data: base64Data,
        });
        if (response.file_id !== goal.cover_file_id) {
          const now = new Date().toISOString();
          await this.goalRepository.update({
            ...goal,
            cover_file_id: response.file_id,
            version: goal.version + 1,
            updated_at: now,
          });
          await this.coverRepository.save({
            file_id: response.file_id,
            thumbnail_url: "",
            data_hash: existingCover.data_hash,
            data: existingCover.data,
          });
          await this.coverRepository.delete(goal.cover_file_id);
          localCoverCache.transfer(goal.cover_file_id, response.file_id);
        }
      } catch {
        // best-effort: continue with next cover
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
              thumbnail_url: "",
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
        thumbnail_url: "",
        data_hash: dataHash,
        data: blob,
      };
      await this.coverRepository.save(coverRecord);
      return coverRecord;
    } catch {
      return null;
    }
  }

  private async uploadPendingCover(pendingCover: PendingCoverRecord): Promise<void> {
    const buffer = await pendingCover.data.arrayBuffer();
    const base64Data = arrayBufferToBase64(buffer);

    const response = await this.apiClient.uploadCover({
      goal_id: pendingCover.goal_id,
      filename: pendingCover.filename,
      mime_type: pendingCover.mime_type,
      data: base64Data,
    });

    const localFileId = `${LOCAL_COVER_ID_PREFIX}${pendingCover.local_id}`;
    const goal = await this.goalRepository.getById(pendingCover.goal_id);
    if (goal?.cover_file_id === localFileId) {
      const now = new Date().toISOString();
      await this.goalRepository.update({
        ...goal,
        cover_file_id: response.file_id,
        version: goal.version + 1,
        updated_at: now,
      });
    }

    await this.coverRepository.save({
      file_id: response.file_id,
      thumbnail_url: response.thumbnail_url,
      data_hash: pendingCover.data_hash,
      data: pendingCover.data,
    });

    await this.pendingCoverRepository.delete(pendingCover.local_id);
    localCoverCache.transfer(pendingCover.local_id, response.file_id);
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
