import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const FOLLOWUP_STATUS_ENUM = ["pending", "processing", "sent", "cancelled", "failed"] as const;

export function registerFollowupTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_followups",
    "Use to list scheduled follow-up messages. Supports filtering by contact and status.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Results per page"),
      contactId: z.string().uuid().optional().describe("Filter by contact UUID"),
      status: z.enum(FOLLOWUP_STATUS_ENUM).optional().describe("Filter by follow-up status"),
    },
    async (args) => {
      const res = await api.get("/api/v1/followups", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_followup",
    "Use to get details for a specific follow-up by ID.",
    {
      followupId: z.string().uuid().describe("The follow-up UUID"),
    },
    async ({ followupId }) => {
      const res = await api.get(`/api/v1/followups/${followupId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "create_followup",
    "Use to schedule a follow-up message for a contact. The follow-up will be automatically sent at the scheduled time. Write operation — requires Pro tier or higher.",
    {
      contactId: z.string().uuid().describe("The contact UUID to follow up with"),
      conversationId: z.string().uuid().describe("The conversation UUID this follow-up belongs to"),
      scheduledAt: z.string().datetime().describe("When to send the follow-up (ISO 8601 datetime)"),
      sequenceStep: z.number().int().optional().describe("Step number in a follow-up sequence (default: 1)"),
    },
    async (args) => {
      const res = await api.post("/api/v1/followups", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_followup",
    "Use to cancel and delete a pending follow-up. Only 'pending' follow-ups can be deleted. Write operation — requires Pro tier or higher.",
    {
      followupId: z.string().uuid().describe("The follow-up UUID to delete"),
    },
    async ({ followupId }) => {
      const res = await api.delete(`/api/v1/followups/${followupId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { deleted: true }, null, 2) }] };
    }
  );
}
