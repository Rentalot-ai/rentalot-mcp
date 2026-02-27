import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { vi } from "vitest";
import { ApiClient } from "../../src/api-client.js";
import { createServer } from "../../src/server.js";

export function mockApiClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  } as unknown as ApiClient;
}

export async function createTestClient(api?: ApiClient) {
  const mockApi = api ?? mockApiClient();
  const server = createServer(mockApi);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);

  return { client, server, api: mockApi };
}
