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

## Sync with rentalot v1 API

### Settings tools

- [x] `get_followup_settings` — `GET /api/v1/settings/followups` (returns `{ enabled, idleHours, maxSteps }`)
- [x] `update_followup_settings` — `PATCH /api/v1/settings/followups` (body: `{ enabled?, idleHours?, maxSteps? }`)

### Contact tools (missing)

- [x] `create_contact` — `POST /api/v1/contacts` (body: `{ name, email?, phone?, status?, channelPreference?, source?, referralSource? }`)
- [x] `delete_contact` — `DELETE /api/v1/contacts/{id}` (soft-delete, returns 204)

### Webhook tools (missing get + update)

- [x] `get_webhook` — `GET /api/v1/webhooks/{id}` (already in v1 API, MCP only has list/create/delete/test)
- [x] `update_webhook` — `PATCH /api/v1/webhooks/{id}` (body: `{ url?, events?, active?, description? }`)

### Conversation tools (missing search)

- [x] `search_conversations` — `GET /api/v1/conversations/search?query=...&limit=...`

### Showing tools (missing availability)

- [x] `check_showing_availability` — `GET /api/v1/showings/availability?propertyId=&preferredDate=&dateFrom=&dateTo=`

### Property image tools (entire resource — 5 tools)

- [x] `list_property_images` — `GET /api/v1/properties/{id}/images`
- [x] `presign_image_upload` — `POST /api/v1/properties/{id}/images/presign` (body: `{ fileName, contentType, sizeBytes }`)
- [x] `confirm_image_upload` — `POST /api/v1/properties/{id}/images/confirm` (body: `{ r2Key, contentType, sizeBytes, altText? }`)
- [x] `delete_property_images` — `DELETE /api/v1/properties/{id}/images` (body: `{ imageIds[] }`)
- [x] `reorder_property_images` — `PATCH /api/v1/properties/{id}/images/reorder` (body: `{ imageIds[] }`)

### Session tools (new resource — just added to v1 API)

- [x] `list_sessions` — `GET /api/v1/sessions?contactId=&workflowTemplateId=&status=&reviewStatus=&page=&limit=`
- [x] `get_session` — `GET /api/v1/sessions/{id}`
- [x] `review_session` — `PATCH /api/v1/sessions/{id}/review` (body: `{ reviewStatus: "approved"|"denied", reviewNotes? }`)

## Future

- [ ] Remote MCP server — Streamable HTTP transport at `mcp.rentalot.ai/mcp` with OAuth 2.1
- [ ] Add more resources (rate limit info, enum values, webhook event catalog)
- [ ] MCP prompts — pre-built slash commands ("summarize recent conversations", "draft follow-up for contact")
