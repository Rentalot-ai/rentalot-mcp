#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ApiClient } from "./api-client.js";
import { registerPropertyTools } from "./tools/properties.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerShowingTools } from "./tools/showings.js";
import { registerEventTools } from "./tools/events.js";
import { registerConversationTools } from "./tools/conversations.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerDraftTools } from "./tools/drafts.js";
import { registerFollowupTools } from "./tools/followups.js";
import { registerWorkflowTools } from "./tools/workflows.js";
import { registerWebhookTools } from "./tools/webhooks.js";
import { registerApiDocsResource } from "./resources/api-docs.js";

const apiKey = process.env.RENTALOT_API_KEY;
if (!apiKey) {
  console.error("Error: RENTALOT_API_KEY environment variable is required.");
  console.error("Set it in your MCP config or export it before running.");
  process.exit(1);
}

const baseUrl = process.env.RENTALOT_BASE_URL ?? "https://rentalot.ai";

const api = new ApiClient({ baseUrl, apiKey });

const server = new McpServer({
  name: "rentalot",
  version: "0.1.0",
});

// Register all tools
registerPropertyTools(server, api);
registerContactTools(server, api);
registerShowingTools(server, api);
registerEventTools(server, api);
registerConversationTools(server, api);
registerMessageTools(server, api);
registerDraftTools(server, api);
registerFollowupTools(server, api);
registerWorkflowTools(server, api);
registerWebhookTools(server, api);

// Register resources
registerApiDocsResource(server);

// Start stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
