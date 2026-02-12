import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerWorkflowTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_workflows",
    "Use to list workflow templates. Workflows are automated multi-step sequences (e.g. pre-screening, lead qualification, follow-up sequences). Read-only.",
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
    "Use to get a specific workflow template by ID, including its step definitions. Read-only.",
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
