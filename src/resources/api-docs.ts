import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const API_OVERVIEW = `# Rentalot API Reference

REST API for Rentalot — an AI-powered rental agent platform that manages inquiry response, showing scheduling, messaging, and follow-ups across WhatsApp, Telegram, SMS, and Gmail.

## Base URL

The MCP server accepts an API origin and appends \`/api/v1\` to tool requests.

- Default: \`https://rentalot.ai\`
- Local development: set \`RENTALOT_BASE_URL=http://localhost:3000\`

Do not use the production origin for development-trial validation. The trial API is deliberately unavailable outside development.

## Authentication

All endpoints require a Bearer token (API key) in the \`Authorization\` header.
Keys are generated after account creation and verified sign-in in the Rentalot dashboard under Settings > API Keys. Keys are prefixed with \`ra_\`.

\`\`\`
Authorization: Bearer ra_your_api_key_here
\`\`\`

### Development-only trial

When the server's development gate is enabled, a free-trial account may use only private, account-owned property and contact CRUD. The account must issue its own key, and the key expires no later than the fixed trial deadline. Production trial access is disabled and Starter remains read-only.

Trial limits are account-wide across keys and clients: at most 2 active keys, 20 requests/minute, 200 requests/day, 700 requests over the trial, and 50 writes each for properties and contacts over the trial. Each of those resources allows 10 reads/minute, 5 writes/minute, and 20 writes/day. Trial list pages are capped at 20 items. Other resources, outbound messages, drafts, workflows, webhooks, bulk operations, image imports, and provider actions are not trial-eligible.

Rotating an API key or switching clients does not reset account-wide trial usage. A trial-issued key keeps its original expiry after a paid upgrade; issue a new paid key for continued paid access.

## Resources

### Properties
CRUD for private rental property listings. Create requires address, monthly rent, bedrooms, and bathrooms; an optional title is derived from the address when omitted.
- Statuses: active, rented, inactive, archived
- Canonical property types: house, apartment, condo, townhouse, room. The field is optional on writes and nullable on historical reads.
- Studio is not a property type; use the exact \`bedroomType=studio\` filter for listings with \`bedrooms=0\`.
- List filters include repeatable \`propertyType\` values and \`bedroomType=studio\`.
- DELETE is a soft-delete that removes the property from API results; it is not permanent erasure.

### Contacts
Prospect and tenant records. Single-contact creation requires a name and at least one of email or phone.
- Statuses: prospect, scheduled, applicant, renter, archived
- DELETE is a soft-delete; the record is retained by the API and excluded from normal list/get results.

### Showings
Property viewing appointments. Schedule, confirm, complete, or cancel.
- Statuses: pending, confirmed, completed, cancelled
- DELETE cancels the showing; it does not permanently delete the record.

### Conversations
Messaging threads with contacts. Read-only via API. Each conversation has a channel (whatsapp, telegram, sms, gmail).
- Statuses: active, archived

### Events
All calendar events (showings, calls, inspections, meetings). Read-only.
- Types: showing, call, inspection, meeting

### Messages
Send messages to contacts via their preferred channel. Not available during the development-only trial.
- Channels: sms, whatsapp, email, gmail, telegram

### Drafts
Create, edit, and send draft messages. Drafts auto-expire after 24 hours. Not available during the development-only trial.
- Statuses: pending, sent, expired

### Follow-ups
Schedule automated follow-up messages. Sent at the scheduled time. Not available during the development-only trial.
- Statuses: pending, processing, sent, cancelled, failed

### Workflows and webhooks
These are released paid-plan resources and are not available during the development-only trial. Workflow runs and webhook deliveries may have additional server-side restrictions.

## Rate limits and recovery

Rate-limit headers include \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`, and \`X-RateLimit-Resource\`. A 429 response may include \`Retry-After\` in seconds. Wait for that duration before retrying. Daily trial budgets reset at UTC midnight; lifetime trial budgets do not reset.

The MCP client preserves these headers and includes the retry duration in the tool error text when present. Do not retry by rotating keys or changing clients when a lifetime trial budget is exhausted.

## Pagination
All list endpoints accept \`page\` (1-indexed) and \`limit\` (max 100) query parameters. Trial requests are capped at a page size of 20.
Responses include \`pagination: { page, limit, total, totalPages }\`.

## Idempotency
Supported create endpoints accept the \`Idempotency-Key\` header (UUID) to prevent duplicate operations. Follow the endpoint's response before retrying a failed mutation.

## Errors
The MCP client preserves the server's human-readable error message and status. Common outcomes include 401 for missing, invalid, revoked, or expired credentials; 404 for a missing or differently owned record; 422 for rejected fields or invalid enum values; and 429 for tier, trial, or rate-limit admission. For 429 responses, follow \`Retry-After\` or \`X-RateLimit-Reset\` guidance.
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
