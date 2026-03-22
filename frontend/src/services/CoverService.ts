import { MAX_COVER_SIZE_BYTES, COVER_THUMBNAIL_BASE_URL, COVER_THUMBNAIL_SIZE, LOCAL_COVER_ID_PREFIX, COVER_HASH_PREFIX_LENGTH, DEFAULT_COVER_EXTENSION } from "@/constants";
import type { ApiClient } from "./ApiClient";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { localCoverCache } from "./LocalCoverCache";

const COVER_ERROR = {
  INVALID_TYPE: "INVALID_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
} as const;

export function buildCoverThumbnailUrl(fileId: string): string {
  return `${COVER_THUMBNAIL_BASE_URL}?id=${fileId}&sz=${COVER_THUMBNAIL_SIZE}`;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildCoverFilename(dataHash: string, mimeType: string): string {
  const subtype = mimeType.split("/")[1] ?? "";
  const ext = subtype === "jpeg" ? DEFAULT_COVER_EXTENSION : subtype || DEFAULT_COVER_EXTENSION;
  return `${dataHash.substring(0, COVER_HASH_PREFIX_LENGTH)}.${ext}`;
}

export function getCoverDisplayUrl(fileId: string): string | null {
  if (!fileId) return null;
  if (fileId.startsWith(LOCAL_COVER_ID_PREFIX)) {
    const localId = fileId.slice(LOCAL_COVER_ID_PREFIX.length);
    return localCoverCache.get(localId) ?? null;
  }
  return localCoverCache.get(fileId) ?? buildCoverThumbnailUrl(fileId);
}

export class CoverService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly coverRepository: CoverRepository,
    private readonly pendingCoverRepository: PendingCoverRepository,
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

    const existingPending = await this.pendingCoverRepository.getByHash(dataHash);
    if (existingPending) {
      const objectUrl = localCoverCache.get(existingPending.local_id) ?? "";
      return {
        file_id: `${LOCAL_COVER_ID_PREFIX}${existingPending.local_id}`,
        thumbnail_url: objectUrl,
      };
    }

    const existingRemote = await this.coverRepository.getByHash(dataHash);
    if (existingRemote) {
      return { file_id: existingRemote.file_id, thumbnail_url: existingRemote.thumbnail_url };
    }

    try {
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
    } catch (error) {
      if (error instanceof Error && Object.values(COVER_ERROR).includes(error.message as typeof COVER_ERROR[keyof typeof COVER_ERROR])) {
        throw error;
      }

      const localId = crypto.randomUUID();
      const blob = new Blob([buffer], { type: file.type });
      await this.pendingCoverRepository.save({
        local_id: localId,
        goal_id: goalId,
        data: blob,
        filename: file.name,
        mime_type: file.type,
        data_hash: dataHash,
        created_at: new Date().toISOString(),
      });

      const objectUrl = URL.createObjectURL(blob);
      localCoverCache.set(localId, objectUrl);

      return {
        file_id: `${LOCAL_COVER_ID_PREFIX}${localId}`,
        thumbnail_url: objectUrl,
      };
    }
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
