import type { PendingCoverRecord } from "@/types/entities";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { ApiClient } from "./ApiClient";
import { localCoverCache } from "./LocalCoverCache";
import { LOCAL_COVER_ID_PREFIX, FALLBACK_COVER_MIME_TYPE } from "@/constants";
import { arrayBufferToBase64, buildCoverThumbnailUrl, computeSha256Hex } from "./CoverService";

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
      const existingCover = await this.coverRepository.getByFileId(goal.cover_file_id);
      if (!existingCover?.data) {
        continue;
      }
      try {
        const buffer = await existingCover.data.arrayBuffer();
        const base64Data = arrayBufferToBase64(buffer);
        const response = await this.apiClient.uploadCover({
          goal_id: goal.id,
          filename: `cover_${goal.id}`,
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
            thumbnail_url: response.thumbnail_url,
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

  async ensureServerCoversAreCached(): Promise<void> {
    const activeGoals = await this.goalRepository.getActive();
    for (const goal of activeGoals) {
      if (!goal.cover_file_id || goal.cover_file_id.startsWith(LOCAL_COVER_ID_PREFIX)) {
        continue;
      }
      if (localCoverCache.get(goal.cover_file_id)) {
        continue;
      }
      const existingCover = await this.coverRepository.getByFileId(goal.cover_file_id);
      if (existingCover?.data) {
        const url = URL.createObjectURL(existingCover.data);
        localCoverCache.set(goal.cover_file_id, url);
        continue;
      }
      try {
        await this.downloadAndCacheCover(goal.cover_file_id);
      } catch {
        // best-effort: cover will display from thumbnail URL when online
      }
    }
  }

  private async downloadAndCacheCover(fileId: string): Promise<void> {
    const thumbnailUrl = buildCoverThumbnailUrl(fileId);
    const response = await fetch(thumbnailUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const dataHash = await computeSha256Hex(buffer);
    await this.coverRepository.save({ file_id: fileId, thumbnail_url: thumbnailUrl, data_hash: dataHash, data: blob });
    const url = URL.createObjectURL(blob);
    localCoverCache.set(fileId, url);
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
