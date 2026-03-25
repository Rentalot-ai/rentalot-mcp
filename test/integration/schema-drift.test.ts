import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import { createTestClient } from "../unit/helpers.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Tool name → [HTTP method, OpenAPI path]
const TOOL_ENDPOINT_MAP: Record<string, [string, string]> = {
  // Properties
  list_properties: ["get", "/api/v1/properties"],
  get_property: ["get", "/api/v1/properties/{id}"],
  create_property: ["post", "/api/v1/properties"],
  update_property: ["patch", "/api/v1/properties/{id}"],
  delete_property: ["delete", "/api/v1/properties/{id}"],
  // Contacts
  list_contacts: ["get", "/api/v1/contacts"],
  get_contact: ["get", "/api/v1/contacts/{id}"],
  create_contact: ["post", "/api/v1/contacts"],
  update_contact: ["patch", "/api/v1/contacts/{id}"],
  delete_contact: ["delete", "/api/v1/contacts/{id}"],
  // Showings
  list_showings: ["get", "/api/v1/showings"],
  get_showing: ["get", "/api/v1/showings/{id}"],
  create_showing: ["post", "/api/v1/showings"],
  update_showing: ["patch", "/api/v1/showings/{id}"],
  delete_showing: ["delete", "/api/v1/showings/{id}"],
  check_showing_availability: ["get", "/api/v1/showings/availability"],
  // Events
  list_events: ["get", "/api/v1/events"],
  // Conversations
  list_conversations: ["get", "/api/v1/conversations"],
  get_conversation: ["get", "/api/v1/conversations/{id}"],
  search_conversations: ["get", "/api/v1/conversations/search"],
  list_conversation_messages: ["get", "/api/v1/conversations/{id}/messages"],
  // Messages
  send_message: ["post", "/api/v1/messages"],
  // Drafts
  list_drafts: ["get", "/api/v1/drafts"],
  get_draft: ["get", "/api/v1/drafts/{id}"],
  create_draft: ["post", "/api/v1/drafts"],
  update_draft: ["patch", "/api/v1/drafts/{id}"],
  send_draft: ["post", "/api/v1/drafts/{id}/send"],
  delete_draft: ["delete", "/api/v1/drafts/{id}"],
  // Follow-ups
  list_followups: ["get", "/api/v1/followups"],
  get_followup: ["get", "/api/v1/followups/{id}"],
  create_followup: ["post", "/api/v1/followups"],
  delete_followup: ["delete", "/api/v1/followups/{id}"],
  // Workflows
  list_workflows: ["get", "/api/v1/workflows"],
  get_workflow: ["get", "/api/v1/workflows/{id}"],
  create_workflow: ["post", "/api/v1/workflows"],
  update_workflow: ["patch", "/api/v1/workflows/{id}"],
  delete_workflow: ["delete", "/api/v1/workflows/{id}"],
  trigger_workflow_run: ["post", "/api/v1/workflows/runs"],
  list_workflow_runs: ["get", "/api/v1/workflows/runs"],
  get_workflow_run: ["get", "/api/v1/workflows/runs/{id}"],
  // Webhooks
  list_webhooks: ["get", "/api/v1/webhooks"],
  create_webhook: ["post", "/api/v1/webhooks"],
  get_webhook: ["get", "/api/v1/webhooks/{id}"],
  update_webhook: ["patch", "/api/v1/webhooks/{id}"],
  delete_webhook: ["delete", "/api/v1/webhooks/{id}"],
  test_webhook: ["post", "/api/v1/webhooks/{id}/test"],
  rotate_webhook_secret: ["post", "/api/v1/webhooks/{id}/rotate-secret"],
  // Settings
  get_followup_settings: ["get", "/api/v1/settings/followups"],
  update_followup_settings: ["patch", "/api/v1/settings/followups"],
  get_settings: ["get", "/api/v1/settings"],
  update_settings: ["patch", "/api/v1/settings"],
  // Property Images
  list_property_images: ["get", "/api/v1/properties/{id}/images"],
  presign_image_upload: ["post", "/api/v1/properties/{id}/images/presign"],
  confirm_image_upload: ["post", "/api/v1/properties/{id}/images/confirm"],
  delete_property_images: ["delete", "/api/v1/properties/{id}/images"],
  reorder_property_images: ["patch", "/api/v1/properties/{id}/images/reorder"],
  presign_image_batch: ["post", "/api/v1/properties/{id}/images/presign-batch"],
  confirm_image_batch: ["post", "/api/v1/properties/{id}/images/confirm-batch"],
  import_property_images: ["post", "/api/v1/properties/{id}/images/import"],
  get_image_import_job: ["get", "/api/v1/properties/{id}/images/import/{jobId}"],
  // Sessions
  list_sessions: ["get", "/api/v1/sessions"],
  get_session: ["get", "/api/v1/sessions/{id}"],
  review_session: ["patch", "/api/v1/sessions/{id}/review"],
  // Bulk Import
  bulk_create_properties: ["post", "/api/v1/properties/bulk"],
  get_bulk_import_job: ["get", "/api/v1/properties/bulk/{jobId}"],
};

