import { describe, it, expect } from "vitest";
import { createTestClient } from "./helpers.js";

const EXPECTED_TOOLS = [
  // Properties (5)
  "list_properties", "get_property", "create_property", "update_property", "delete_property",
  // Contacts (5)
  "list_contacts", "get_contact", "create_contact", "update_contact", "delete_contact",
  // Showings (6)
  "list_showings", "get_showing", "create_showing", "update_showing", "delete_showing", "check_showing_availability",
  // Events (1)
  "list_events",
  // Conversations (4)
  "list_conversations", "get_conversation", "search_conversations", "list_conversation_messages",
  // Messages (1)
  "send_message",
  // Drafts (6)
  "list_drafts", "get_draft", "create_draft", "update_draft", "send_draft", "delete_draft",
  // Follow-ups (4)
  "list_followups", "get_followup", "create_followup", "delete_followup",
  // Workflows (8)
  "list_workflows", "get_workflow", "create_workflow", "update_workflow", "delete_workflow",
  "trigger_workflow_run", "list_workflow_runs", "get_workflow_run",
  // Webhooks (7)
  "list_webhooks", "create_webhook", "get_webhook", "update_webhook", "delete_webhook", "test_webhook", "rotate_webhook_secret",
  // Settings (4)
  "get_followup_settings", "update_followup_settings", "get_settings", "update_settings",
  // Property Images (9)
  "list_property_images", "presign_image_upload", "confirm_image_upload",
  "delete_property_images", "reorder_property_images",
  "presign_image_batch", "confirm_image_batch",
  "import_property_images", "get_image_import_job",
  // Sessions (3)
  "list_sessions", "get_session", "review_session",
  // Bulk Import (2)
  "bulk_create_properties", "get_bulk_import_job",
].sort();

describe("Server registration", () => {
  it("registers all expected tools", async () => {
    const { client } = await createTestClient();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();

    expect(names).toEqual(EXPECTED_TOOLS);
    expect(tools).toHaveLength(65);
  });

  it("every tool has a description", async () => {
    const { client } = await createTestClient();
    const { tools } = await client.listTools();

    for (const tool of tools) {
      expect(tool.description, `${tool.name} missing description`).toBeTruthy();
    }
  });

  it("registers the api-reference resource", async () => {
    const { client } = await createTestClient();
    const { resources } = await client.listResources();

    expect(resources).toHaveLength(1);
    expect(resources[0].uri).toBe("docs://api-reference");
  });
});
