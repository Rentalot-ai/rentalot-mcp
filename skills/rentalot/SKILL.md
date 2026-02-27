---
name: rentalot
description: "Comprehensive reference for the Rentalot platform — AI-powered rental agent with 37 MCP tools across 14 domains. Use when working with Rentalot API, MCP server, property management, contacts, showings, messaging, workflows, or any Rentalot integration."
---

# Rentalot

Rentalot is an AI-powered rental agent platform that manages inquiry response, showing scheduling, messaging, and follow-ups across WhatsApp, Telegram, SMS, and Gmail.

This skill covers the full tool surface, common workflows, API patterns, and domain knowledge for building with Rentalot.

## Quick Reference

| Domain | Tools | Key Operations |
|--------|-------|----------------|
| Properties | 5 | CRUD + filtering by status/rent/bedrooms/city |
| Contacts | 5 | CRUD + search + soft-delete |
| Showings | 6 | CRUD + availability check |
| Conversations | 4 | List, get, search, messages |
| Messages | 1 | Send via any channel |
| Drafts | 6 | CRUD + send + auto-expire (24h) |
| Follow-ups | 5 | Schedule + cancel automated messages |
| Workflows | 8 | Template CRUD + trigger runs + track status |
| Webhooks | 7 | CRUD + test + HMAC-SHA256 signing |
| Settings | 4 | Follow-up settings + account preferences |
| Property Images | 9 | Upload (single/batch/URL import) + delete + reorder |
| Sessions | 3 | List, get, review (approve/deny) |
| Bulk Import | 2 | Create up to 500 properties + track job |
| Events | 1 | List calendar events |

**Total: 37 tools** — ~15 read-only, ~22 write (Pro+ plan required for writes)

---

## Tool Reference by Domain

### Properties

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_properties` | GET | `/api/v1/properties` |
| `get_property` | GET | `/api/v1/properties/{id}` |
| `create_property` | POST | `/api/v1/properties` |
| `update_property` | PATCH | `/api/v1/properties/{id}` |
| `delete_property` | DELETE | `/api/v1/properties/{id}` |

**Statuses:** `active`, `rented`, `inactive`, `maintenance`, `draft`, `archived`

**Filters:** `status`, `minRent`, `maxRent`, `minBedrooms`, `city`, `page`, `limit`

**Fields:** address, monthlyRent, bedrooms, bathrooms, city, state, zip, status, description, features, availabilityDate, petPolicy, parking, laundry

### Contacts

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_contacts` | GET | `/api/v1/contacts` |
| `get_contact` | GET | `/api/v1/contacts/{id}` |
| `create_contact` | POST | `/api/v1/contacts` |
| `update_contact` | PATCH | `/api/v1/contacts/{id}` |
| `delete_contact` | DELETE | `/api/v1/contacts/{id}` |

**Statuses:** `prospect` → `scheduled` → `applicant` → `renter` → `archived`

**Special fields:**
- `appliedAt` — ISO 8601 timestamp, auto-set when status → `applicant`, cleared on other transitions
- `channelPreference` — preferred messaging channel
- `source` / `referralSource` — lead attribution
- Delete is a soft-delete (via request body)

**Filters:** `status`, `channel`, `search` (free-text), `page`, `limit`

### Showings

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_showings` | GET | `/api/v1/showings` |
| `get_showing` | GET | `/api/v1/showings/{id}` |
| `create_showing` | POST | `/api/v1/showings` |
| `update_showing` | PATCH | `/api/v1/showings/{id}` |
| `check_showing_availability` | GET | `/api/v1/showings/availability` |
| `delete_showing` | DELETE | `/api/v1/showings/{id}` |

**Statuses:** `pending` → `confirmed` → `completed` | `cancelled`

**Availability check params:** `propertyId` (required), `preferredDate?`, `dateFrom?`, `dateTo?`

**Fields:** propertyId, contactId, title, startTime, endTime, description, timeZone, location, notes

### Conversations

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_conversations` | GET | `/api/v1/conversations` |
| `get_conversation` | GET | `/api/v1/conversations/{id}` |
| `search_conversations` | GET | `/api/v1/conversations/search` |
| `list_conversation_messages` | GET | `/api/v1/conversations/{id}/messages` |

**Statuses:** `active`, `archived`