// Params that exist in MCP but aren't in OpenAPI (header-based, MCP-only, etc.)
const IGNORED_MCP_PARAMS = new Set(["idempotencyKey"]);

interface OpenApiSpec {
  paths: Record<string, Record<string, {
    parameters?: Array<{ name: string; in: string; required?: boolean; schema?: JsonSchema }>;
    requestBody?: {
      content?: Record<string, { schema?: JsonSchema }>;
    };
  }>>;
}

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: unknown[];
  items?: JsonSchema;
}

const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/openapi.json");

let spec: OpenApiSpec;
let client: Client;
let toolSchemas: Map<string, Record<string, JsonSchema>>;

function openApiTypeToJsonSchemaType(t: string | undefined): string | undefined {
  if (!t) return undefined;
  if (t === "integer") return "number"; // MCP tools use z.number() for integers too
  return t;
}

function extractApiParams(
  method: string,
  pathDef: OpenApiSpec["paths"][string][string],
): { params: Record<string, { type?: string; required: boolean; enum?: unknown[] }>; } {
  const params: Record<string, { type?: string; required: boolean; enum?: unknown[] }> = {};

  // Path + query params
  for (const p of pathDef.parameters ?? []) {
    if (p.in === "path" || p.in === "query") {
      params[p.name] = {
        type: openApiTypeToJsonSchemaType(p.schema?.type),
        required: p.required ?? false,
        enum: p.schema?.enum,
      };
    }
  }

  // Request body properties
  const bodySchema = pathDef.requestBody?.content?.["application/json"]?.schema;
  if (bodySchema?.properties) {
    const required = new Set(bodySchema.required ?? []);
    for (const [name, schema] of Object.entries(bodySchema.properties)) {
      params[name] = {
        type: openApiTypeToJsonSchemaType(schema.type),
        required: required.has(name),
        enum: schema.enum,
      };
    }
  }

  return { params };
}

beforeAll(async () => {
  if (!existsSync(FIXTURE_PATH)) {
    throw new Error(
      `OpenAPI fixture not found at ${FIXTURE_PATH}.\n` +
      `Run 'make mcp-schema' in the rentalot repo (with dev server running) to generate it.`,
    );
  }

  spec = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8"));
  ({ client } = await createTestClient());

  const { tools } = await client.listTools();
  toolSchemas = new Map();
  for (const tool of tools) {
    toolSchemas.set(tool.name, (tool.inputSchema as { properties?: Record<string, JsonSchema> }).properties ?? {});
  }
});

