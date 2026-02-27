import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { join } from "node:path";

// Mock fs before importing config module
vi.mock("node:fs", () => ({
  readFileSync: vi.fn(() => {
    throw new Error("ENOENT");
  }),
}));

import { readFileSync } from "node:fs";
import { resolveConfig, configDir } from "../../src/config.js";

const mockedReadFile = vi.mocked(readFileSync);

// Snapshot env vars we touch so we can restore them
const ENV_KEYS = ["RENTALOT_API_KEY", "RENTALOT_BASE_URL", "XDG_CONFIG_HOME"] as const;
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  mockedReadFile.mockReset().mockImplementation(() => {
    throw new Error("ENOENT");
  });
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

// ── configDir ──────────────────────────────────────────────

describe("configDir", () => {
  it("defaults to ~/.config/rentalot", () => {
    const dir = configDir();
    expect(dir).toMatch(/\.config\/rentalot$/);
  });

  it("respects XDG_CONFIG_HOME", () => {
    process.env.XDG_CONFIG_HOME = "/tmp/xdg";
    expect(configDir()).toBe(join("/tmp/xdg", "rentalot"));
  });
});

// ── resolveConfig — env vars ───────────────────────────────

describe("resolveConfig — env vars", () => {
  it("reads api key from env", () => {
    process.env.RENTALOT_API_KEY = "ra_env";
    const cfg = resolveConfig();
    expect(cfg.apiKey).toBe("ra_env");
  });

  it("reads base url from env", () => {
    process.env.RENTALOT_API_KEY = "ra_env";
    process.env.RENTALOT_BASE_URL = "http://localhost:3000";
    const cfg = resolveConfig();
    expect(cfg.baseUrl).toBe("http://localhost:3000");
  });

  it("returns empty apiKey when nothing is configured", () => {
    const cfg = resolveConfig();
    expect(cfg.apiKey).toBe("");
  });

  it("defaults baseUrl to https://rentalot.ai", () => {
    const cfg = resolveConfig();
    expect(cfg.baseUrl).toBe("https://rentalot.ai");
  });
});

// ── resolveConfig — config file ────────────────────────────

describe("resolveConfig — config file", () => {
  it("reads api_key from yaml", () => {
    mockedReadFile.mockReturnValue("api_key: ra_file\n");
    const cfg = resolveConfig();
    expect(cfg.apiKey).toBe("ra_file");
  });

  it("reads base_url from yaml", () => {
    mockedReadFile.mockReturnValue("api_key: ra_file\nbase_url: http://localhost:4000\n");
    const cfg = resolveConfig();
    expect(cfg.baseUrl).toBe("http://localhost:4000");
  });

  it("handles double-quoted values", () => {
    mockedReadFile.mockReturnValue('api_key: "ra_quoted"\n');
    expect(resolveConfig().apiKey).toBe("ra_quoted");
  });

  it("handles single-quoted values", () => {
    mockedReadFile.mockReturnValue("api_key: 'ra_single'\n");
    expect(resolveConfig().apiKey).toBe("ra_single");
  });

  it("skips comment lines", () => {
    mockedReadFile.mockReturnValue("# api_key: ra_nope\napi_key: ra_yes\n");
    expect(resolveConfig().apiKey).toBe("ra_yes");
  });

  it("skips blank lines", () => {
    mockedReadFile.mockReturnValue("\n\napi_key: ra_blank\n\n");
    expect(resolveConfig().apiKey).toBe("ra_blank");
  });

  it("ignores lines without colon", () => {
    mockedReadFile.mockReturnValue("garbage\napi_key: ra_ok\n");
    expect(resolveConfig().apiKey).toBe("ra_ok");
  });
});

// ── resolveConfig — priority ───────────────────────────────

describe("resolveConfig — priority (env > file)", () => {
  it("env var overrides config file for api_key", () => {
    process.env.RENTALOT_API_KEY = "ra_env";
    mockedReadFile.mockReturnValue("api_key: ra_file\n");
    expect(resolveConfig().apiKey).toBe("ra_env");
  });

  it("env var overrides config file for base_url", () => {
    process.env.RENTALOT_BASE_URL = "http://env:3000";
    mockedReadFile.mockReturnValue("base_url: http://file:4000\n");
    expect(resolveConfig().baseUrl).toBe("http://env:3000");
  });

  it("falls back to file when env is not set", () => {
    mockedReadFile.mockReturnValue("api_key: ra_file\nbase_url: http://file:4000\n");
    const cfg = resolveConfig();
    expect(cfg.apiKey).toBe("ra_file");
    expect(cfg.baseUrl).toBe("http://file:4000");
  });
});

// ── resolveConfig — missing file ───────────────────────────

describe("resolveConfig — missing config file", () => {
  it("gracefully falls back when file does not exist", () => {
    mockedReadFile.mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    process.env.RENTALOT_API_KEY = "ra_env";
    const cfg = resolveConfig();
    expect(cfg.apiKey).toBe("ra_env");
    expect(cfg.baseUrl).toBe("https://rentalot.ai");
  });

  it("returns empty apiKey when file missing and no env", () => {
    expect(resolveConfig().apiKey).toBe("");
  });
});
