import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

const WEBHOOK_EVENTS = [
  "inquiry.created",
  "message.received",
  "message.sent",
  "showing.booked",
  "showing.cancelled",
  "contact.updated",
  "property.updated",
  "workflow.completed",
] as const;

export function registerWebhookTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_webhooks",
    "Use to list webhook subscriptions. Webhooks deliver real-time event notifications to your HTTPS endpoint.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      limit: z.number().optional().describe("Number of results per page"),
    },
    async (args) => {
      const res = await api.get("/api/v1/webhooks", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "create_webhook",
    "Use to create a webhook subscription. Specify an HTTPS URL and one or more event types to subscribe to. Payloads are signed with HMAC-SHA256. Write operation — requires Pro tier or higher.",
    {
      url: z.string().url().describe("HTTPS endpoint URL to receive webhook events"),
      events: z
        .array(z.enum(WEBHOOK_EVENTS))
        .min(1)
        .describe("Event types to subscribe to"),
      description: z
        .string()
        .max(500)
        .optional()
        .describe("Optional description for this webhook subscription"),
    },
    async (args) => {
      const res = await api.post("/api/v1/webhooks", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_webhook",
    "Use to get details for a specific webhook subscription by ID.",
    {
      webhookId: z.string().uuid().describe("Webhook subscription ID"),
    },
    async ({ webhookId }) => {
      const res = await api.get(`/api/v1/webhooks/${webhookId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "update_webhook",
    "Use to update a webhook subscription. Only include fields you want to change. Write operation — requires Pro tier or higher.",
    {
      webhookId: z.string().uuid().describe("Webhook subscription ID to update"),
      url: z.string().url().optional().describe("New HTTPS endpoint URL"),
      events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional().describe("New event types to subscribe to"),
      active: z.boolean().optional().describe("Enable or disable the webhook"),
      description: z.string().max(500).optional().describe("Updated description"),
    },
    async ({ webhookId, ...body }) => {
      const res = await api.patch(`/api/v1/webhooks/${webhookId}`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_webhook",
    "Use to delete a webhook subscription. Events will no longer be delivered to the endpoint. Write operation — requires Pro tier or higher.",
    {
      webhookId: z.string().uuid().describe("Webhook subscription ID to delete"),
    },
    async ({ webhookId }) => {
      const res = await api.delete(`/api/v1/webhooks/${webhookId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "test_webhook",
    "Use to send a test event to a webhook endpoint. Useful for verifying your webhook handler is working correctly. Write operation — requires Pro tier or higher.",
    {
      webhookId: z.string().uuid().describe("Webhook subscription ID to test"),
    },
    async ({ webhookId }) => {
      const res = await api.post(`/api/v1/webhooks/${webhookId}/test`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
