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

describe("list_showings", () => {
  it("returns showings list", async () => {
    const data = [{ id: "s-1", status: "pending" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_showings");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/showings", {});
  });

  it("passes all filter params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_showings", {
      propertyId: UUID, contactId: UUID2, status: "confirmed",
      startAfter: "2026-04-01T00:00:00Z", startBefore: "2026-04-30T23:59:59Z",
      page: 1, limit: 20,
    });
    expect(api.get).toHaveBeenCalledWith("/api/v1/showings", {
      propertyId: UUID, contactId: UUID2, status: "confirmed",
      startAfter: "2026-04-01T00:00:00Z", startBefore: "2026-04-30T23:59:59Z",
      page: 1, limit: 20,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Fail" } });

    const result = await callTool("list_showings");
    expect(result.isError).toBe(true);
  });
});

describe("get_showing", () => {
  it("returns showing by ID", async () => {
    const data = { id: UUID, title: "Tour" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_showing", { showingId: UUID });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith(`/api/v1/showings/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("get_showing", { showingId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("create_showing", () => {
  it("creates a showing", async () => {
    const data = { id: "s-new" };
    vi.mocked(api.post).mockResolvedValue({ status: 201, data });

    const args = {
      propertyId: UUID, contactId: UUID2, title: "Tour",
      startTime: "2026-04-01T10:00:00Z", endTime: "2026-04-01T11:00:00Z",
      notes: "Ring doorbell",
    };
    const result = await callTool("create_showing", args);
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith("/api/v1/showings", args);
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 409, error: { code: "conflict", message: "Time slot taken" } });

    const result = await callTool("create_showing", {
      propertyId: UUID, contactId: UUID2, title: "Tour",
      startTime: "2026-04-01T10:00:00Z", endTime: "2026-04-01T11:00:00Z",
    });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Time slot taken");
  });
});

describe("check_showing_availability", () => {
  it("returns available slots", async () => {
    const data = { slots: [{ start: "2026-04-01T09:00:00Z", end: "2026-04-01T10:00:00Z" }] };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("check_showing_availability", {
      propertyId: UUID, dateFrom: "2026-04-01", dateTo: "2026-04-02",
    });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith("/api/v1/showings/availability", {
      propertyId: UUID, dateFrom: "2026-04-01", dateTo: "2026-04-02",
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Invalid range" } });

    const result = await callTool("check_showing_availability", { propertyId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("delete_showing", () => {
  it("deletes showing and returns success text", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    const result = await callTool("delete_showing", { showingId: UUID });
    expect(result.isError).toBeFalsy();
    expect(textContent(result)).toBe("Showing deleted successfully.");
  });

  it("returns error on failure", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("delete_showing", { showingId: UUID });
    expect(result.isError).toBe(true);
  });
});
