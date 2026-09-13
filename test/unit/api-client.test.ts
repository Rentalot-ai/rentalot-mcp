import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "../../src/api-client.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiClient quota recovery", () => {
  it("preserves response headers and exposes Retry-After on rate-limit errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({
        type: "https://rentalot.ai/problems/rate-limited",
        status: 429,
        detail: "Write rate limit exceeded for contacts (5/min)",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "12",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1770000012",
          "X-Trial-Requests-Remaining": "699",
        },
      },
    )));

    const response = await new ApiClient({
      baseUrl: "http://localhost:3000",
      apiKey: "ra_fake",
    }).post("/api/v1/contacts", { name: "Alice", email: "alice@example.com" });

    expect(response.status).toBe(429);
    expect(response.headers["retry-after"]).toBe("12");
    expect(response.headers["x-trial-requests-remaining"]).toBe("699");
    expect(response.error?.message).toContain("Retry-After: 12 seconds");
  });

  it("serializes array query parameters as repeated values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient({
      baseUrl: "http://localhost:3000",
      apiKey: "ra_fake",
    }).get("/api/v1/properties", {
      propertyType: ["house", "condo"],
      bedroomType: "studio",
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.getAll("propertyType")).toEqual(["house", "condo"]);
    expect(requestUrl.searchParams.get("bedroomType")).toBe("studio");
  });
});
