import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerWorkflowTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_workflows",
    "Use to list workflow templates. Workflows are automated multi-step sequences (e.g. pre-screening, lead qualification, follow-up sequences). Response includes full template detail: steps, triggerConfig, exitConditions, questionConfig, completionConfig, introMessage, voiceConfig, currentVersion, and updatedAt. Read-only.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
      isActive: z.boolean().optional().describe("Filter by active/inactive status"),
      triggerType: z
        .enum(["manual", "deep_link", "automatic", "scheduled"])
        .optional()
        .describe("Filter by trigger type"),
    },
    async (args) => {
      const res = await api.get("/api/v1/workflows", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_workflow",
    "Use to get a specific workflow template by ID. Returns full template detail including steps, triggerConfig, exitConditions, questionConfig, completionConfig, introMessage, voiceConfig, currentVersion, and updatedAt. Read-only.",
    {
      workflowId: z.string().uuid().describe("Workflow template ID"),
    },
    async ({ workflowId }) => {
      const res = await api.get(`/api/v1/workflows/${workflowId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "create_workflow",
    "Use to create a new workflow template. Slug is auto-generated from name. Write operation — requires Pro tier or higher.",
    {
      name: z.string().describe("Workflow name (slug auto-generated from this)"),
      steps: z
        .array(z.record(z.unknown()))
        .min(1)
        .describe("Array of step definitions for the workflow"),
      triggerType: z
        .enum(["manual", "deep_link", "automatic", "scheduled"])
        .describe("How the workflow is triggered"),
      description: z.string().optional().describe("Human-readable description"),
      triggerConfig: z.record(z.unknown()).optional().describe("Trigger-specific configuration"),
      exitConditions: z.record(z.unknown()).optional().describe("Conditions that end the workflow early"),
      questionConfig: z.record(z.unknown()).optional().describe("Question/form configuration for workflow steps"),
      completionConfig: z.record(z.unknown()).optional().describe("What happens when the workflow completes"),
      isPublic: z.boolean().optional().describe("Whether the workflow is publicly accessible"),
      introMessage: z.string().optional().describe("Message shown when the workflow starts"),
      voiceConfig: z.record(z.unknown()).optional().describe("Voice channel configuration"),
      isActive: z.boolean().optional().describe("Whether the workflow is active (default true)"),
      idempotencyKey: z.string().optional().describe("Optional idempotency key to prevent duplicate creation"),
    },
    async ({ idempotencyKey, ...body }) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

      const res = await api.post("/api/v1/workflows", body, headers);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "update_workflow",
    "Use to update a workflow template. Only include fields you want to change. Changes to execution fields (steps, triggerConfig, exitConditions, questionConfig, completionConfig) auto-create a version snapshot. Write operation — requires Pro tier or higher.",
    {
      workflowId: z.string().uuid().describe("Workflow template ID to update"),
      name: z.string().optional().describe("Updated workflow name"),
      steps: z.array(z.record(z.unknown())).optional().describe("Updated step definitions"),
      triggerType: z
        .enum(["manual", "deep_link", "automatic", "scheduled"])
        .optional()
        .describe("Updated trigger type"),
      description: z.string().optional().describe("Updated description"),
      triggerConfig: z.record(z.unknown()).optional().describe("Updated trigger configuration"),
      exitConditions: z.record(z.unknown()).optional().describe("Updated exit conditions"),
      questionConfig: z.record(z.unknown()).optional().describe("Updated question configuration"),
      completionConfig: z.record(z.unknown()).optional().describe("Updated completion configuration"),
      isPublic: z.boolean().optional().describe("Updated public visibility"),
      introMessage: z.string().optional().describe("Updated intro message"),
      voiceConfig: z.record(z.unknown()).optional().describe("Updated voice configuration"),
      isActive: z.boolean().optional().describe("Updated active state"),
    },
    async ({ workflowId, ...body }) => {
      const res = await api.patch(`/api/v1/workflows/${workflowId}`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_workflow",
    "Use to delete a workflow template. Fails with 409 if active runs exist — cancel or wait for them to finish first. Write operation — requires Pro tier or higher.",
    {
      workflowId: z.string().uuid().describe("Workflow template ID to delete"),
    },
    async ({ workflowId }) => {
      const res = await api.delete(`/api/v1/workflows/${workflowId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: "Workflow deleted successfully." }] };
    }
  );

  server.tool(
    "trigger_workflow_run",
    "Use to trigger a new run of a workflow for a specific contact. Optionally scope it to a property. The workflow will execute its steps asynchronously. Write operation — requires Pro tier or higher.",
    {
      workflowId: z.string().uuid().describe("Workflow template ID to run"),
      contactId: z.string().uuid().describe("Contact ID to run the workflow for"),
      propertyId: z.string().uuid().optional().describe("Property ID to scope the workflow run to"),
    },
    async (args) => {
      const res = await api.post("/api/v1/workflows/runs", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "list_workflow_runs",
    "Use to list workflow runs. Supports filtering by workflow, contact, and execution status.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
      workflowId: z.string().uuid().optional().describe("Filter by workflow template ID"),
      contactId: z.string().uuid().optional().describe("Filter by contact ID"),
      status: z
        .enum(["pending", "running", "paused", "completed", "cancelled", "failed"])
        .optional()
        .describe("Filter by run status"),
    },
    async (args) => {
      const res = await api.get("/api/v1/workflows/runs", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_workflow_run",
    "Use to get details and current progress of a specific workflow run by ID.",
    {
      runId: z.string().uuid().describe("Workflow run ID"),
    },
    async ({ runId }) => {
      const res = await api.get(`/api/v1/workflows/runs/${runId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
