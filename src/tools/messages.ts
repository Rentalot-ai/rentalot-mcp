import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerMessageTools(server: McpServer, api: ApiClient) {
  server.tool(
    "send_message",
    "Use to send a message to a contact via their preferred channel (or a specified channel). The message is delivered through the connected channel adapter (WhatsApp, Telegram, SMS, or Gmail). Write operation — requires Pro tier or higher.",
    {
      contactId: z.string().uuid().describe("The contact ID to send the message to"),
      body: z.string().min(1).max(10000).describe("The message content"),
      channel: z
        .enum(["sms", "whatsapp", "email", "gmail", "telegram"])
        .optional()
        .describe("Channel to send through. Defaults to the contact's preferred channel"),
    },
    async (args) => {
      const res = await api.post("/api/v1/messages", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
