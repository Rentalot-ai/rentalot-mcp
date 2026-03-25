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

describe("list_drafts", () => {
  it("returns drafts list", async () => {
    const data = [{ id: "d-1", status: "pending" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_drafts");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/drafts", {});
  });

  it("passes filter params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_drafts", { contactId: UUID, status: "sent", channel: "email", page: 1, limit: 10 });
    expect(api.get).toHaveBeenCalledWith("/api/v1/drafts", {
      contactId: UUID, status: "sent", channel: "email", page: 1, limit: 10,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Fail" } });

    const result = await callTool("list_drafts");
    expect(result.isError).toBe(true);
  });
});

describe("get_draft", () => {
  it("returns draft by ID", async () => {
    const data = { id: UUID, body: "Hello" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_draft", { draftId: UUID });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith(`/api/v1/drafts/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("get_draft", { draftId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("update_draft", () => {
  it("updates draft fields", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data: { id: UUID, body: "Updated" } });

    const result = await callTool("update_draft", { draftId: UUID, body: "Updated", subject: "New subject" });
    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/drafts/${UUID}`, { body: "Updated", subject: "New subject" });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Already sent" } });

    const result = await callTool("update_draft", { draftId: UUID, body: "x" });
    expect(result.isError).toBe(true);
  });
});

describe("delete_draft", () => {
  it("deletes draft and returns deleted JSON", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 200, data: undefined });

    const result = await callTool("delete_draft", { draftId: UUID });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual({ deleted: true });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 409, error: { code: "conflict", message: "Already sent" } });

    const result = await callTool("delete_draft", { draftId: UUID });
    expect(result.isError).toBe(true);
  });
});