**Channels:** whatsapp, telegram, sms, gmail

**Search:** `query` param (max 200 chars), keyword-based

### Messages

| Tool | Method | Endpoint |
|------|--------|----------|
| `send_message` | POST | `/api/v1/messages` |

**Params:** `contactId` (required), `body` (1–10,000 chars), `channel?`

**Channels:** `sms`, `whatsapp`, `email`, `gmail`, `telegram`

If no channel specified, uses contact's preferred channel.

### Drafts

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_drafts` | GET | `/api/v1/drafts` |
| `get_draft` | GET | `/api/v1/drafts/{id}` |
| `create_draft` | POST | `/api/v1/drafts` |
| `update_draft` | PATCH | `/api/v1/drafts/{id}` |
| `send_draft` | POST | `/api/v1/drafts/{id}/send` |
| `delete_draft` | DELETE | `/api/v1/drafts/{id}` |

**Statuses:** `pending`, `sent`, `expired`

Drafts auto-expire after 24 hours. Create → review → send or let expire.

### Follow-ups

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_followups` | GET | `/api/v1/followups` |
| `get_followup` | GET | `/api/v1/followups/{id}` |
| `create_followup` | POST | `/api/v1/followups` |
| `delete_followup` | DELETE | `/api/v1/followups/{id}` |

**Statuses:** `pending` → `processing` → `sent` | `cancelled` | `failed`

**Params:** contactId, conversationId, scheduledAt (ISO 8601), sequenceStep?

Only pending follow-ups can be deleted.

### Workflows

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_workflows` | GET | `/api/v1/workflows` |
| `get_workflow` | GET | `/api/v1/workflows/{id}` |
| `create_workflow` | POST | `/api/v1/workflows` |
| `update_workflow` | PATCH | `/api/v1/workflows/{id}` |
| `delete_workflow` | DELETE | `/api/v1/workflows/{id}` |
| `trigger_workflow_run` | POST | `/api/v1/workflows/{id}/runs` |
| `list_workflow_runs` | GET | `/api/v1/workflow-runs` |
| `get_workflow_run` | GET | `/api/v1/workflow-runs/{id}` |

**Trigger types:** `manual`, `deep_link`, `automatic`, `scheduled`

**Run statuses:** `pending` → `running` → `paused` → `completed` | `cancelled` | `failed`

**Template fields:** name, steps[], triggerType, description, triggerConfig, exitConditions, questionConfig, completionConfig, isPublic, introMessage, voiceConfig, isActive

**Notes:**
- Slug auto-generated from name
- Execution-field changes auto-create version snapshots
- Delete fails with 409 if active runs exist
- Supports Idempotency-Key

### Webhooks

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_webhooks` | GET | `/api/v1/webhooks` |
| `get_webhook` | GET | `/api/v1/webhooks/{id}` |
| `create_webhook` | POST | `/api/v1/webhooks` |
| `update_webhook` | PATCH | `/api/v1/webhooks/{id}` |
| `delete_webhook` | DELETE | `/api/v1/webhooks/{id}` |
| `test_webhook` | POST | `/api/v1/webhooks/{id}/test` |

**Events (12):**
- `inquiry.created`, `message.received`, `message.sent`
- `showing.booked`, `showing.cancelled`
- `contact.updated`, `property.updated`
- `workflow.completed`, `workflow.created`, `workflow.updated`, `workflow.deleted`
- `bulk_import.completed`

**URL must be HTTPS.** Payloads signed with HMAC-SHA256.

### Settings

| Tool | Method | Endpoint |
|------|--------|----------|
| `get_followup_settings` | GET | `/api/v1/settings/followups` |
| `update_followup_settings` | PATCH | `/api/v1/settings/followups` |
| `get_settings` | GET | `/api/v1/settings` |
| `update_settings` | PATCH | `/api/v1/settings` |

**Follow-up settings:** enabled, idleHours, maxSteps

**Account settings:** showingCalendarId, showingBufferMinutes (15/30/60), maxShowingsPerDay (1–20), emailPreferences (newInquiryNotifications, showingBookedNotifications, followupDueNotifications)

