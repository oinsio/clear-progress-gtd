import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { ApiClient } from "./ApiClient";

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

  it("should throw when response ok field is false", async () => {
    server.use(
      http.get(TEST_URL, () =>
        HttpResponse.json({ ok: false, app: "CP", version: "1.0", initialized: false }),
      ),
    );

    await expect(apiClient.pingUrl(TEST_URL)).rejects.toThrow();
  });
});
