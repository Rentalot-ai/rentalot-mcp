import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
import { registerSettingsTools } from "./tools/settings.js";
import { registerPropertyImageTools } from "./tools/property-images.js";
import { registerSessionTools } from "./tools/sessions.js";
import { registerBulkImportTools } from "./tools/bulk-import.js";
import { registerApiDocsResource } from "./resources/api-docs.js";

export function createServer(api: ApiClient): McpServer {
  const server = new McpServer({
    name: "rentalot",
    version: "0.1.0",
  });

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
  registerSettingsTools(server, api);
  registerPropertyImageTools(server, api);
  registerSessionTools(server, api);
  registerBulkImportTools(server, api);

  registerApiDocsResource(server);

  return server;
}
