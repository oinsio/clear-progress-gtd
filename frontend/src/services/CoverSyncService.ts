import type { PendingCoverRecord } from "@/types/entities";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { ApiClient } from "./ApiClient";
import { localCoverCache } from "./LocalCoverCache";
import { LOCAL_COVER_ID_PREFIX } from "@/constants";
import { arrayBufferToBase64 } from "./CoverService";

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
