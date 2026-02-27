/**
 * Resolve configuration from env vars or ~/.config/rentalot/config.yaml.
 *
 * Priority: environment variable > config file > default.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
}

function configDir(): string {
  return process.env.XDG_CONFIG_HOME
    ? join(process.env.XDG_CONFIG_HOME, "rentalot")
    : join(homedir(), ".config", "rentalot");
}

function readConfigFile(): Record<string, string> {
  const filePath = join(configDir(), "config.yaml");
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return {};
  }

  // Minimal YAML parser — supports only top-level `key: value` lines.
  const result: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function resolveConfig(): ResolvedConfig {
  const file = readConfigFile();

  const apiKey = process.env.RENTALOT_API_KEY || file.api_key || "";
  const baseUrl = process.env.RENTALOT_BASE_URL || file.base_url || "https://rentalot.ai";

  return { apiKey, baseUrl };
}

export { configDir };
