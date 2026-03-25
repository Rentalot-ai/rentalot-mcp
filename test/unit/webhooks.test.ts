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

describe("list_webhooks", () => {
  it("returns webhooks list", async () => {
    const data = [{ id: "wh-1", url: "https://example.com/hook" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_webhooks");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/webhooks", {});
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Fail" } });

    const result = await callTool("list_webhooks");
    expect(result.isError).toBe(true);
  });
});

describe("create_webhook", () => {
  it("creates a webhook", async () => {
    const data = { id: "wh-new", url: "https://example.com/hook" };
    vi.mocked(api.post).mockResolvedValue({ status: 201, data });

    const args = { url: "https://example.com/hook", events: ["inquiry.created", "message.received"] };
    const result = await callTool("create_webhook", args);
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith("/api/v1/webhooks", args);
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 422, error: { code: "validation_error", message: "Invalid URL" } });

    const result = await callTool("create_webhook", { url: "https://x.com", events: ["inquiry.created"] });
    expect(result.isError).toBe(true);
  });
});

describe("get_webhook", () => {
  it("returns webhook by ID", async () => {
    const data = { id: UUID, url: "https://example.com/hook" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_webhook", { webhookId: UUID });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith(`/api/v1/webhooks/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("get_webhook", { webhookId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("update_webhook", () => {
  it("updates webhook fields", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data: { id: UUID, active: false } });

    const result = await callTool("update_webhook", {
      webhookId: UUID, active: false, url: "https://new.example.com/hook",
    });
    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/webhooks/${UUID}`, {
      active: false, url: "https://new.example.com/hook",
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Bad" } });

    const result = await callTool("update_webhook", { webhookId: UUID, active: true });
    expect(result.isError).toBe(true);
  });
});

describe("delete_webhook", () => {
  it("deletes webhook and returns success text", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    const result = await callTool("delete_webhook", { webhookId: UUID });
    expect(result.isError).toBeFalsy();
    expect(textContent(result)).toBe("Webhook deleted successfully.");
  });

  it("returns error on failure", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 409, error: { code: "conflict", message: "In use" } });

    const result = await callTool("delete_webhook", { webhookId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("test_webhook", () => {
  it("sends test event", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 200, data: { delivered: true } });

    const result = await callTool("test_webhook", { webhookId: UUID });
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith(`/api/v1/webhooks/${UUID}/test`);
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 502, error: { code: "bad_gateway", message: "Endpoint unreachable" } });

    const result = await callTool("test_webhook", { webhookId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("rotate_webhook_secret", () => {
  it("rotates secret and returns new one", async () => {
    const data = { secret: "whsec_new123" };
    vi.mocked(api.post).mockResolvedValue({ status: 200, data });

    const result = await callTool("rotate_webhook_secret", { webhookId: UUID });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.post).toHaveBeenCalledWith(`/api/v1/webhooks/${UUID}/rotate-secret`);
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("rotate_webhook_secret", { webhookId: UUID });
    expect(result.isError).toBe(true);
  });
});
