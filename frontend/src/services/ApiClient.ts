import type {
  PingResponse,
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  InitResponse,
  UploadCoverResponse,
  UploadCoverBatchItem,
  UploadCoversResponse,
  DeleteCoverResponse,
  GetCoversResponse,
} from "@/types/api";
import { STORAGE_KEYS, API_ACTIONS, GAS_AUTH_ERROR_CODE, TOKEN_EXPIRY_BUFFER_S, API_AUTH_ERROR_NAME } from "@/constants";

// Module-level shared state — all ApiClient instances use the same token
let sharedAccessToken: string | null = null;
let sharedTokenExpiresAt: number | null = null;

export function setAccessToken(token: string | null, expiresIn?: number): void {
  sharedAccessToken = token;
  sharedTokenExpiresAt =
    token && expiresIn !== undefined
      ? Date.now() + (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000
      : null;
}

export class ApiAuthError extends Error {
  constructor() {
    super("Authentication required: token is missing, expired, or invalid");
    this.name = API_AUTH_ERROR_NAME;
  }
}

export class ApiClient {
  private getUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) ?? "";
  }

  private async request<TResponse>(body: object): Promise<TResponse> {
    if (sharedTokenExpiresAt !== null && Date.now() > sharedTokenExpiresAt) {
      throw new ApiAuthError();
    }

    const url = this.getUrl();
    if (!url) {
      throw new Error("GAS URL is not configured");
    }

    const requestBody =
      sharedAccessToken !== null
        ? { ...body, access_token: sharedAccessToken }
        : body;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const parsed = (await response.json()) as Record<string, unknown>;
    if (parsed.error === GAS_AUTH_ERROR_CODE) {
      throw new ApiAuthError();
    }

    return parsed as TResponse;
  }

  async ping(): Promise<PingResponse> {
    return this.pingUrl(this.getUrl());
  }

  async pingUrl(url: string): Promise<PingResponse> {
    if (!url) {
      throw new Error("GAS URL is not configured");
    }
    const response = await fetch(`${url}?action=ping`, { redirect: "follow" });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    let parsedResponse: unknown;
    try {
      parsedResponse = await response.json();
    } catch {
      throw new Error("Invalid response: expected JSON");
    }
    if (!isValidPingResponse(parsedResponse)) {
      throw new Error("Invalid response: not a valid ping response");
    }
    return parsedResponse;
  }

  async init(): Promise<InitResponse> {
    return this.request<InitResponse>({ action: "init" });
  }

  async pull(pullRequest: Omit<PullRequest, "action">): Promise<PullResponse> {
    return this.request<PullResponse>({ action: "pull", ...pullRequest });
  }

  async push(pushRequest: Omit<PushRequest, "action">): Promise<PushResponse> {
    return this.request<PushResponse>({ action: "push", ...pushRequest });
  }

  async uploadCover(payload: {
    goal_id: string;
    filename: string;
    mime_type: string;
    data: string;
  }): Promise<Pick<UploadCoverResponse, "file_id" | "reused">> {
    const response = await this.request<UploadCoverResponse>({
      action: API_ACTIONS.UPLOAD_COVER,
      ...payload,
    });
    const { file_id, reused } = response;
    return { file_id, reused };
  }

  async uploadCovers(covers: UploadCoverBatchItem[]): Promise<UploadCoversResponse> {
    return this.request<UploadCoversResponse>({
      action: API_ACTIONS.UPLOAD_COVERS,
      covers,
    });
  }

  async getCovers(fileIds: string[]): Promise<GetCoversResponse> {
    return this.request<GetCoversResponse>({
      action: "get_cover",
      file_ids: fileIds,
    });
  }

  async deleteCover(payload: { file_id: string }): Promise<Pick<DeleteCoverResponse, "deleted" | "ref_count">> {
    const response = await this.request<DeleteCoverResponse>({
      action: "delete_cover",
      ...payload,
    });
    const { deleted, ref_count } = response;
    return { deleted, ref_count };
  }
}

function isValidPingResponse(data: unknown): data is PingResponse {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    typeof record.ok === "boolean" &&
    typeof record.app === "string" &&
    typeof record.version === "string" &&
    typeof record.initialized === "boolean"
  );
}
