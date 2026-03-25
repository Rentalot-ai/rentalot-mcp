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
  return client.callTool({ name, arguments: args });
}

function textContent(result: Awaited<ReturnType<typeof callTool>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0]?.text ?? "";
}

describe("bulk_create_properties", () => {
  it("sends properties array to bulk endpoint", async () => {
    const data = { jobId: "job-1", total: 2 };
    vi.mocked(api.post).mockResolvedValue({ status: 202, data });

    const properties = [{ address: "1 Main St" }, { address: "2 Oak Ave" }];
    const result = await callTool("bulk_create_properties", { properties });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.post).toHaveBeenCalledWith("/api/v1/properties/bulk", { properties }, {});
  });

  it("passes idempotency key as header", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 202, data: { jobId: "job-2" } });

    await callTool("bulk_create_properties", {
      properties: [{ address: "3 Elm St" }],
      idempotencyKey: "idem-bulk",
    });
    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/properties/bulk",
      { properties: [{ address: "3 Elm St" }] },
      { "Idempotency-Key": "idem-bulk" },
    );
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 422, error: { code: "validation_error", message: "Too many" } });

    const result = await callTool("bulk_create_properties", { properties: [{ address: "x" }] });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Too many");
  });
});

describe("get_bulk_import_job", () => {
  it("returns job status", async () => {
    const data = { jobId: "job-1", status: "completed", total: 5, created: 5, failed: 0 };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_bulk_import_job", { jobId: "job-1" });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/properties/bulk/job-1");
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Job not found" } });

    const result = await callTool("get_bulk_import_job", { jobId: "bad-id" });
    expect(result.isError).toBe(true);
  });
});
