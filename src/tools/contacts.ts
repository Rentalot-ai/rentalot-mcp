import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const CONTACT_STATUS_ENUM = ["prospect", "scheduled", "applicant", "renter", "archived"] as const;

export function registerContactTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_contacts",
    "Use to list contacts (prospects, tenants, etc.). Supports filtering by lifecycle status, channel, and free-text search across name/email/phone. Each contact includes an `appliedAt` timestamp (ISO 8601, nullable) that is auto-set when status transitions to applicant.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Results per page"),
      status: z.enum(CONTACT_STATUS_ENUM).optional().describe("Filter by contact lifecycle status"),
      channel: z.string().optional().describe("Filter by communication channel"),
      search: z.string().max(200).optional().describe("Free-text search across name, email, and phone"),
    },
    async (args) => {
      const res = await api.get("/api/v1/contacts", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_contact",
    "Use to get full details for a specific contact by ID. Response includes `appliedAt` (ISO 8601 timestamp, nullable) — auto-set when status transitions to applicant, cleared on other transitions.",
    {
      contactId: z.string().uuid().describe("The contact UUID"),
    },
    async ({ contactId }) => {
      const res = await api.get(`/api/v1/contacts/${contactId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "update_contact",
    "Use to update a contact's details or status. Only include fields you want to change. Write operation — requires Pro tier or higher.",
    {
      contactId: z.string().uuid().describe("The contact UUID to update"),
      name: z.string().optional().describe("Contact's full name"),
      email: z.string().email().optional().describe("Contact's email address"),
      phone: z.string().optional().describe("Contact's phone number"),
      status: z.enum(CONTACT_STATUS_ENUM).optional().describe("Contact lifecycle status"),
      channelPreference: z.string().optional().describe("Preferred communication channel"),
      source: z.string().optional().describe("Lead source"),
    },
    async ({ contactId, ...body }) => {
      const res = await api.patch(`/api/v1/contacts/${contactId}`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "create_contact",
    "Use to create a new contact (prospect, tenant, etc.). Write operation — requires Pro tier or higher.",
    {
      name: z.string().describe("Contact's full name"),
      email: z.string().email().optional().describe("Contact's email address"),
      phone: z.string().optional().describe("Contact's phone number"),
      status: z.enum(CONTACT_STATUS_ENUM).optional().describe("Contact lifecycle status (default: prospect)"),
      channelPreference: z.string().optional().describe("Preferred communication channel"),
      source: z.string().optional().describe("Lead source (e.g. zillow, website, referral)"),
      referralSource: z.string().optional().describe("Who referred this contact"),
    },
    async (args) => {
      const res = await api.post("/api/v1/contacts", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_contact",
    "Use to soft-delete a contact. The contact can be restored later. Write operation — requires Pro tier or higher.",
    {
      contactId: z.string().uuid().describe("The contact UUID to delete"),
    },
    async ({ contactId }) => {
      const res = await api.delete(`/api/v1/contacts/${contactId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: "Contact deleted successfully." }] };
    }
  );
}
