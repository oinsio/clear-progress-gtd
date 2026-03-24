import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { ApiClient } from "./ApiClient";
import type { UploadCoverBatchItem } from "@/types/api";

const TEST_URL = "https://script.google.com/macros/s/test-deploy-id/exec";

const VALID_PING_RESPONSE = {
  ok: true,
  app: "Clear Progress",
  version: "1.0",
  initialized: true,
};

describe("ApiClient.pingUrl", () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw when URL is empty", async () => {
    await expect(apiClient.pingUrl("")).rejects.toThrow("GAS URL is not configured");
  });

  it("should return valid PingResponse when server responds with all required fields", async () => {
    server.use(http.get(TEST_URL, () => HttpResponse.json(VALID_PING_RESPONSE)));

    const result = await apiClient.pingUrl(TEST_URL);

    expect(result).toEqual(VALID_PING_RESPONSE);
  });

  it("should pass redirect: follow option to fetch", async () => {
    server.use(http.get(TEST_URL, () => HttpResponse.json(VALID_PING_RESPONSE)));
    const fetchSpy = vi.spyOn(global, "fetch");

    await apiClient.pingUrl(TEST_URL);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(TEST_URL),
      expect.objectContaining({ redirect: "follow" }),
    );
  });

  it("should throw HTTP error when server responds with non-OK status", async () => {
    server.use(http.get(TEST_URL, () => new HttpResponse(null, { status: 403 })));

    await expect(apiClient.pingUrl(TEST_URL)).rejects.toThrow("HTTP error: 403");
  });

  it("should throw when server response is not valid JSON", async () => {
    server.use(
      http.get(
        TEST_URL,
        () =>
          new HttpResponse('<html lang="en"><body>Sign in to Google</body></html>', {
            headers: { "Content-Type": "text/html" },
          }),
      ),
    );

    await expect(apiClient.pingUrl(TEST_URL)).rejects.toThrow();
  });

  it("should throw when response JSON is missing field: ok", async () => {
    server.use(
      http.get(TEST_URL, () =>
        HttpResponse.json({ app: "CP", version: "1.0", initialized: true }),
      ),
    );

    await expect(apiClient.pingUrl(TEST_URL)).rejects.toThrow();
  });

  it("should throw when response JSON is missing field: app", async () => {
    server.use(
      http.get(TEST_URL, () =>
        HttpResponse.json({ ok: true, version: "1.0", initialized: true }),
      ),
    );

    await expect(apiClient.pingUrl(TEST_URL)).rejects.toThrow();
  });

  it("should throw when response JSON is missing field: version", async () => {
    server.use(
      http.get(TEST_URL, () => HttpResponse.json({ ok: true, app: "CP", initialized: true })),
    );

    await expect(apiClient.pingUrl(TEST_URL)).rejects.toThrow();
  });

  it("should throw when response JSON is missing field: initialized", async () => {
    server.use(
      http.get(TEST_URL, () => HttpResponse.json({ ok: true, app: "CP", version: "1.0" })),
    );

    await expect(apiClient.pingUrl(TEST_URL)).rejects.toThrow();
  });

  it("should return response with ok: false so the caller can handle the error", async () => {
    server.use(
      http.get(TEST_URL, () =>
        HttpResponse.json({ ok: false, app: "CP", version: "1.0", initialized: false }),
      ),
    );

    const result = await apiClient.pingUrl(TEST_URL);

    expect(result.ok).toBe(false);
  });

  it("should return response with initialized: false so the caller can trigger init", async () => {
    server.use(
      http.get(TEST_URL, () =>
        HttpResponse.json({ ok: true, app: "CP", version: "1.0", initialized: false }),
      ),
    );

    const result = await apiClient.pingUrl(TEST_URL);

    expect(result.initialized).toBe(false);
  });
});

describe("ApiClient.uploadCovers", () => {
  let apiClient: ApiClient;

  const validCover: UploadCoverBatchItem = {
    local_id: "local-uuid-1",
    goal_id: "goal-uuid-1",
    filename: "cover.jpg",
    mime_type: "image/jpeg",
    data: "base64_encoded_data",
  };

  const mockResponse = {
    ok: true,
    results: [{ local_id: "local-uuid-1", goal_id: "goal-uuid-1", file_id: "drive-file-id", reused: false }],
  };

  beforeEach(() => {
    apiClient = new ApiClient();
    localStorage.setItem("gas_url", TEST_URL);
    server.use(
      http.post(TEST_URL, () => HttpResponse.json(mockResponse)),
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should send action upload_covers in request body", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    await apiClient.uploadCovers([validCover]);

    const requestBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string) as Record<string, unknown>;
    expect(requestBody.action).toBe("upload_covers");
  });

  it("should include covers array in request body", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    await apiClient.uploadCovers([validCover]);

    const requestBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string) as Record<string, unknown>;
    expect(requestBody.covers).toEqual([validCover]);
  });

  it("should return UploadCoversResponse from server", async () => {
    const result = await apiClient.uploadCovers([validCover]);

    expect(result).toEqual(mockResponse);
  });

  it("should pass multiple covers in the request", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const covers = [validCover, { ...validCover, local_id: "local-uuid-2", goal_id: "goal-uuid-2" }];

    await apiClient.uploadCovers(covers);

    const requestBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string) as Record<string, unknown>;
    expect((requestBody.covers as unknown[]).length).toBe(2);
  });
});
