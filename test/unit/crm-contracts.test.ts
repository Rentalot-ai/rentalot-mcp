import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ApiClient } from "../../src/api-client.js";
import { createTestClient, mockApiClient } from "./helpers.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

let client: Client;
let api: ApiClient;

beforeEach(async () => {
  api = mockApiClient();
  ({ client } = await createTestClient(api));
});

async function callTool(name: string, arguments_: Record<string, unknown>) {
  return client.callTool({ name, arguments: arguments_ });
}

function textContent(result: Awaited<ReturnType<typeof callTool>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0]?.text ?? "";
}

describe("canonical CRM tool contracts", () => {
  it("accepts an optional property title and only canonical property statuses", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { id: UUID } });

    const valid = await callTool("create_property", {
      title: "Downtown Loft",
      address: "123 Main St",
      monthlyRent: 2400,
      bedrooms: 2,
      bathrooms: 1.5,
      status: "archived",
    });

    expect(valid.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith("/api/v1/properties", {
      title: "Downtown Loft",
      address: "123 Main St",
      monthlyRent: 2400,
      bedrooms: 2,
      bathrooms: 1.5,
      status: "archived",
    });

    const invalid = await callTool("create_property", {
      address: "123 Main St",
      monthlyRent: 2400,
      bedrooms: 2,
      bathrooms: 1.5,
      status: "draft",
    });

    expect(invalid.isError).toBe(true);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("passes an optional property title through update_property", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data: { id: UUID } });

    const result = await callTool("update_property", {
      propertyId: UUID,
      title: "Updated Loft",
    });

    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/properties/${UUID}`, {
      title: "Updated Loft",
    });
  });

  it("rejects an empty property update before making an API request", async () => {
    const result = await callTool("update_property", { propertyId: UUID });

    expect(result.isError).toBe(true);
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("requires an email or phone when creating a contact", async () => {
    const missingAddress = await callTool("create_contact", { name: "Alice" });

    expect(missingAddress.isError).toBe(true);
    expect(api.post).not.toHaveBeenCalled();

    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { id: UUID } });
    const phoneOnly = await callTool("create_contact", {
      name: "Alice",
      phone: "+15555550123",
    });

    expect(phoneOnly.isError).toBeFalsy();
    expect(api.post).toHaveBeenCalledWith("/api/v1/contacts", {
      name: "Alice",
      phone: "+15555550123",
    });
  });

  it("passes canonical contact notes through update_contact", async () => {
    vi.mocked(api.patch).mockResolvedValue({ status: 200, data: { id: UUID } });

    const result = await callTool("update_contact", {
      contactId: UUID,
      notes: "Prefers morning appointments",
    });

    expect(result.isError).toBeFalsy();
    expect(api.patch).toHaveBeenCalledWith(`/api/v1/contacts/${UUID}`, {
      notes: "Prefers morning appointments",
    });
  });
});

describe("CRM eligibility and effect metadata", () => {
  it("distinguishes trial CRM writes from paid-only resources", async () => {
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    expect(byName.get("create_property")?.description).toContain("development-only trial");
    expect(byName.get("create_contact")?.description).toContain("development-only trial");
    expect(byName.get("create_property")?.description).not.toContain("requires Pro tier or higher");
    expect(byName.get("create_draft")?.description).toContain("not available during the development-only trial");
    expect(byName.get("create_webhook")?.description).toContain("not available during the development-only trial");
  });

  it("describes delete operations as soft-delete or cancellation", async () => {
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    expect(byName.get("delete_property")?.description).toContain("soft-delete");
    expect(byName.get("delete_property")?.description).not.toContain("permanently");
    expect(byName.get("delete_contact")?.description).toContain("soft-delete");
    expect(byName.get("delete_contact")?.description).not.toContain("restored later");
    expect(byName.get("delete_showing")?.description).toContain("cancel");
    expect(byName.get("delete_showing")?.description).not.toContain("permanently delete a showing");
  });

  it("returns explicit soft-delete and cancellation outcomes", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    const property = await callTool("delete_property", { propertyId: UUID });
    const contact = await callTool("delete_contact", { contactId: UUID });
    const showing = await callTool("delete_showing", { showingId: UUID });

    expect(textContent(property)).toContain("soft-deleted");
    expect(textContent(contact)).toContain("soft-deleted");
    expect(textContent(showing)).toContain("cancelled");
  });
});
