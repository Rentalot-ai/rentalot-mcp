# Changelog

All notable changes to @rentalot/mcp-server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Rename publicChatEnabled to prescreeningEnabled in update_settings tool (backward-compatible)

## [0.2.1] - 2026-03-26

### Added

- Add imageUrls parameter to create_property tool (1–20 URI array)

## [0.2.0] - 2026-03-25

### Added

- Add role and language fields to contact schemas
- Draft tools now support 'subject' field for email drafts on create_draft, update_draft, and send_draft
- Property tools: 13 new fields on create/update (amenities, leaseMinMonths, depositAmount, squareFootage, etc.) and 4 new list filters (minBathrooms, availableBefore, petFriendly, hasParking)
- Settings tool: full coverage of all agent preferences (28 fields) and email notification preferences (10 fields)
- GitHub Actions CI with lint, typecheck, test, build, and changelog validation
- GitHub Actions release workflow with chlog-powered release notes

### Changed

- Migrate API error responses to RFC 9457 format
- Add webhook secret rotation endpoint
- Disable GitLab CI in favor of GitHub Actions

### Fixed

- Session enum drift: status filter now accepts 'draft' (was 'cancelled'), reviewStatus accepts 'pending_review' (was 'pending')
- Removed invalid 'status' filter from list_properties (not supported by API)
- CI test job now uses vitest instead of bun test runner
- Fix schema drift test — align path param names ({id} not {propertyId}) and regenerate OpenAPI fixture with 8 previously missing endpoints

## [0.1.0] - 2026-03-25

### Added

- Initial MCP server exposing 37 Rentalot API tools
- Property, contact, showing, conversation, and session management tools
- Property image management (list, upload, confirm, delete, reorder)
- Property image import from external URLs
- Settings and webhook subscription tools
- Showing availability check
- Conversation keyword search
- Workflow CRUD tools
- MCP resource with full API reference documentation

### Changed

- Migrate project to Bun for improved performance
- Add CI for lint, typecheck, build, and test

[Unreleased]: https://github.com/Rentalot-ai/rentalot-mcp/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/Rentalot-ai/rentalot-mcp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Rentalot-ai/rentalot-mcp/compare/v0.1.0...v0.2.0
