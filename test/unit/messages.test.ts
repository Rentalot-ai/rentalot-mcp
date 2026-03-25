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

describe("send_message", () => {
  it("sends a message and returns result", async () => {
    const data = { id: "msg-1", status: "sent" };
    vi.mocked(api.post).mockResolvedValue({ status: 200, data });

    const args = { contactId: UUID, body: "Hello there", channel: "whatsapp" as const };
    const result = await callTool("send_message", args);
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.post).toHaveBeenCalledWith("/api/v1/messages", args);
  });

  it("sends without channel (uses default)", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 200, data: { id: "msg-2" } });

    await callTool("send_message", { contactId: UUID, body: "Hi" });
    expect(api.post).toHaveBeenCalledWith("/api/v1/messages", { contactId: UUID, body: "Hi" });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 422, error: { code: "validation_error", message: "Channel unavailable" } });

    const result = await callTool("send_message", { contactId: UUID, body: "Hi", channel: "sms" });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Channel unavailable");
  });
});
