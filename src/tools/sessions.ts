import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const SESSION_STATUS = ["active", "completed", "expired", "draft"] as const;
const REVIEW_STATUS = ["pending_review", "approved", "denied"] as const;

export function registerSessionTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_sessions",
    "Use to list workflow sessions. Supports filtering by contact, workflow template, status, and review status.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
      contactId: z.string().uuid().optional().describe("Filter by contact ID"),
      workflowTemplateId: z.string().uuid().optional().describe("Filter by workflow template ID"),
      status: z.enum(SESSION_STATUS).optional().describe("Filter by session status"),
      reviewStatus: z.enum(REVIEW_STATUS).optional().describe("Filter by review status"),
    },
    async (args) => {
      const res = await api.get("/api/v1/sessions", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_session",
    "Use to get full details for a specific workflow session by ID.",
    {
      sessionId: z.string().uuid().describe("The session UUID"),
    },
    async ({ sessionId }) => {
      const res = await api.get(`/api/v1/sessions/${sessionId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "review_session",
    "Use to approve or deny a workflow session. Write operation — requires Pro tier or higher.",
    {
      sessionId: z.string().uuid().describe("The session UUID to review"),
      reviewStatus: z.enum(["approved", "denied"]).describe("Approval decision"),
      reviewNotes: z.string().max(2000).optional().describe("Optional notes about the review decision"),
    },
    async ({ sessionId, ...body }) => {
      const res = await api.patch(`/api/v1/sessions/${sessionId}/review`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
