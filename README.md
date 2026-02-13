# @rentalot/mcp-server

MCP server for the [Rentalot](https://rentalot.ai) API. Manage rental properties, contacts, showings, conversations, and more from any AI assistant.

## Setup

### Claude Code

```bash
claude mcp add rentalot -e RENTALOT_API_KEY=ra_your_key -- npx -y @rentalot/mcp-server
```

### Codex (OpenAI)

```bash
codex mcp add --env RENTALOT_API_KEY=ra_your_key -- npx -y @rentalot/mcp-server
```

### Gemini CLI

```bash
gemini mcp add --transport stdio rentalot -- npx -y @rentalot/mcp-server
```

Then add the env var to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "rentalot": {
      "command": "npx",
      "args": ["-y", "@rentalot/mcp-server"],
      "env": { "RENTALOT_API_KEY": "ra_your_key" }
    }
  }
}
```

### Claude Desktop / Cursor / Windsurf

All three use the same JSON format — just different file paths:

| Client | Config file |
|--------|-------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) |
| Cursor | `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global) |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

```json
{
  "mcpServers": {
    "rentalot": {
      "command": "npx",
      "args": ["-y", "@rentalot/mcp-server"],
      "env": {
        "RENTALOT_API_KEY": "ra_your_key"
      }
    }
  }
}
```

### OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "rentalot": {
      "type": "local",
      "command": ["npx", "-y", "@rentalot/mcp-server"],
      "environment": { "RENTALOT_API_KEY": "ra_your_key" },
      "enabled": true
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RENTALOT_API_KEY` | Yes | — | API key from Settings > API Keys (prefixed `ra_`) |
| `RENTALOT_BASE_URL` | No | `https://rentalot.ai` | Override for self-hosted or local dev |

## Tools (37)

| Resource | Tools | Access |
|----------|-------|--------|
| Properties | `list_properties`, `get_property`, `create_property`, `update_property`, `delete_property` | Read: Starter+ / Write: Pro+ |
| Contacts | `list_contacts`, `get_contact`, `update_contact` | Read: Starter+ / Write: Pro+ |
| Showings | `list_showings`, `get_showing`, `create_showing`, `update_showing`, `delete_showing` | Read: Starter+ / Write: Pro+ |
| Events | `list_events` | Read: Starter+ |
| Conversations | `list_conversations`, `get_conversation`, `list_conversation_messages` | Read: Starter+ |
| Messages | `send_message` | Write: Pro+ |
| Drafts | `list_drafts`, `get_draft`, `create_draft`, `update_draft`, `send_draft`, `delete_draft` | Read: Starter+ / Write: Pro+ |
| Follow-ups | `list_followups`, `get_followup`, `create_followup`, `delete_followup` | Read: Starter+ / Write: Pro+ |
| Workflows | `list_workflows`, `get_workflow`, `trigger_workflow_run`, `list_workflow_runs`, `get_workflow_run` | Read: Starter+ / Write: Pro+ |
| Webhooks | `list_webhooks`, `create_webhook`, `delete_webhook`, `test_webhook` | Pro+ |

## Resources

- `docs://api-reference` — Full API reference (authentication, rate limits, pagination, errors, all resource schemas)

## Development

```bash
npm install
npm run build      # Compile TypeScript
npm run dev        # Run with tsx (hot reload)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test:e2e   # E2E test all 37 tools against local dev server
```

## License

MIT
