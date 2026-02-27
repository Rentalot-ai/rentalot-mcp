import { describe, it, expect, beforeEach } from "vitest";
import { createTestClient } from "./helpers.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

let client: Client;

beforeEach(async () => {
  ({ client } = await createTestClient());
});

async function callTool(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  return result;
}

function textContent(result: Awaited<ReturnType<typeof callTool>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0]?.text ?? "";
}

describe("Input validation — missing required params", () => {
  it("get_property without propertyId returns error", async () => {
    const result = await callTool("get_property", {});
    expect(result.isError).toBe(true);
  });

  it("create_property without required fields returns error", async () => {
    const result = await callTool("create_property", { address: "123 Main" });
    expect(result.isError).toBe(true);
  });

  it("send_message without contactId returns error", async () => {
    const result = await callTool("send_message", { body: "hello" });
    expect(result.isError).toBe(true);
  });

  it("create_showing without required fields returns error", async () => {
    const result = await callTool("create_showing", {
      propertyId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.isError).toBe(true);
  });
});

describe("Input validation — invalid UUID", () => {
  it("get_property with non-UUID rejects", async () => {
    const result = await callTool("get_property", { propertyId: "not-a-uuid" });
    expect(result.isError).toBe(true);
  });

  it("get_contact with non-UUID rejects", async () => {
    const result = await callTool("get_contact", { contactId: "123" });
    expect(result.isError).toBe(true);
  });

  it("update_showing with non-UUID rejects", async () => {
    const result = await callTool("update_showing", { showingId: "bad", notes: "test" });
    expect(result.isError).toBe(true);
  });
});

describe("Input validation — invalid enum values", () => {
  it("list_properties with invalid status rejects", async () => {
    const result = await callTool("list_properties", { status: "imaginary" });
    expect(result.isError).toBe(true);
  });

  it("create_contact with invalid status rejects", async () => {
    const result = await callTool("create_contact", { name: "Alice", status: "alien" });
    expect(result.isError).toBe(true);
  });

  it("list_showings with invalid status rejects", async () => {
    const result = await callTool("list_showings", { status: "unknown" });
    expect(result.isError).toBe(true);
  });

  it("create_webhook with invalid event type rejects", async () => {
    const result = await callTool("create_webhook", {
      url: "https://example.com/hook",
      events: ["not.a.real.event"],
    });
    expect(result.isError).toBe(true);
  });
});
