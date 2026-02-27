import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerSettingsTools(server: McpServer, api: ApiClient) {
  server.tool(
    "get_followup_settings",
    "Use to get the current follow-up automation settings (enabled state, idle hours before trigger, max sequence steps).",
    {},
    async () => {
      const res = await api.get("/api/v1/settings/followups");
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "update_followup_settings",
    "Use to update follow-up automation settings. Only include fields you want to change. Write operation — requires Pro tier or higher.",
    {
      enabled: z.boolean().optional().describe("Enable or disable automatic follow-ups"),
      idleHours: z.number().optional().describe("Hours of inactivity before a follow-up is triggered"),
      maxSteps: z.number().int().optional().describe("Maximum number of follow-up steps in a sequence"),
    },
    async (args) => {
      const res = await api.patch("/api/v1/settings/followups", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_settings",
    "Use to get all account settings. Returns follow-up settings, agent preferences (showingCalendarId, showingBufferMinutes, maxShowingsPerDay), and email notification preferences (newInquiryNotifications, showingBookedNotifications, followupDueNotifications).",
    {},
    async () => {
      const res = await api.get("/api/v1/settings");
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "update_settings",
    "Use to update account settings. Only include fields you want to change. Write operation — requires Pro tier or higher.",
    {
      showingCalendarId: z
        .string()
        .nullable()
        .optional()
        .describe("Google Calendar ID for showing scheduling (null to unlink)"),
      showingBufferMinutes: z
        .union([z.literal(15), z.literal(30), z.literal(60)])
        .optional()
        .describe("Buffer time in minutes between showings (15, 30, or 60)"),
      maxShowingsPerDay: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Maximum showings per day (1–20)"),
      emailPreferences: z
        .object({
          newInquiryNotifications: z.boolean().optional().describe("Email on new inquiry"),
          showingBookedNotifications: z.boolean().optional().describe("Email on showing booked"),
          followupDueNotifications: z.boolean().optional().describe("Email on follow-up due"),
        })
        .optional()
        .describe("Email notification preferences"),
    },
    async (args) => {
      const res = await api.patch("/api/v1/settings", args);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
