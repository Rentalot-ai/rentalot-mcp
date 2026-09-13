import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ApiClient } from "../../src/api-client.js";
import { createServer } from "../../src/server.js";

const PROPERTY_ID = "550e8400-e29b-41d4-a716-446655440000";
const CONTACT_ID = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

describe("registered CRM tools over a real MCP client and HTTP loopback", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let property: Record<string, unknown> | undefined;
  let contact: Record<string, unknown> | undefined;
  let client: Client;

  beforeEach(async () => {
    property = undefined;
    contact = undefined;
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;

      if (url.endsWith("/api/v1/properties") && method === "POST") {
        property = { id: PROPERTY_ID, ...body, status: body?.status ?? "active" };
        return new Response(JSON.stringify({ data: property }), { status: 201 });
      }
      if (url.endsWith(`/api/v1/properties/${PROPERTY_ID}`) && method === "GET") {
        return new Response(JSON.stringify({ data: property }), { status: 200 });
      }
      if (url.endsWith(`/api/v1/properties/${PROPERTY_ID}`) && method === "PATCH") {
        property = { ...property, ...body };
        return new Response(JSON.stringify({ data: property }), { status: 200 });
      }
      if (url.endsWith("/api/v1/contacts") && method === "POST") {
        contact = { id: CONTACT_ID, ...body, status: body?.status ?? "prospect", role: body?.role ?? "prospect" };
        return new Response(JSON.stringify({ data: contact }), { status: 201 });
      }
      if (url.endsWith(`/api/v1/contacts/${CONTACT_ID}`) && method === "GET") {
        return new Response(JSON.stringify({ data: contact }), { status: 200 });
      }
      if (url.endsWith(`/api/v1/contacts/${CONTACT_ID}`) && method === "PATCH") {
        contact = { ...contact, ...body };
        return new Response(JSON.stringify({ data: contact }), { status: 200 });
      }
      if (method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify({ error: { code: "not_found", message: "Unhandled loopback request" } }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const server = createServer(new ApiClient({ baseUrl: "http://loopback.test", apiKey: "ra_fake" }));
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "loopback-test", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers and executes the canonical private property/contact job", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toContain("create_property");
    expect(tools.map((tool) => tool.name)).toContain("create_contact");

    const propertyCreate = await client.callTool({
      name: "create_property",
      arguments: {
        title: "Private Example Home",
        address: "123 Main St",
        monthlyRent: 2400,
        bedrooms: 2,
        bathrooms: 1.5,
        status: "active",
      },
    });
    expect(propertyCreate.isError).toBeFalsy();

    const contactCreate = await client.callTool({
      name: "create_contact",
      arguments: { name: "Alice Example", email: "alice@example.com" },
    });
    expect(contactCreate.isError).toBeFalsy();

    const propertyRead = await client.callTool({ name: "get_property", arguments: { propertyId: PROPERTY_ID } });
    const contactRead = await client.callTool({ name: "get_contact", arguments: { contactId: CONTACT_ID } });
    expect(propertyRead.isError).toBeFalsy();
    expect(contactRead.isError).toBeFalsy();

    const propertyUpdate = await client.callTool({
      name: "update_property",
      arguments: { propertyId: PROPERTY_ID, title: "Updated Example Home" },
    });
    const contactUpdate = await client.callTool({
      name: "update_contact",
      arguments: { contactId: CONTACT_ID, notes: "Prefers morning appointments" },
    });
    expect(propertyUpdate.isError).toBeFalsy();
    expect(contactUpdate.isError).toBeFalsy();

    expect((property as { title?: string } | undefined)?.title).toBe("Updated Example Home");
    expect((contact as { notes?: string } | undefined)?.notes).toBe("Prefers morning appointments");
    expect(fetchMock.mock.calls.every(([, init]) => {
      const headers = (init as RequestInit | undefined)?.headers as Record<string, string> | undefined;
      return headers?.Authorization === "Bearer ra_fake";
    })).toBe(true);
  });
});
