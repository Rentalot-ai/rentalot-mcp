import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestClient, mockApiClient } from "./helpers.js";
import type { ApiClient } from "../../src/api-client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

let client: Client;
let api: ApiClient;

beforeEach(async () => {
  api = mockApiClient();
  ({ client, api } = await createTestClient(api));
});

async function callTool(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  return result;
}

function textContent(result: Awaited<ReturnType<typeof callTool>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0]?.text ?? "";
}

describe("Tool behavior — successful responses", () => {
  it("list_properties returns JSON data", async () => {
    const data = [{ id: "abc", address: "123 Main St" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_properties");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/properties", {});
  });

  it("get_contact returns JSON data", async () => {
    const data = { id: "uuid-1", name: "Alice" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_contact", { contactId: "550e8400-e29b-41d4-a716-446655440000" });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
  });

  it("create_property sends POST with body", async () => {
    const data = { id: "new-id", address: "456 Oak" };
    vi.mocked(api.post).mockResolvedValue({ status: 201, data });

    const args = { address: "456 Oak", monthlyRent: 2000, bedrooms: 3, bathrooms: 2 };
    const result = await callTool("create_property", args);
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith("/api/v1/properties", args);
  });

  it("update_showing sends PATCH with body (excluding ID)", async () => {
    const data = { id: "show-1", notes: "Updated" };
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data });

    const result = await callTool("update_showing", {
      showingId: "550e8400-e29b-41d4-a716-446655440000",
      notes: "Updated",
    });
    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(
      "/api/v1/showings/550e8400-e29b-41d4-a716-446655440000",
      { notes: "Updated" },
    );
  });

  it("delete_contact returns success text on 204", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    const result = await callTool("delete_contact", {
      contactId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.isError).toBeFalsy();
    expect(textContent(result)).toBe("Contact deleted successfully.");
  });

  it("delete_property returns deleted JSON on 200", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 200, data: undefined });

    const result = await callTool("delete_property", {
      propertyId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual({ deleted: true });
  });
});

describe("Tool behavior — error responses", () => {
  it("returns isError=true with error message on API error", async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 404,
      error: { code: "not_found", message: "Property not found" },
    });

    const result = await callTool("get_property", {
      propertyId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toBe("Error: Property not found");
  });

  it("returns isError=true on POST error", async () => {
    vi.mocked(api.post).mockResolvedValue({
      status: 422,
      error: { code: "validation_error", message: "Duplicate contact" },
    });

    const result = await callTool("create_contact", { name: "Bob" });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Duplicate contact");
  });

  it("returns isError=true on PATCH error", async () => {
    vi.mocked(api.patch).mockResolvedValue({
      status: 400,
      error: { code: "bad_request", message: "Cannot update archived contact" },
    });

    const result = await callTool("update_contact", {
      contactId: "550e8400-e29b-41d4-a716-446655440000",
      name: "New Name",
    });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Cannot update archived contact");
  });

  it("returns isError=true on DELETE error", async () => {
    vi.mocked(api.delete).mockResolvedValue({
      status: 409,
      error: { code: "conflict", message: "Workflow has active runs" },
    });

    const result = await callTool("delete_workflow", {
      workflowId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Workflow has active runs");
  });
});

describe("Tool behavior — domain-specific", () => {
  it("create_workflow passes idempotencyKey as header", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { id: "wf-1" } });

    await callTool("create_workflow", {
      name: "Test Workflow",
      steps: [{ type: "message", body: "hello" }],
      triggerType: "manual",
      idempotencyKey: "idem-123",
    });

    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/workflows",
      { name: "Test Workflow", steps: [{ type: "message", body: "hello" }], triggerType: "manual" },
      { "Idempotency-Key": "idem-123" },
    );
  });

  it("list_events passes filter params to API", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_events", { type: "showing", limit: 10 });
    expect(api.get).toHaveBeenCalledWith("/api/v1/events", { type: "showing", limit: 10 });
  });

  it("get_settings calls correct endpoint with no params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: { showingBufferMinutes: 30 } });

    const result = await callTool("get_settings");
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith("/api/v1/settings");
  });

  it("import_property_images passes urls and idempotencyKey", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 202, data: { jobId: "job-1" } });

    await callTool("import_property_images", {
      propertyId: "550e8400-e29b-41d4-a716-446655440000",
      urls: ["https://example.com/img.jpg"],
      idempotencyKey: "idem-456",
    });

    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/properties/550e8400-e29b-41d4-a716-446655440000/images/import",
      { urls: ["https://example.com/img.jpg"] },
      { "Idempotency-Key": "idem-456" },
    );
  });
});
