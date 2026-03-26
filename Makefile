.PHONY: build dev test lint typecheck publish publish-dry check release-patch release-minor release-major

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

check:
	bun run lint && bun run typecheck && bun run test

release-patch: check build
	npm version patch
	git push origin main && git push gh main --tags

release-minor: check build
	npm version minor
	git push origin main && git push gh main --tags

release-major: check build
	npm version major
	git push origin main && git push gh main --tags
