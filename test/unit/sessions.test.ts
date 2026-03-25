import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestClient, mockApiClient } from "./helpers.js";
import type { ApiClient } from "../../src/api-client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

let client: Client;
let api: ApiClient;

beforeEach(async () => {
  api = mockApiClient();
  ({ client, api } = await createTestClient(api));
});

async function callTool(name: string, args: Record<string, unknown> = {}) {
  return client.callTool({ name, arguments: args });
}

function textContent(result: Awaited<ReturnType<typeof callTool>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0]?.text ?? "";
}

describe("list_sessions", () => {
  it("returns sessions list", async () => {
    const data = [{ id: "s-1", status: "active" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_sessions");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/sessions", {});
  });

  it("passes filter params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_sessions", {
      contactId: UUID, status: "completed", reviewStatus: "approved", page: 2, limit: 10,
    });
    expect(api.get).toHaveBeenCalledWith("/api/v1/sessions", {
      contactId: UUID, status: "completed", reviewStatus: "approved", page: 2, limit: 10,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Fail" } });

    const result = await callTool("list_sessions");
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Fail");
  });
});

describe("get_session", () => {
  it("returns session by ID", async () => {
    const data = { id: UUID, status: "active" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_session", { sessionId: UUID });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith(`/api/v1/sessions/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Session not found" } });

    const result = await callTool("get_session", { sessionId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("review_session", () => {
  it("approves a session", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data: { id: UUID, reviewStatus: "approved" } });

    const result = await callTool("review_session", {
      sessionId: UUID, reviewStatus: "approved", reviewNotes: "Looks good",
    });
    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/sessions/${UUID}/review`, {
      reviewStatus: "approved", reviewNotes: "Looks good",
    });
  });

  it("denies a session", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data: { id: UUID, reviewStatus: "denied" } });

    const result = await callTool("review_session", { sessionId: UUID, reviewStatus: "denied" });
    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/sessions/${UUID}/review`, { reviewStatus: "denied" });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Already reviewed" } });

    const result = await callTool("review_session", { sessionId: UUID, reviewStatus: "approved" });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Already reviewed");
  });
});
