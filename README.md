# @rentalot/mcp-server

MCP (Model Context Protocol) server for the [Rentalot](https://rentalot.ai) API. Lets AI assistants (Claude, Cursor, Windsurf, etc.) manage rental properties, contacts, showings, and more via natural language.

## Quick Start

### Claude Code (one-liner)

```bash
claude mcp add rentalot -e RENTALOT_API_KEY=ra_your_api_key_here -- npx -y @rentalot/mcp-server
```

Verify with `/mcp` inside Claude Code.

### Claude Desktop / Cursor / Windsurf

Add to your MCP config (`.mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "rentalot": {
      "command": "npx",
      "args": ["-y", "@rentalot/mcp-server"],
      "env": {
        "RENTALOT_API_KEY": "ra_your_api_key_here"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RENTALOT_API_KEY` | Yes | — | Your Rentalot API key (starts with `ra_`) |
| `RENTALOT_BASE_URL` | No | `https://rentalot.ai` | API base URL (for self-hosted or dev) |

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
npm run dev    # Run with tsx (requires RENTALOT_API_KEY)
npm run build  # Compile TypeScript
```
