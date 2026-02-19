import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerBulkImportTools(server: McpServer, api: ApiClient) {
  server.tool(
    "bulk_create_properties",
    "Use to bulk-import up to 500 properties at once. Accepts flexible field names (Zillow/AppFolio aliases are auto-normalized). Returns a job ID for tracking progress. Supports Idempotency-Key header to prevent duplicates. Write operation — requires Pro tier or higher.",
    {
      properties: z
        .array(z.record(z.unknown()))
        .min(1)
        .max(500)
        .describe("Array of property objects with flexible field names (max 500)"),
      idempotencyKey: z
        .string()
        .optional()
        .describe("Optional idempotency key to prevent duplicate imports"),
    },
    async ({ properties, idempotencyKey }) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

      const res = await api.post("/api/v1/properties/bulk", { properties }, headers);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_bulk_import_job",
    "Use to check the status of a bulk property import job. Returns progress (total, created, failed), created property IDs, unmapped fields, and any errors.",
    {
      jobId: z.string().describe("The bulk import job ID returned from bulk_create_properties"),
    },
    async ({ jobId }) => {
      const res = await api.get(`/api/v1/properties/bulk/${jobId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
