import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerEventTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_events",
    "Use to list all calendar events (showings, calls, inspections, meetings). Supports filtering by date range and event type. Read-only.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
      startAfter: z.string().datetime().optional().describe("Only events starting after this datetime (ISO 8601)"),
      startBefore: z.string().datetime().optional().describe("Only events starting before this datetime (ISO 8601)"),
      type: z.enum(["showing", "call", "inspection", "meeting"]).optional().describe("Filter by event type"),
    },
    async (args) => {
      const res = await api.get("/api/v1/events", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
