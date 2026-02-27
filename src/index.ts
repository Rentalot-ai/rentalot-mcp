#!/usr/bin/env bun

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ApiClient } from "./api-client.js";
import { resolveConfig, configDir } from "./config.js";
import { createServer } from "./server.js";

const { apiKey, baseUrl } = resolveConfig();
if (!apiKey) {
  console.error("Error: RENTALOT_API_KEY not found.");
  console.error("");
  console.error("Set it via environment variable:");
  console.error("  export RENTALOT_API_KEY=ra_your_key");
  console.error("");
  console.error("Or save it to a config file:");
  console.error(`  mkdir -p ${configDir()}`);
  console.error(`  echo 'api_key: ra_your_key' > ${configDir()}/config.yaml`);
  console.error(`  chmod 600 ${configDir()}/config.yaml`);
  process.exit(1);
}

const api = new ApiClient({ baseUrl, apiKey });
const server = createServer(api);

const transport = new StdioServerTransport();
await server.connect(transport);
