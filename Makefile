.PHONY: build dev test lint typecheck publish publish-dry

build:
	bun run build

dev:
	bun run dev

test:
	bun test

lint:
	bun run lint

typecheck:
	bun run typecheck

publish-dry: build
	npm publish --access public --dry-run

publish: build
	npm publish --access public
