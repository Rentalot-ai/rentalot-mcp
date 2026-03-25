import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestClient, mockApiClient } from "./helpers.js";
import type { ApiClient } from "../../src/api-client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const IMG_UUID = "660e8400-e29b-41d4-a716-446655440001";

let client: Client;
let api: ApiClient;

beforeEach(async () => {
  api = mockApiClient();
  ({ client, api } = await createTestClient(api));
});

async function callTool(name: string, args: Record<string, unknown> = {}) {
  return client.callTool({ name, arguments: args });
}

function textContent(result: Awaited<ReturnType<typeof callTool>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0]?.text ?? "";
}

describe("list_property_images", () => {
  it("returns images for a property", async () => {
    const data = [{ id: IMG_UUID, url: "https://cdn.example.com/img.jpg" }];
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("list_property_images", { propertyId: UUID });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textContent(result))).toEqual(data);
    expect(api.get).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images`);
  });

  it("returns error on failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Property not found" } });

    const result = await callTool("list_property_images", { propertyId: UUID });
    expect(result.isError).toBe(true);
  });
});

describe("presign_image_upload", () => {
  it("returns presigned URL", async () => {
    const data = { uploadUrl: "https://r2.example.com/upload", r2Key: "key-123" };
    vi.mocked(api.post).mockResolvedValue({ status: 200, data });

    const result = await callTool("presign_image_upload", {
      propertyId: UUID, fileName: "kitchen.jpg", contentType: "image/jpeg", sizeBytes: 102400,
    });
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images/presign`, {
      fileName: "kitchen.jpg", contentType: "image/jpeg", sizeBytes: 102400,
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 413, error: { code: "too_large", message: "File too large" } });

    const result = await callTool("presign_image_upload", {
      propertyId: UUID, fileName: "huge.jpg", contentType: "image/jpeg", sizeBytes: 999999999,
    });
    expect(result.isError).toBe(true);
  });
});

describe("confirm_image_upload", () => {
  it("confirms upload", async () => {
    const data = { id: IMG_UUID, url: "https://cdn.example.com/img.jpg" };
    vi.mocked(api.post).mockResolvedValue({ status: 201, data });

    const result = await callTool("confirm_image_upload", {
      propertyId: UUID, r2Key: "key-123", contentType: "image/jpeg", sizeBytes: 102400, altText: "Kitchen",
    });
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images/confirm`, {
      r2Key: "key-123", contentType: "image/jpeg", sizeBytes: 102400, altText: "Kitchen",
    });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Key not found" } });

    const result = await callTool("confirm_image_upload", {
      propertyId: UUID, r2Key: "bad", contentType: "image/jpeg", sizeBytes: 100,
    });
    expect(result.isError).toBe(true);
  });
});

describe("delete_property_images", () => {
  it("deletes images and returns success text", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    const result = await callTool("delete_property_images", { propertyId: UUID, imageIds: [IMG_UUID] });
    expect(result.isError).toBeFalsy();
    expect(textContent(result)).toBe("Images deleted successfully.");
    expect(api.delete).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images`, { imageIds: [IMG_UUID] });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Image not found" } });

    const result = await callTool("delete_property_images", { propertyId: UUID, imageIds: [IMG_UUID] });
    expect(result.isError).toBe(true);
  });
});

describe("reorder_property_images", () => {
  it("reorders images", async () => {
    const data = [{ id: IMG_UUID, order: 0 }];
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data });

    const result = await callTool("reorder_property_images", { propertyId: UUID, imageIds: [IMG_UUID] });
    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images/reorder`, { imageIds: [IMG_UUID] });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Missing IDs" } });

    const result = await callTool("reorder_property_images", { propertyId: UUID, imageIds: [IMG_UUID] });
    expect(result.isError).toBe(true);
  });
});

describe("presign_image_batch", () => {
  it("returns presigned URLs for batch", async () => {
    const data = [{ uploadUrl: "https://r2/1", r2Key: "k1" }];
    vi.mocked(api.post).mockResolvedValue({ status: 200, data });

    const images = [{ fileName: "a.jpg", contentType: "image/jpeg", sizeBytes: 100 }];
    const result = await callTool("presign_image_batch", { propertyId: UUID, images });
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images/presign-batch`, { images });
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Too many" } });

    const result = await callTool("presign_image_batch", {
      propertyId: UUID, images: [{ fileName: "a.jpg", contentType: "image/jpeg", sizeBytes: 100 }],
    });
    expect(result.isError).toBe(true);
  });
});

describe("confirm_image_batch", () => {
  it("confirms batch upload without idempotency key", async () => {
    const data = [{ id: IMG_UUID }];
    vi.mocked(api.post).mockResolvedValue({ status: 201, data });

    const images = [{ r2Key: "k1", contentType: "image/jpeg", sizeBytes: 100 }];
    const result = await callTool("confirm_image_batch", { propertyId: UUID, images });
    expect(result.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images/confirm-batch`, { images }, {});
  });

  it("passes idempotency key as header", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: [] });

    const images = [{ r2Key: "k1", contentType: "image/jpeg", sizeBytes: 100 }];
    await callTool("confirm_image_batch", { propertyId: UUID, images, idempotencyKey: "idem-batch" });
    expect(api.post).toHaveBeenCalledWith(
      `/api/v1/properties/${UUID}/images/confirm-batch`,
      { images },
      { "Idempotency-Key": "idem-batch" },
    );
  });

  it("returns error on failure", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 400, error: { code: "bad_request", message: "Bad" } });

    const result = await callTool("confirm_image_batch", {
      propertyId: UUID, images: [{ r2Key: "k1", contentType: "image/jpeg", sizeBytes: 100 }],
    });
    expect(result.isError).toBe(true);
  });
});

describe("get_image_import_job", () => {
  it("returns import job status", async () => {
    const data = { jobId: "j-1", status: "completed", imported: 3, failed: 0 };
    vi.mocked(api.get).mockResolvedValue({ status: 200, data });

    const result = await callTool("get_image_import_job", { propertyId: UUID, jobId: "j-1" });
    expect(result.isError).toBeFalsy();
    expect(api.get).toHaveBeenCalledWith(`/api/v1/properties/${UUID}/images/import/j-1`);
  });

  it("returns error on not found", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 404, error: { code: "not_found", message: "Job not found" } });

    const result = await callTool("get_image_import_job", { propertyId: UUID, jobId: "bad" });
    expect(result.isError).toBe(true);
  });
});
