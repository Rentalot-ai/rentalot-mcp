# TODO — @rentalot/mcp-server

> **Task tracking has moved to beads** (`bd ready` to see actionable items).
> This file is kept as a historical record of completed work. New tasks go in beads.

## Pre-Publish

- [x] Add `LICENSE` file (MIT)
- [x] Local dev test: add to rentalot repo `.mcp.json` with stdio pointing at built `dist/index.js`, `RENTALOT_BASE_URL=http://localhost:3000`, test tools from Claude Code against `make dev`
- [x] Test all 37 tools end-to-end against live dev API (35 pass, 2 known: `get_conversation` route missing, `send_message` needs channel adapter)

## CI/CD

- [x] GitLab CI pipeline: lint + typecheck + build on push

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

### RFC 9457 error format migration

- [x] All v1 API error responses changed from `{ error: { code, message } }` to RFC 9457 Problem Details: `{ type, title, status, detail, errors? }`. Content-Type is now `application/problem+json`. `api-client.ts` now handles both legacy and RFC 9457 error shapes.

### New endpoint: webhook secret rotation

- [x] `rotate_webhook_secret` — `POST /api/v1/webhooks/{id}/rotate-secret`. Generates a new HMAC signing secret. Returns `{ data: { webhookId, secret } }`. Requires Pro+.

### Response shape changes

- [x] DELETE endpoints now return `204` idempotently (no error on already-deleted resources). Already handled — `api-client.ts` returns `{ status }` on 204, and DELETE tools return success messages.
- [x] POST create endpoints now return `Location` header with the resource URL. Informational only — no MCP change needed.
- [x] `list_conversation_messages` now returns full `pagination` object (`{ page, limit, total, totalPages }`) instead of just `{ page, limit }`. Updated tool description.
- [x] `search_conversations` response changed from `{ data, total }` to `{ data, pagination: { page, limit, total, totalPages } }`. Added `page` param and updated description.

### Contact `language` field

- [x] Add `language` (string, default `"en"`) to `create_contact` and `update_contact` tool parameter schemas. v1 API now accepts it on both POST and PATCH. GET responses also include it.

### Contact `role` field (v0.6.0)

- [x] Add `role` enum (`prospect`, `tenant`, `landlord`, `property_manager`, `vendor`, `other`) to `create_contact` and `update_contact` parameter schemas.
- [x] Add `role` filter param to `list_contacts`.
- [x] Add missing `referralSource` to `update_contact` parameter schema (was only on `create_contact`).

## Future

See `bd ready` and `bd list` for open tasks (pre-publish, CI/CD, post-publish, and future items are all tracked there now).
