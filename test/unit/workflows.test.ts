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

describe("list_workflows", () => {
  it("returns workflows list", async () => {
    const data = [{ id: "wf-1", name: "Lead Qual" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_workflows");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/workflows", {});
  });

  it("passes filter params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_workflows", { isActive: true, triggerType: "manual", page: 1, limit: 5 });
    expect(api.get).toHaveBeenCalledWith("/api/v1/workflows", {
      isActive: true, triggerType: "manual", page: 1, limit: 5,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Fail" } });

    const result = await callTool("list_workflows");
    expect(result.isError).toBe(true);
  });
});

describe("get_workflow", () => {
  it("returns workflow by ID", async () => {
    const data = { id: UUID, name: "Lead Qual" };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_workflow", { workflowId: UUID });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith(`/api/v1/workflows/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Not found" } });

    const result = await callTool("get_workflow", { workflowId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("update_workflow", () => {
  it("updates workflow fields", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data: { id: UUID, name: "Updated" } });

    const result = await callTool("update_workflow", {
      workflowId: UUID, name: "Updated", isActive: false,
    });
    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/workflows/${UUID}`, { name: "Updated", isActive: false });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Invalid steps" } });

    const result = await callTool("update_workflow", { workflowId: UUID, steps: [] });
    expect(result.isError).toBe(true);
  });
});

describe("delete_workflow", () => {
  it("deletes workflow and returns success text", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    const result = await callTool("delete_workflow", { workflowId: UUID });
    expect(result.isError).toBeFalsy();
    expect(textContent(result)).toBe("Workflow deleted successfully.");
  });

  it("returns error on conflict", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 409, error: { code: "conflict", message: "Active runs" } });

    const result = await callTool("delete_workflow", { workflowId: UUID });
    expect(result.isError).toBe(true);
    expect(textContent(result)).toContain("Active runs");
  });
});

describe("trigger_workflow_run", () => {
  it("triggers a workflow run", async () => {
    const data = { id: "run-1", status: "pending" };
    vi.mocked(api.post).mockResolvedValue({ status: 201, data });

    const args = { workflowId: UUID, contactId: UUID2, propertyId: UUID };
    const result = await callTool("trigger_workflow_run", args);
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith("/api/v1/workflows/runs", args);
  });

  it("triggers without propertyId", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { id: "run-2" } });

    await callTool("trigger_workflow_run", { workflowId: UUID, contactId: UUID2 });
    expect(api.post).toHaveBeenCalledWith("/api/v1/workflows/runs", { workflowId: UUID, contactId: UUID2 });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 422, error: { code: "validation_error", message: "Workflow inactive" } });

    const result = await callTool("trigger_workflow_run", { workflowId: UUID, contactId: UUID2 });
    expect(result.isError).toBe(true);
  });
});

describe("list_workflow_runs", () => {
  it("returns workflow runs", async () => {
    const data = [{ id: "run-1", status: "running" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_workflow_runs");
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/api/v1/workflows/runs", {});
  });

  it("passes filter params", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, data: [] });

    await callTool("list_workflow_runs", { workflowId: UUID, status: "completed", page: 2 });
    expect(api.get).toHaveBeenCalledWith("/api/v1/workflows/runs", {
      workflowId: UUID, status: "completed", page: 2,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 500, error: { code: "server_error", message: "Fail" } });

    const result = await callTool("list_workflow_runs");
    expect(result.isError).toBe(true);
  });
});

describe("get_workflow_run", () => {
  it("returns workflow run by ID", async () => {
    const data = { id: UUID, status: "running", currentStep: 2 };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_workflow_run", { runId: UUID });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith(`/api/v1/workflows/runs/${UUID}`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Run not found" } });

    const result = await callTool("get_workflow_run", { runId: UUID });
    expect(result.isError).toBe(true);
  });
});
