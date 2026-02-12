# TODO — @rentalot/mcp-server

## Pre-Publish

- [x] Add `LICENSE` file (MIT)
- [x] Local dev test: add to rentalot repo `.mcp.json` with stdio pointing at built `dist/index.js`, `RENTALOT_BASE_URL=http://localhost:3000`, test tools from Claude Code against `make dev`
- [x] Test all 37 tools end-to-end against live dev API (35 pass, 2 known: `get_conversation` route missing, `send_message` needs channel adapter)
- [ ] Set up npm org `@rentalot` on npmjs.com
- [ ] First publish: `npm publish --access public`

## CI/CD

- [x] GitLab CI pipeline: lint + typecheck + build on push
- [ ] Automated npm publish on git tag (e.g. `v0.1.0`)

## Post-Publish

- [ ] Register in MCP registries (registry.modelcontextprotocol.io, mcpservers.org, Smithery)
- [ ] Add MCP setup docs page to rentalot Nextra site (`content/guides/mcp-setup.mdx`)
- [ ] Open-source: flip repo to public when ready for launch

## Future

- [ ] Remote MCP server — Streamable HTTP transport at `mcp.rentalot.ai/mcp` with OAuth 2.1
- [ ] Add more resources (rate limit info, enum values, webhook event catalog)
- [ ] MCP prompts — pre-built slash commands ("summarize recent conversations", "draft follow-up for contact")
