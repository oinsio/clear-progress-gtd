import type {
  PingResponse,
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  InitResponse,
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

    return response.json() as Promise<TResponse>;
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
    return response.json() as Promise<PingResponse>;
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
}
