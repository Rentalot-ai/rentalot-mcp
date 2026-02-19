import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";

export function registerPropertyImageTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_property_images",
    "Use to list all images for a property. Returns image metadata including URLs, alt text, and display order.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
    },
    async ({ propertyId }) => {
      const res = await api.get(`/api/v1/properties/${propertyId}/images`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "presign_image_upload",
    "Use to get a presigned URL for uploading a property image to R2 storage. Returns an upload URL and R2 key. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      fileName: z.string().describe("Original file name (e.g. kitchen.jpg)"),
      contentType: z.string().describe("MIME type (e.g. image/jpeg, image/png)"),
      sizeBytes: z.number().int().describe("File size in bytes"),
    },
    async ({ propertyId, ...body }) => {
      const res = await api.post(`/api/v1/properties/${propertyId}/images/presign`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "confirm_image_upload",
    "Use to confirm a property image upload after the file has been uploaded to the presigned URL. Creates the image record. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      r2Key: z.string().describe("The R2 storage key returned from presign_image_upload"),
      contentType: z.string().describe("MIME type of the uploaded file"),
      sizeBytes: z.number().int().describe("File size in bytes"),
      altText: z.string().max(500).optional().describe("Alt text for accessibility"),
    },
    async ({ propertyId, ...body }) => {
      const res = await api.post(`/api/v1/properties/${propertyId}/images/confirm`, body);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "delete_property_images",
    "Use to delete one or more images from a property. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      imageIds: z.array(z.string().uuid()).min(1).describe("Array of image UUIDs to delete"),
    },
    async ({ propertyId, imageIds }) => {
      const res = await api.delete(`/api/v1/properties/${propertyId}/images`, { imageIds });
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: "Images deleted successfully." }] };
    }
  );

  server.tool(
    "reorder_property_images",
    "Use to reorder images for a property. Pass the image IDs in the desired display order. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      imageIds: z.array(z.string().uuid()).min(1).describe("Image UUIDs in desired display order"),
    },
    async ({ propertyId, imageIds }) => {
      const res = await api.patch(`/api/v1/properties/${propertyId}/images/reorder`, { imageIds });
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "presign_image_batch",
    "Use to get presigned URLs for uploading up to 20 property images at once. Returns an upload URL and R2 key for each image. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      images: z
        .array(
          z.object({
            fileName: z.string().describe("Original file name (e.g. kitchen.jpg)"),
            contentType: z.string().describe("MIME type (e.g. image/jpeg, image/png)"),
            sizeBytes: z.number().int().describe("File size in bytes"),
          })
        )
        .min(1)
        .max(20)
        .describe("Array of image metadata objects (max 20)"),
    },
    async ({ propertyId, images }) => {
      const res = await api.post(`/api/v1/properties/${propertyId}/images/presign-batch`, { images });
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "confirm_image_batch",
    "Use to confirm multiple property image uploads after files have been uploaded to their presigned URLs. Creates image records for all confirmed uploads. Supports Idempotency-Key header. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      images: z
        .array(
          z.object({
            r2Key: z.string().describe("The R2 storage key returned from presign_image_batch"),
            contentType: z.string().describe("MIME type of the uploaded file"),
            sizeBytes: z.number().int().describe("File size in bytes"),
            altText: z.string().max(500).optional().describe("Alt text for accessibility"),
          })
        )
        .min(1)
        .max(20)
        .describe("Array of uploaded image metadata objects (max 20)"),
      idempotencyKey: z
        .string()
        .optional()
        .describe("Optional idempotency key to prevent duplicate confirmations"),
    },
    async ({ propertyId, images, idempotencyKey }) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

      const res = await api.post(
        `/api/v1/properties/${propertyId}/images/confirm-batch`,
        { images },
        headers
      );
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "import_property_images",
    "Use to import property images from external URLs. The server downloads from the URLs (SSRF-protected) and uploads to R2 asynchronously. Returns a job ID to track progress. Supports Idempotency-Key header. Write operation — requires Pro tier or higher.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      urls: z
        .array(z.string().url())
        .min(1)
        .max(20)
        .describe("Array of image URLs to import (max 20)"),
      idempotencyKey: z
        .string()
        .optional()
        .describe("Optional idempotency key to prevent duplicate imports"),
    },
    async ({ propertyId, urls, idempotencyKey }) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

      const res = await api.post(
        `/api/v1/properties/${propertyId}/images/import`,
        { urls },
        headers
      );
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );

  server.tool(
    "get_image_import_job",
    "Use to check the status of an image import job. Returns progress including how many images have been imported, failed, total bytes, and any errors.",
    {
      propertyId: z.string().uuid().describe("The property UUID"),
      jobId: z.string().describe("The import job ID returned from import_property_images"),
    },
    async ({ propertyId, jobId }) => {
      const res = await api.get(`/api/v1/properties/${propertyId}/images/import/${jobId}`);
      if (res.error) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error.message}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
    }
  );
}
