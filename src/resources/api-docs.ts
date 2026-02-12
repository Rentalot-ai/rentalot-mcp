import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const API_OVERVIEW = `# Rentalot API Reference

REST API for Rentalot — an AI-powered rental agent platform that manages inquiry response, showing scheduling, messaging, and follow-ups across WhatsApp, Telegram, SMS, and Gmail.

## Base URL
\`https://rentalot.ai/api/v1\`

## Authentication
All endpoints require a Bearer token (API key) in the \`Authorization\` header.
Keys are generated in the Rentalot dashboard under Settings > API Keys and prefixed with \`ra_\`.

\`\`\`
Authorization: Bearer ra_your_api_key_here
\`\`\`

## Resources

### Properties
CRUD for rental property listings. Fields include address, rent, bedrooms, bathrooms, features, availability, status, and more.
- Statuses: active, rented, inactive, maintenance, draft, archived

### Contacts
Prospect and tenant records. Created automatically from inbound messages. Read + update via API.
- Statuses: prospect, scheduled, applicant, renter, archived

### Showings
Property viewing appointments. Schedule, confirm, complete, or cancel.
- Statuses: pending, confirmed, completed, cancelled

### Conversations
Messaging threads with contacts. Read-only via API. Each conversation has a channel (whatsapp, telegram, sms, gmail).
- Statuses: active, archived

### Events
All calendar events (showings, calls, inspections, meetings). Read-only.
- Types: showing, call, inspection, meeting

### Messages
Send messages to contacts via their preferred channel. Write-only endpoint.
- Channels: sms, whatsapp, email, gmail, telegram

### Drafts
Create, edit, and send draft messages. Drafts auto-expire after 24 hours.
- Statuses: pending, sent, expired

### Follow-ups
Schedule automated follow-up messages. Sent at the scheduled time.
- Statuses: pending, processing, sent, cancelled, failed

### Workflows
Automated multi-step sequences (pre-screening, lead qualification, follow-ups). Read templates + trigger runs.
- Trigger types: manual, deep_link, automatic, scheduled
- Run statuses: pending, running, paused, completed, cancelled, failed

### Webhooks
Subscribe to real-time event notifications via HTTPS endpoints. Payloads signed with HMAC-SHA256.
- Events: inquiry.created, message.received, message.sent, showing.booked, showing.cancelled, contact.updated, property.updated, workflow.completed

## Rate Limits
| Tier | Global RPM | Daily Requests | Write Access |
|------|-----------|----------------|--------------|
| Free Trial | — | — | No API |
| Starter ($29/mo) | 30 | 5,000 | Read-only |
| Pro ($79/mo) | 120 | 50,000 | Full CRUD |
| Scale ($199/mo) | 600 | 500,000 | Full + Priority |

Rate limit headers on every response: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Resource.

## Pagination
All list endpoints accept \`page\` (1-indexed) and \`limit\` (max 100) query parameters.
Responses include \`pagination: { page, limit, total, totalPages }\`.

## Idempotency
POST endpoints support the \`Idempotency-Key\` header (UUID) to prevent duplicate operations.

## Errors
Consistent format: \`{ error: { code, message, details? } }\`
- 400: Bad request
- 401: Missing/invalid API key
- 404: Resource not found (or belongs to different tenant)
- 422: Validation error (details array with per-field messages)
- 429: Rate limited (check Retry-After header)
`;

export function registerApiDocsResource(server: McpServer) {
  server.resource(
    "api-reference",
    "docs://api-reference",
    { description: "Rentalot API reference — overview of all resources, authentication, rate limits, pagination, and error handling" },
    async () => ({
      contents: [{ uri: "docs://api-reference", mimeType: "text/markdown", text: API_OVERVIEW }],
    }),
  );
}
