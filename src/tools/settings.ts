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
    "Use to get all account settings including agent preferences, working hours, voice settings, prescreening config, follow-up settings, and email notification preferences.",
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
    "Use to update account settings including agent preferences and email notifications. Only include fields you want to change. Write operation — requires Pro tier or higher.",
    {
      // Agent preferences
      agentName: z.string().max(50).optional().describe("Display name for the AI agent"),
      customInstructions: z.string().max(2000).optional().describe("Custom instructions for the AI agent"),
      timezone: z.string().max(50).optional().describe("IANA timezone (e.g. America/New_York)"),
      workingHours: z
        .object({
          start: z.string().describe("Start time in HH:mm format (e.g. 09:00)"),
          end: z.string().describe("End time in HH:mm format (e.g. 17:00)"),
          days: z.array(z.number().int().min(1).max(7)).min(1).max(7).describe("Working days (1=Mon, 7=Sun)"),
        })
        .optional()
        .describe("Agent working hours"),
      defaultShowingDuration: z
        .union([z.literal(30), z.literal(45), z.literal(60)])
        .optional()
        .describe("Default showing duration in minutes (30, 45, or 60)"),
      emailSignOff: z.string().max(200).optional().describe("Sign-off text for email messages"),
      publicChatIntro: z.string().max(500).optional().describe("Intro message for the public chat widget"),
      publicChatSuggestions: z
        .array(z.string().max(120))
        .max(4)
        .optional()
        .describe("Suggested questions for public chat (max 4)"),
      prescreeningEnabled: z.boolean().optional().describe("Enable public prescreening chat"),
      publicChatEnabled: z.boolean().optional().describe("Deprecated — use prescreeningEnabled"),
      profilePublic: z.boolean().optional().describe("Make agent profile publicly visible"),
      licenseNumber: z.string().max(100).optional().describe("Real estate license number"),
      publicPhone: z.string().max(30).optional().describe("Public-facing phone number"),
      followupEnabled: z.boolean().optional().describe("Enable automatic follow-ups"),
      followupIdleHours: z
        .union([z.literal(24), z.literal(48), z.literal(72)])
        .optional()
        .describe("Hours of inactivity before follow-up triggers (24, 48, or 72)"),
      followupMaxSteps: z.number().int().min(1).max(3).optional().describe("Max follow-up steps in a sequence (1–3)"),
      voiceEnabled: z.boolean().optional().describe("Enable voice agent"),
      voicePromptAddition: z.string().max(1000).optional().describe("Additional instructions for voice agent"),
      voiceFirstMessage: z.string().max(300).optional().describe("Voice agent's greeting message"),
      allowInternationalPhone: z.boolean().optional().describe("Accept international phone numbers"),
      bookingUrl: z.string().max(500).optional().describe("External booking URL (empty string to clear)"),
      externalLinkUrl: z.string().max(500).optional().describe("External link URL (empty string to clear)"),
      externalLinkLabel: z.string().max(100).optional().describe("Label for external link"),
      showExternalLinkOnProfile: z.boolean().optional().describe("Show external link on public profile"),
      showExternalLinkOnCompletion: z.boolean().optional().describe("Show external link after workflow completion"),
      callHumanEnabled: z.boolean().optional().describe("Allow callers to request transfer to a human"),
      followupTemplates: z
        .array(
          z.object({
            step: z.number().int().min(1).max(3).describe("Follow-up step number (1–3)"),
            template: z.string().min(1).max(2000).describe("Message template text"),
          }),
        )
        .max(3)
        .optional()
        .describe("Custom follow-up message templates"),
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
      // Email preferences
      emailPreferences: z
        .object({
          marketing: z.boolean().optional().describe("Marketing emails"),
          applicationNotifications: z.boolean().optional().describe("Application notification emails"),
          notifyProspectOnReview: z.boolean().optional().describe("Email prospect when their application is reviewed"),
          emailProspectMatches: z.boolean().optional().describe("Email prospects about matching properties"),
          schedulingEmailEnabled: z.boolean().optional().describe("Scheduling-related emails"),
          newInquiryNotifications: z.boolean().optional().describe("Email on new inquiry"),
          showingBookedNotifications: z.boolean().optional().describe("Email on showing booked"),
          followupDueNotifications: z.boolean().optional().describe("Email on follow-up due"),
          emailAutoSend: z.boolean().optional().describe("Automatically send drafted emails"),
          emailDailySendLimit: z.number().int().min(1).max(200).optional().describe("Max emails sent per day (1–200)"),
        })
        .optional()
        .describe("Email notification preferences"),
    },
    async (args) => {
      // Map deprecated publicChatEnabled → prescreeningEnabled
      const { publicChatEnabled, ...rest } = args;
      const body = {
        ...rest,
        ...(args.prescreeningEnabled !== undefined
          ? { prescreeningEnabled: args.prescreeningEnabled }
          : publicChatEnabled !== undefined
            ? { prescreeningEnabled: publicChatEnabled }
            : {}),
      };
      const res = await api.patch("/api/v1/settings", body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