### Property Images

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_property_images` | GET | `/api/v1/properties/{id}/images` |
| `presign_image_upload` | POST | `/api/v1/properties/{id}/images/presign` |
| `confirm_image_upload` | POST | `/api/v1/properties/{id}/images/confirm` |
| `delete_property_images` | DELETE | `/api/v1/properties/{id}/images` |
| `reorder_property_images` | PATCH | `/api/v1/properties/{id}/images/reorder` |
| `presign_image_batch` | POST | `/api/v1/properties/{id}/images/presign-batch` |
| `confirm_image_batch` | POST | `/api/v1/properties/{id}/images/confirm-batch` |
| `import_property_images` | POST | `/api/v1/properties/{id}/images/import` |
| `get_image_import_job` | GET | `/api/v1/properties/{id}/images/import/{jobId}` |

**Three upload flows:**

1. **Single:** `presign_image_upload` → upload to R2 URL → `confirm_image_upload`
2. **Batch (up to 20):** `presign_image_batch` → upload each to R2 → `confirm_image_batch`
3. **URL import (up to 20):** `import_property_images` → async job → poll `get_image_import_job`

URL import is SSRF-protected and runs asynchronously via Inngest.

### Sessions

| Tool | Method | Endpoint |
|------|--------|----------|
| `list_sessions` | GET | `/api/v1/sessions` |
| `get_session` | GET | `/api/v1/sessions/{id}` |
| `review_session` | PATCH | `/api/v1/sessions/{id}/review` |

**Session status:** `active`, `completed`, `expired`, `cancelled`

**Review status:** `pending` → `approved` | `denied`

Review requires `reviewStatus` and optional `reviewNotes`.

### Bulk Import

| Tool | Method | Endpoint |
|------|--------|----------|
| `bulk_create_properties` | POST | `/api/v1/properties/bulk` |
| `get_bulk_import_job` | GET | `/api/v1/properties/bulk/{jobId}` |

**Limits:** 1–500 properties per batch

**Features:**
- Flexible field names — Zillow/AppFolio aliases auto-normalized by backend
- Returns 202 with jobId for async tracking
- Job response includes: status, total, created, failed, createdPropertyIds, unmappedFields, errors
- Supports Idempotency-Key

---

## Common Workflows

### New Inquiry → Showing → Lease

```
1. Contact auto-created from inbound message (prospect)
2. list_contacts → find the new prospect
3. list_properties → find available properties matching criteria
4. check_showing_availability → find open time slots
5. create_showing → schedule the viewing
6. update_contact status → "scheduled"
7. After showing: update_showing status → "completed"
8. update_contact status → "applicant" (auto-sets appliedAt)
9. Eventually: update_contact status → "renter"
```

### Automated Pre-Screening

```
1. create_workflow → define pre-screening steps + questions
2. Contacts trigger workflow via deep_link or automatic trigger
3. list_workflow_runs → monitor progress
4. list_sessions → review completed sessions
5. review_session → approve or deny applicant
```

### Bulk Property Onboarding

```
1. bulk_create_properties → upload CSV data (up to 500)
2. get_bulk_import_job → poll until complete
3. For each created property:
   a. import_property_images → import photos from listing URLs
   b. get_image_import_job → poll until images processed
4. update_property → set status to "active"
```

### Draft-Based Messaging

```
1. create_draft → compose message for review
2. get_draft → review content
3. update_draft → edit if needed
4. send_draft → deliver to contact
   OR let it auto-expire after 24h
```

### Webhook Integration

```
1. create_webhook → subscribe to events (HTTPS URL required)
2. test_webhook → verify delivery
3. Handle signed payloads (HMAC-SHA256)
4. Events: inquiry.created, message.received, showing.booked, etc.
```

---

## API Patterns

### Authentication
All requests require Bearer token: `Authorization: Bearer ra_your_api_key_here`

API keys are generated in Rentalot dashboard → Settings → API Keys (prefixed `ra_`).

### Pagination
All list endpoints accept `page` (1-indexed) and `limit` (max 100).

Response includes: `{ pagination: { page, limit, total, totalPages } }`

### Idempotency
POST endpoints support `Idempotency-Key` header (UUID) to prevent duplicate operations. Used by: bulk import, workflow creation, image batch confirm, image URL import.

### Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

| Code | Meaning |
|------|---------|
| 400 | Bad request |
| 401 | Missing/invalid API key |
| 404 | Resource not found (or wrong tenant) |
| 409 | Conflict (e.g., deleting workflow with active runs) |
| 422 | Validation error (check `details` array) |
| 429 | Rate limited (check `Retry-After` header) |

### Rate Limits

| Tier | RPM | Daily | Write Access |
|------|-----|-------|--------------|
| Free Trial | — | — | No API |
| Starter ($29/mo) | 30 | 5,000 | Read-only |
| Pro ($79/mo) | 120 | 50,000 | Full CRUD |
| Scale ($199/mo) | 600 | 500,000 | Full + Priority |

Headers on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Resource`

