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

describe("list_conversations", () => {
  it("returns conversations list", async () => {
    const data = [{ id: "c-1", status: "active" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_conversations");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/conversations", {});
  });

  it("passes filter params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_conversations", { contactId: UUID, status: "archived", page: 2, limit: 10 });
    expect(api.get).toHaveBeenCalledWith("/api/v1/conversations", {
      contactId: UUID, status: "archived", page: 2, limit: 10,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Internal error" } });

    const result = await callTool("list_conversations");
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Internal error");
  });
});

describe("get_conversation", () => {
  it("returns conversation by ID", async () => {
    const data = { id: UUID, status: "active" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_conversation", { conversationId: UUID });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith(`/api/v1/conversations/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("get_conversation", { conversationId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("search_conversations", () => {
  it("passes query params to API", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: { results: [], total: 0 } });

    const result = await callTool("search_conversations", { query: "rent", page: 1, limit: 5 });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith("/api/v1/conversations/search", { query: "rent", page: 1, limit: 5 });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Query too short" } });

    const result = await callTool("search_conversations", { query: "" });
    expect(result.isError).toBe(true);
  });
});

describe("list_conversation_messages", () => {
  it("returns messages for a conversation", async () => {
    const data = [{ id: "m-1", body: "Hello" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_conversation_messages", { conversationId: UUID, page: 1, limit: 20 });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith(`/api/v1/conversations/${UUID}/messages`, { page: 1, limit: 20 });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Conversation not found" } });

    const result = await callTool("list_conversation_messages", { conversationId: UUID });
    expect(result.isError).toBe(true);
  });
});
