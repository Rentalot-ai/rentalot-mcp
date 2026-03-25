# Changelog

All notable changes to @rentalot/mcp-server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Add role and language fields to contact schemas

### Changed

- Migrate API error responses to RFC 9457 format
- Add webhook secret rotation endpoint

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
- Add GitLab CI for lint, typecheck, build, and test

[Unreleased]: https://gitlab.com/ariel-frischer/rentalot-mcp/-/compare/v0.1.0...HEAD
