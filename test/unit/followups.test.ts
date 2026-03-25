import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestClient, mockApiClient } from "./helpers.js";
import type { ApiClient } from "../../src/api-client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "660e8400-e29b-41d4-a716-446655440001";

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

describe("list_followups", () => {
  it("returns followups list", async () => {
    const data = [{ id: "f-1", status: "pending" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_followups");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/followups", {});
  });

  it("passes filter params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_followups", { contactId: UUID, status: "sent", page: 1, limit: 5 });
    expect(api.get).toHaveBeenCalledWith("/api/v1/followups", {
      contactId: UUID, status: "sent", page: 1, limit: 5,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Oops" } });

    const result = await callTool("list_followups");
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Oops");
  });
});

describe("get_followup", () => {
  it("returns followup by ID", async () => {
    const data = { id: UUID, status: "pending" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_followup", { followupId: UUID });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith(`/api/v1/followups/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("get_followup", { followupId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("create_followup", () => {
  it("creates a followup", async () => {
    const data = { id: "f-new", status: "pending" };
    vi.mocked(api.post).mockResolvedValue({ status: 201, data });

    const args = {
      contactId: UUID,
      conversationId: UUID2,
      scheduledAt: "2026-04-01T10:00:00Z",
      sequenceStep: 2,
    };
    const result = await callTool("create_followup", args);
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith("/api/v1/followups", args);
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 422, error: { code: "validation_error", message: "Invalid date" } });

    const result = await callTool("create_followup", {
      contactId: UUID, conversationId: UUID2, scheduledAt: "2026-04-01T10:00:00Z",
    });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Invalid date");
  });
});

describe("delete_followup", () => {
  it("deletes a followup and returns deleted JSON", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 200, data: undefined });

    const result = await callTool("delete_followup", { followupId: UUID });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual({ deleted: true });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 409, error: { code: "conflict", message: "Already sent" } });

    const result = await callTool("delete_followup", { followupId: UUID });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Already sent");
  });
});
