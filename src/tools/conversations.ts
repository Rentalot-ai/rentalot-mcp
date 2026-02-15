import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerConversationTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_conversations",
    "Use to list messaging conversations. Supports filtering by contact and status. Read-only.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
      contactId: z.string().uuid().optional().describe("Filter by contact ID"),
      status: z.enum(["active", "archived"]).optional().describe("Filter by conversation status"),
    },
    async (args) => {
      const res = await api.get("/api/v1/conversations", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_conversation",
    "Use to get details for a specific conversation by ID. Read-only.",
    {
      conversationId: z.string().uuid().describe("The conversation ID"),
    },
    async (args) => {
      const res = await api.get(`/api/v1/conversations/${args.conversationId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "search_conversations",
    "Use to search conversations by keyword. Returns conversations matching the query across message content. Read-only.",
    {
      query: z.string().max(200).describe("Search query to match against conversation content"),
      limit: z.number().optional().describe("Maximum number of results to return"),
    },
    async (args) => {
      const res = await api.get("/api/v1/conversations/search", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "list_conversation_messages",
    "Use to list messages in a conversation. Returns paginated messages with direction (inbound/outbound), content, channel, and timestamp. Read-only.",
    {
      conversationId: z.string().uuid().describe("The conversation ID"),
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
    },
    async (args) => {
      const { conversationId, ...params } = args;
      const res = await api.get(`/api/v1/conversations/${conversationId}/messages`, params);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