### Async Operations
Some operations return `202 Accepted` with a `jobId` for polling:
- `bulk_create_properties` → poll `get_bulk_import_job`
- `import_property_images` → poll `get_image_import_job`

---

## MCP Server Setup

### Environment Variables
```bash
RENTALOT_API_KEY=ra_your_key_here    # Required
RENTALOT_BASE_URL=http://localhost:3000  # Optional, defaults to https://rentalot.ai
```

### Claude Code (.mcp.json)
```json
{
  "mcpServers": {
    "rentalot": {
      "command": "node",
      "args": ["/path/to/rentalot-mcp/dist/index.js"],
      "env": {
        "RENTALOT_API_KEY": "ra_your_key_here",
        "RENTALOT_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Development
```bash
npm run build    # TypeScript → dist/
npm run dev      # tsx hot reload
npm start        # run compiled
```

### MCP Resource
The server exposes an `api-reference` resource (`docs://api-reference`) with full API documentation accessible to MCP clients.

---

## Architecture

```
src/
├── index.ts              # Entry point — registers tools + resources, starts stdio transport
├── api-client.ts         # Thin HTTP client (GET/POST/PATCH/DELETE + Bearer auth)
├── tools/
│   ├── properties.ts     # 5 tools
│   ├── contacts.ts       # 5 tools
│   ├── showings.ts       # 6 tools
│   ├── conversations.ts  # 4 tools
│   ├── messages.ts       # 1 tool
│   ├── drafts.ts         # 6 tools
│   ├── followups.ts      # 5 tools
│   ├── workflows.ts      # 8 tools
│   ├── webhooks.ts       # 7 tools
│   ├── settings.ts       # 4 tools
│   ├── property-images.ts # 9 tools
│   ├── sessions.ts       # 3 tools
│   ├── bulk-import.ts    # 2 tools
│   └── events.ts         # 1 tool
└── resources/
    └── api-docs.ts       # API reference MCP resource
```

**Pattern:** Each domain file exports `register<Domain>Tools(server, api)` — called sequentially in `index.ts`.

**Stack:** TypeScript, `@modelcontextprotocol/sdk` ^1.12.0, Zod validation, stdio transport.

---

## Status Enums Reference

| Domain | Statuses |
|--------|----------|
| Property | `active`, `rented`, `inactive`, `maintenance`, `draft`, `archived` |
| Contact | `prospect`, `scheduled`, `applicant`, `renter`, `archived` |
| Showing | `pending`, `confirmed`, `completed`, `cancelled` |
| Conversation | `active`, `archived` |
| Draft | `pending`, `sent`, `expired` |
| Follow-up | `pending`, `processing`, `sent`, `cancelled`, `failed` |
| Workflow trigger | `manual`, `deep_link`, `automatic`, `scheduled` |
| Workflow run | `pending`, `running`, `paused`, `completed`, `cancelled`, `failed` |
| Session | `active`, `completed`, `expired`, `cancelled` |
| Session review | `pending`, `approved`, `denied` |
| Event type | `showing`, `call`, `inspection`, `meeting` |
| Message channel | `sms`, `whatsapp`, `email`, `gmail`, `telegram` |

## Webhook Events Reference

| Event | Fired When |
|-------|-----------|
| `inquiry.created` | New inbound inquiry received |
| `message.received` | Inbound message from contact |
| `message.sent` | Outbound message delivered |
| `showing.booked` | Showing scheduled |
| `showing.cancelled` | Showing cancelled |
| `contact.updated` | Contact record modified |
| `property.updated` | Property listing modified |
| `workflow.completed` | Workflow run finished |
| `workflow.created` | New workflow template created |
| `workflow.updated` | Workflow template modified |
| `workflow.deleted` | Workflow template deleted |
| `bulk_import.completed` | Bulk property import job finished |
