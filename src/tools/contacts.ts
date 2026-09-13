import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const CONTACT_STATUS_ENUM = ["prospect", "scheduled", "applicant", "renter", "archived"] as const;
const CONTACT_ROLE_ENUM = ["prospect", "tenant", "landlord", "property_manager", "vendor", "other"] as const;

export function registerContactTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_contacts",
    "Use to list contacts (prospects, tenants, etc.). Supports filtering by lifecycle status, role, channel, and free-text search across name/email/phone. Each contact includes `appliedAt` (ISO 8601, nullable) auto-set when status → applicant, and `language` (ISO 639-1, default \"en\"). During the development-only trial, results are limited to contacts owned by the authenticated account.",
    {
      page: z.number().int().positive().optional().describe("Page number for pagination"),
      limit: z.number().int().positive().max(100).optional().describe("Results per page"),
      status: z.enum(CONTACT_STATUS_ENUM).optional().describe("Filter by contact lifecycle status"),
      role: z.enum(CONTACT_ROLE_ENUM).optional().describe("Filter by contact role"),
      channel: z.string().max(50).optional().describe("Filter by communication channel"),
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
    "Use to get full details for a specific contact by ID. Response includes `appliedAt` (ISO 8601 timestamp, nullable) — auto-set when status transitions to applicant, cleared on other transitions. During the development-only trial, only contacts owned by the authenticated account are available.",
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
    "Use to update a contact's details, notes, or status. Only include fields you want to change. During the development-only trial, updates are limited to contacts owned by the authenticated account. Write operation — available on Pro and Scale API plans and, when the development-only trial is enabled, for private account-owned property/contact CRUD. Starter remains read-only.",
    {
      contactId: z.string().uuid().describe("The contact UUID to update"),
      name: z.string().min(1).max(200).optional().describe("Contact's full name"),
      email: z.string().email().max(200).optional().describe("Contact's email address"),
      phone: z.string().max(30).optional().describe("Contact's phone number"),
      status: z.enum(CONTACT_STATUS_ENUM).optional().describe("Contact lifecycle status"),
      role: z.enum(CONTACT_ROLE_ENUM).optional().describe("Contact role (default: prospect)"),
      channelPreference: z.string().max(50).optional().describe("Preferred communication channel"),
      source: z.string().max(100).optional().describe("Lead source"),
      referralSource: z.string().max(200).optional().describe("Who referred this contact"),
      language: z.string().max(10).optional().describe("Contact's preferred language (ISO 639-1 code, default: \"en\")"),
      notes: z.string().max(5000).nullable().optional().describe("Internal notes for this contact"),
    },
    async ({ contactId, ...body }) => {
      const res = await api.patch(`/api/v1/contacts/${contactId}`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.registerTool(
    "create_contact",
    {
      description: "Use to create a new private contact (prospect, tenant, etc.). At least one of email or phone is required. During the development-only trial, this is limited to contacts owned by the authenticated account. Write operation — available on Pro and Scale API plans and, when the development-only trial is enabled, for private account-owned property/contact CRUD. Starter remains read-only.",
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe("Contact's full name"),
        email: z.string().email().max(200).optional().describe("Contact's email address"),
        phone: z.string().max(30).optional().describe("Contact's phone number"),
        status: z.enum(CONTACT_STATUS_ENUM).optional().describe("Contact lifecycle status (default: prospect)"),
        role: z.enum(CONTACT_ROLE_ENUM).optional().describe("Contact role (default: prospect)"),
        channelPreference: z.string().max(50).optional().describe("Preferred communication channel"),
        source: z.string().max(100).optional().describe("Lead source (e.g. zillow, website, referral)"),
        referralSource: z.string().max(200).optional().describe("Who referred this contact"),
        language: z.string().max(10).optional().describe("Contact's preferred language (ISO 639-1 code, default: \"en\")"),
      }).refine((data) => data.email || data.phone, {
        message: "Email or phone is required",
        path: ["email"],
      }),
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
    "Use to soft-delete a contact. This marks it deleted and removes it from API results; it is retained by the API, and this MCP server does not expose a restore operation. Write operation — available on Pro and Scale API plans and, when the development-only trial is enabled, for private account-owned property/contact CRUD. Starter remains read-only.",
    {
      contactId: z.string().uuid().describe("The contact UUID to delete"),
    },
    async ({ contactId }) => {
      const res = await api.delete(`/api/v1/contacts/${contactId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: "Contact soft-deleted successfully." }] };
    }
  );
}
