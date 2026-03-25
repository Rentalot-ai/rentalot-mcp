import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const CHANNEL_ENUM = ["sms", "whatsapp", "email", "gmail", "telegram"] as const;
const DRAFT_STATUS_ENUM = ["pending", "sent", "expired"] as const;

export function registerDraftTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_drafts",
    "Use to list draft messages. Supports filtering by contact, status, and channel. Drafts auto-expire 24 hours after creation.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Results per page"),
      contactId: z.string().uuid().optional().describe("Filter by contact UUID"),
      status: z.enum(DRAFT_STATUS_ENUM).optional().describe("Filter by draft status"),
      channel: z.enum(CHANNEL_ENUM).optional().describe("Filter by messaging channel"),
    },
    async (args) => {
      const res = await api.get("/api/v1/drafts", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_draft",
    "Use to get a specific draft message by ID.",
    {
      draftId: z.string().uuid().describe("The draft UUID"),
    },
    async ({ draftId }) => {
      const res = await api.get(`/api/v1/drafts/${draftId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "create_draft",
    "Use to create a draft message for review before sending. Drafts auto-expire after 24 hours. Use send_draft to deliver it. Write operation — requires Pro tier or higher.",
    {
      contactId: z.string().uuid().describe("The contact UUID to draft a message for"),
      channel: z.enum(CHANNEL_ENUM).describe("Messaging channel to send via"),
      body: z.string().min(1).max(10000).describe("Message body text"),
      subject: z.string().max(200).optional().describe("Email subject line (required for email/gmail channel)"),
      recipientPhone: z.string().max(30).optional().describe("Recipient phone number (for SMS/WhatsApp)"),
      recipientEmail: z.string().email().max(200).optional().describe("Recipient email address (for email/Gmail)"),
    },
    async (args) => {
      const res = await api.post("/api/v1/drafts", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "update_draft",
    "Use to edit an existing draft message. Only 'pending' drafts can be updated. Write operation — requires Pro tier or higher.",
    {
      draftId: z.string().uuid().describe("The draft UUID to update"),
      body: z.string().min(1).max(10000).optional().describe("Updated message body text"),
      subject: z.string().max(200).optional().describe("Updated email subject line"),
      channel: z.enum(CHANNEL_ENUM).optional().describe("Updated messaging channel"),
      recipientPhone: z.string().max(30).optional().describe("Updated recipient phone number"),
      recipientEmail: z.string().email().max(200).optional().describe("Updated recipient email address"),
    },
    async ({ draftId, ...body }) => {
      const res = await api.patch(`/api/v1/drafts/${draftId}`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "send_draft",
    "Use to send a pending draft message. The draft will be delivered via its specified channel. Once sent, the draft status changes to 'sent' and cannot be modified. Write operation — requires Pro tier or higher.",
    {
      draftId: z.string().uuid().describe("The draft UUID to send"),
      subject: z.string().max(200).optional().describe("Override the draft's subject line when sending"),
      body: z.string().max(10000).optional().describe("Override the draft's body text when sending"),
    },
    async ({ draftId, ...overrides }) => {
      const body = Object.keys(overrides).length > 0 ? overrides : undefined;
      const res = await api.post(`/api/v1/drafts/${draftId}/send`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_draft",
    "Use to delete a draft message. Only 'pending' drafts can be deleted. Write operation — requires Pro tier or higher.",
    {
      draftId: z.string().uuid().describe("The draft UUID to delete"),
    },
    async ({ draftId }) => {
      const res = await api.delete(`/api/v1/drafts/${draftId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { deleted: true }, null, 2) }] };
    }
  );
}
