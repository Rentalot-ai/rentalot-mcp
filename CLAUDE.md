# @rentalot/mcp-server

MCP server exposing the Rentalot REST API (37 tools) for AI assistants.

## Project Status

- **Private repo** — do not open-source or flip to public without explicit approval
- **No npm publish** — Ariel handles publishing manually when ready
- **Local dev only** — test against `make dev` at `http://localhost:3000`
- **Production waitlisted** — `https://rentalot.ai` is not live yet; do not target it

## Dev Setup

```bash
npm run build        # compile TypeScript → dist/
npm run dev          # run with tsx (hot reload)
npm start            # run compiled dist/index.js
```

Requires env vars:
- `RENTALOT_API_KEY` — API key from rentalot dashboard (Settings > API Keys, prefixed `ra_`)
- `RENTALOT_BASE_URL` — defaults to `https://rentalot.ai`, override to `http://localhost:3000` for local dev

## Architecture

- `src/index.ts` — entry point, registers all tools + resources, starts stdio transport
- `src/api-client.ts` — thin HTTP client wrapping fetch with Bearer auth
- `src/tools/*.ts` — one file per resource domain (properties, contacts, showings, etc.)
- `src/resources/api-docs.ts` — MCP resource with full API reference markdown

## Testing

The `.mcp.json` in the main `rentalot` repo points at this server's built `dist/index.js` for local testing with Claude Code against `make dev`.
