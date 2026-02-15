import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const showingStatus = z.enum(["pending", "confirmed", "completed", "cancelled"]);

export function registerShowingTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_showings",
    "Use to list property showings. Supports filtering by property, contact, status, and date range.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
      propertyId: z.string().uuid().optional().describe("Filter by property ID"),
      contactId: z.string().uuid().optional().describe("Filter by contact ID"),
      status: showingStatus.optional().describe("Filter by showing status"),
      startAfter: z.string().datetime().optional().describe("Only showings starting after this datetime (ISO 8601)"),
      startBefore: z.string().datetime().optional().describe("Only showings starting before this datetime (ISO 8601)"),
    },
    async (args) => {
      const res = await api.get("/api/v1/showings", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_showing",
    "Use to get full details for a specific showing by ID.",
    {
      showingId: z.string().uuid().describe("The showing ID"),
    },
    async ({ showingId }) => {
      const res = await api.get(`/api/v1/showings/${showingId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "create_showing",
    "Use to schedule a new property showing. Requires property ID, contact ID, title, and start/end times. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("Property to show"),
      contactId: z.string().uuid().describe("Contact attending the showing"),
      title: z.string().max(200).describe("Showing title"),
      startTime: z.string().datetime().describe("Start time (ISO 8601)"),
      endTime: z.string().datetime().describe("End time (ISO 8601)"),
      description: z.string().max(2000).optional().describe("Showing description"),
      timeZone: z.string().optional().describe("IANA time zone (e.g. America/New_York)"),
      location: z.string().max(500).optional().describe("Meeting location or address"),
      notes: z.string().max(2000).optional().describe("Internal notes"),
    },
    async (args) => {
      const res = await api.post("/api/v1/showings", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "update_showing",
    "Use to update a showing's details or status. Only include fields you want to change. To cancel a showing, set status to 'cancelled'. Write operation — requires Pro tier or higher.",
    {
      showingId: z.string().uuid().describe("The showing ID to update"),
      propertyId: z.string().uuid().optional().describe("Property to show"),
      contactId: z.string().uuid().optional().describe("Contact attending the showing"),
      title: z.string().max(200).optional().describe("Showing title"),
      startTime: z.string().datetime().optional().describe("Start time (ISO 8601)"),
      endTime: z.string().datetime().optional().describe("End time (ISO 8601)"),
      description: z.string().max(2000).optional().describe("Showing description"),
      timeZone: z.string().optional().describe("IANA time zone (e.g. America/New_York)"),
      location: z.string().max(500).optional().describe("Meeting location or address"),
      notes: z.string().max(2000).optional().describe("Internal notes"),
      status: showingStatus.optional().describe("Showing status"),
    },
    async ({ showingId, ...body }) => {
      const res = await api.patch(`/api/v1/showings/${showingId}`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "check_showing_availability",
    "Use to check available time slots for scheduling a property showing. Returns open slots for the given property and date range.",
    {
      propertyId: z.string().uuid().describe("Property ID to check availability for"),
      preferredDate: z.string().optional().describe("Preferred date (ISO 8601 date, e.g. 2025-03-15)"),
      dateFrom: z.string().optional().describe("Start of date range to check (ISO 8601 date)"),
      dateTo: z.string().optional().describe("End of date range to check (ISO 8601 date)"),
    },
    async (args) => {
      const res = await api.get("/api/v1/showings/availability", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_showing",
    "Use to permanently delete a showing. Prefer updating status to 'cancelled' instead. Write operation — requires Pro tier or higher.",
    {
      showingId: z.string().uuid().describe("The showing ID to delete"),
    },
    async ({ showingId }) => {
      const res = await api.delete(`/api/v1/showings/${showingId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: "Showing deleted successfully." }] };
    }
  );
}
