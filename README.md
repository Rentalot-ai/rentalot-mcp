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

### Get Your API Key

1. Go to [Rentalot API Keys](https://rentalot.ai/dash/settings?tab=api-keys)
2. Click **Create API Key**
3. Copy the key (starts with `ra_`)

### Authentication

You can provide your API key in two ways. Environment variables take priority over the config file.

**Option A: Config file (recommended)**

Save your key once and every MCP client picks it up automatically — no need to set `RENTALOT_API_KEY` in each client's config:

```bash
mkdir -p ~/.config/rentalot
cat > ~/.config/rentalot/config.yaml << 'EOF'
api_key: ra_your_key
EOF
chmod 600 ~/.config/rentalot/config.yaml
```

Then register the server without any env var:

```bash
# Claude Code
claude mcp add rentalot -- npx -y @rentalot/mcp-server

# Codex
codex mcp add -- npx -y @rentalot/mcp-server
```

**Option B: Environment variable**

Pass `RENTALOT_API_KEY` in your MCP client config (shown in the setup examples above). This overrides the config file.

**Config file reference** (`~/.config/rentalot/config.yaml`):

```yaml
# Required
api_key: ra_your_key

# Optional — defaults to https://rentalot.ai
# base_url: http://localhost:3000
```

> Respects `$XDG_CONFIG_HOME` — if set, looks for `$XDG_CONFIG_HOME/rentalot/config.yaml` instead.

**Resolution order:** `RENTALOT_API_KEY` env var > `api_key` in config file

## Skills

This repo ships agent skills in `skills/` that give coding agents deep knowledge of Rentalot's API, tool surface, and common workflows — so the agent can work with Rentalot without constantly re-reading docs.

### Claude Code

Symlink into your global skills directory:

```bash
ln -s "$(pwd)/skills/rentalot" ~/.claude/skills/rentalot
```

Or into a project-local `.claude/skills/` if you prefer per-project:

```bash
mkdir -p .claude/skills
ln -s "$(pwd)/skills/rentalot" .claude/skills/rentalot
```

Then invoke with `/rentalot` in any Claude Code session.

### Codex (OpenAI)

Copy the skill content into your Codex instructions file:

```bash
cat skills/rentalot/SKILL.md >> codex.md
```

Or reference it in your `AGENTS.md`:

```markdown
## Rentalot Reference
See [skills/rentalot/SKILL.md](skills/rentalot/SKILL.md) for full API and tool reference.
```

### Gemini CLI

Add to your Gemini system instructions (`~/.gemini/GEMINI.md` or project-level):

```markdown
## Rentalot Reference
See [skills/rentalot/SKILL.md](skills/rentalot/SKILL.md) for full API and tool reference.
```

### Generic / Other Agents

The skill file at `skills/rentalot/SKILL.md` is plain markdown with YAML frontmatter. Any agent that supports custom instructions or system prompts can use it:

1. **File reference** — point your agent's instructions config at the skill file
2. **Inline paste** — copy the content into your agent's system prompt or instructions file
3. **RAG / knowledge base** — index `skills/rentalot/SKILL.md` as a document

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
