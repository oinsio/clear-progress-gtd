import type {
  PingResponse,
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  InitResponse,
  UploadCoverResponse,
  DeleteCoverResponse,
} from "@/types/api";
import { STORAGE_KEYS } from "@/constants";

export class ApiClient {
  private getUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) ?? "";
  }

  private async request<TResponse>(body: object): Promise<TResponse> {
    const url = this.getUrl();
    if (!url) {
      throw new Error("GAS URL is not configured");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json() as Promise<TResponse>;
  }

  async ping(): Promise<PingResponse> {
    const url = this.getUrl();
    if (!url) {
      throw new Error("GAS URL is not configured");
    }
    const response = await fetch(`${url}?action=ping`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json() as Promise<PingResponse>;
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
  }): Promise<UploadCoverResponse["data"]> {
    const response = await this.request<UploadCoverResponse>({
      action: "upload_cover",
      ...payload,
    });
    return response.data;
  }

  async deleteCover(payload: { file_id: string }): Promise<DeleteCoverResponse["data"]> {
    const response = await this.request<DeleteCoverResponse>({
      action: "delete_cover",
      ...payload,
    });
    return response.data;
  }
}
