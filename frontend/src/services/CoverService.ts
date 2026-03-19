import { MAX_COVER_SIZE_BYTES, COVER_THUMBNAIL_BASE_URL, COVER_THUMBNAIL_SIZE } from "@/constants";
import type { ApiClient } from "./ApiClient";
import type { CoverRepository } from "@/db/repositories/CoverRepository";

const COVER_ERROR = {
  INVALID_TYPE: "INVALID_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
} as const;

export function buildCoverThumbnailUrl(fileId: string): string {
  return `${COVER_THUMBNAIL_BASE_URL}?id=${fileId}&sz=${COVER_THUMBNAIL_SIZE}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export class CoverService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly coverRepository: CoverRepository,
  ) {}

  async uploadCover(
    file: File,
    goalId: string,
  ): Promise<{ file_id: string; thumbnail_url: string }> {
    if (!file.type.startsWith("image/")) {
      throw new Error(COVER_ERROR.INVALID_TYPE);
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      throw new Error(COVER_ERROR.FILE_TOO_LARGE);
    }

    const buffer = await file.arrayBuffer();
    const dataHash = await computeSha256Hex(buffer);

    const existing = await this.coverRepository.getByHash(dataHash);
    if (existing) {
      return { file_id: existing.file_id, thumbnail_url: existing.thumbnail_url };
    }

    const base64Data = arrayBufferToBase64(buffer);
    const response = await this.apiClient.uploadCover({
      goal_id: goalId,
      filename: file.name,
      mime_type: file.type,
      data: base64Data,
    });

    await this.coverRepository.save({
      file_id: response.file_id,
      thumbnail_url: response.thumbnail_url,
      data_hash: dataHash,
    });

    return { file_id: response.file_id, thumbnail_url: response.thumbnail_url };
  }

  async deleteCover(fileId: string): Promise<void> {
    const response = await this.apiClient.deleteCover({ file_id: fileId });
    if (response.deleted) {
      await this.coverRepository.delete(fileId);
    }
  }

  getCoverUrl(fileId: string): string | null {
    if (!fileId) return null;
    return buildCoverThumbnailUrl(fileId);
  }
}
