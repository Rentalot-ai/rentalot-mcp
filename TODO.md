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

### Bulk import tools (new — 2 tools)

- [x] `bulk_create_properties` — `POST /api/v1/properties/bulk` (body: `{ properties: Record<string, unknown>[] }`, max 500). Flexible field names (Zillow/AppFolio aliases auto-normalized). Returns `202 { data: { jobId, status, total } }`. Supports `Idempotency-Key`. Requires Pro+.
- [x] `get_bulk_import_job` — `GET /api/v1/properties/bulk/{jobId}` (returns `{ jobId, status, total, created, failed, createdPropertyIds, unmappedFields, errors[], createdAt, completedAt }`)

### Workflow write tools (new — 3 tools)

- [x] `create_workflow` — `POST /api/v1/workflows` (body: `{ name, steps[], triggerType, description?, triggerConfig?, exitConditions?, questionConfig?, completionConfig?, isPublic?, introMessage?, voiceConfig?, isActive? }`). Slug auto-generated from name. Returns `201 { data: WorkflowTemplateFull }`. Supports `Idempotency-Key`. Requires Pro+.
- [x] `update_workflow` — `PATCH /api/v1/workflows/{id}` (body: all fields optional, same as create). Execution-field changes auto-create version snapshot. Returns `200 { data: WorkflowTemplateFull }`. Requires Pro+.
- [x] `delete_workflow` — `DELETE /api/v1/workflows/{id}` (fails with 409 if active runs exist). Returns `204`. Requires Pro+.

### Webhook event types update

- [x] Add `workflow.created`, `workflow.updated`, `workflow.deleted`, `bulk_import.completed` to `WEBHOOK_EVENTS` array in `src/tools/webhooks.ts`. These are now accepted by the v1 API in `create_webhook` and `update_webhook` `events` field.

### Workflow GET response shape change

- [x] `list_workflows` and `get_workflow` now return full template detail (steps, triggerConfig, exitConditions, questionConfig, completionConfig, introMessage, voiceConfig, currentVersion, updatedAt). No MCP code change needed (passthrough), but update tool descriptions to mention that full config is included in the response.

### Batch image tools (new — 2 tools)

- [x] `presign_image_batch` — `POST /api/v1/properties/{id}/images/presign-batch` (body: `{ images: [{ fileName, contentType, sizeBytes }] }`, max 20). Returns `{ data: [{ fileName, uploadUrl, r2Key }] }`.
- [x] `confirm_image_batch` — `POST /api/v1/properties/{id}/images/confirm-batch` (body: `{ images: [{ r2Key, contentType, sizeBytes, altText? }] }`, max 20). Supports `Idempotency-Key`. Returns `{ data: [{ id, url, altText, order }] }`.

### Image import by URL tools (new — 2 tools)

- [x] `import_property_images` — `POST /api/v1/properties/{id}/images/import` (body: `{ urls: string[] }`, max 20). Server downloads from URLs (SSRF-protected), uploads to R2 asynchronously via Inngest. Supports `Idempotency-Key`. Returns `202 { data: { jobId, status: "pending", totalUrls } }`. Requires Pro+.
- [x] `get_image_import_job` — `GET /api/v1/properties/{id}/images/import/{jobId}` (returns `{ jobId, status, totalUrls, imported, failed, totalBytes, errors[], createdAt, completedAt }`). Note: `imageImportJobIds` also returned in `get_bulk_import_job` response for bulk imports that included image URLs.

### Contact type update

- [x] Add `appliedAt` (ISO 8601 timestamp, nullable) to contact type — v1 API GET now returns it. Auto-set when status → `applicant`, cleared on other transitions. `notes` field was also added but is stripped from the public API.

### Settings schema update

- [x] `get_settings` / `update_settings` — response now includes 3 new agent pref fields: `showingCalendarId` (string|null), `showingBufferMinutes` (15|30|60), `maxShowingsPerDay` (1-20). `emailPreferences` now includes: `newInquiryNotifications`, `showingBookedNotifications`, `followupDueNotifications` (all boolean). Update tool descriptions and parameter schemas to match.

## Future

- [ ] Remote MCP server — Streamable HTTP transport at `mcp.rentalot.ai/mcp` with OAuth 2.1
- [ ] Add more resources (rate limit info, enum values, webhook event catalog)
- [ ] MCP prompts — pre-built slash commands ("summarize recent conversations", "draft follow-up for contact")