describe("Schema drift detection", () => {
  it("every mapped tool has a matching OpenAPI endpoint", () => {
    const missing: string[] = [];
    for (const [toolName, [method, path]] of Object.entries(TOOL_ENDPOINT_MAP)) {
      const pathDef = spec.paths[path];
      if (!pathDef || !pathDef[method]) {
        missing.push(`${toolName} → ${method.toUpperCase()} ${path}`);
      }
    }
    expect(missing, `Missing OpenAPI endpoints:\n${missing.join("\n")}`).toEqual([]);
  });

  it("every MCP tool has a mapping entry", () => {
    const unmapped = [...toolSchemas.keys()].filter((name) => !TOOL_ENDPOINT_MAP[name]);
    expect(unmapped, `Unmapped MCP tools:\n${unmapped.join("\n")}`).toEqual([]);
  });

  for (const [toolName, [method, path]] of Object.entries(TOOL_ENDPOINT_MAP)) {
    describe(`${toolName} → ${method.toUpperCase()} ${path}`, () => {
      it("required API params exist in MCP schema", () => {
        const pathDef = spec.paths[path]?.[method];
        if (!pathDef) return; // covered by the endpoint existence test

        const { params: apiParams } = extractApiParams(method, pathDef);
        const mcpProps = toolSchemas.get(toolName) ?? {};

        const missingRequired: string[] = [];
        for (const [name, info] of Object.entries(apiParams)) {
          if (info.required && !mcpProps[name]) {
            missingRequired.push(name);
          }
        }

        expect(
          missingRequired,
          `Required API params missing from MCP tool ${toolName}: ${missingRequired.join(", ")}`,
        ).toEqual([]);
      });

      it("types are compatible", () => {
        const pathDef = spec.paths[path]?.[method];
        if (!pathDef) return;

        const { params: apiParams } = extractApiParams(method, pathDef);
        const mcpProps = toolSchemas.get(toolName) ?? {};

        const mismatches: string[] = [];
        for (const [name, apiInfo] of Object.entries(apiParams)) {
          const mcpProp = mcpProps[name];
          if (!mcpProp || !apiInfo.type) continue;

          const mcpType = openApiTypeToJsonSchemaType(mcpProp.type);
          const apiType = apiInfo.type;

          // Allow MCP to be more permissive (e.g. string for integer)
          if (mcpType && apiType && mcpType !== apiType) {
            mismatches.push(`${name}: MCP=${mcpType} vs API=${apiType}`);
          }
        }

        expect(
          mismatches,
          `Type mismatches in ${toolName}:\n${mismatches.join("\n")}`,
        ).toEqual([]);
      });

      it("enum values match", () => {
        const pathDef = spec.paths[path]?.[method];
        if (!pathDef) return;

        const { params: apiParams } = extractApiParams(method, pathDef);
        const mcpProps = toolSchemas.get(toolName) ?? {};

        const drifts: string[] = [];
        for (const [name, apiInfo] of Object.entries(apiParams)) {
          if (!apiInfo.enum) continue;
          const mcpProp = mcpProps[name];
          if (!mcpProp?.enum) continue;

          const apiValues = new Set(apiInfo.enum.map(String));
          const mcpValues = new Set(mcpProp.enum.map(String));

          // Check for API values missing from MCP (more concerning)
          const missingInMcp = [...apiValues].filter((v) => !mcpValues.has(v));
          if (missingInMcp.length) {
            drifts.push(`${name}: API has values missing from MCP: ${missingInMcp.join(", ")}`);
          }
        }

        expect(
          drifts,
          `Enum drift in ${toolName}:\n${drifts.join("\n")}`,
        ).toEqual([]);
      });
    });
  }

  it("reports MCP params not in API (informational)", () => {
    const extras: Array<{ tool: string; param: string }> = [];

    for (const [toolName, [method, path]] of Object.entries(TOOL_ENDPOINT_MAP)) {
      const pathDef = spec.paths[path]?.[method];
      if (!pathDef) continue;

      const { params: apiParams } = extractApiParams(method, pathDef);
      const mcpProps = toolSchemas.get(toolName) ?? {};

      for (const name of Object.keys(mcpProps)) {
        if (!apiParams[name] && !IGNORED_MCP_PARAMS.has(name)) {
          extras.push({ tool: toolName, param: name });
        }
      }
    }

    // This is informational — we log extras but don't fail
    if (extras.length) {
      console.log(
        "\nMCP params not found in OpenAPI spec (may be intentional):\n" +
        extras.map((e) => `  ${e.tool}.${e.param}`).join("\n"),
      );
    }
  });
});
