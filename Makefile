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
	$(eval VER := $(shell npm version patch --no-git-tag-version | tr -d 'v'))
	chlog release $(VER) && chlog sync
	git add package.json CHANGELOG.yaml CHANGELOG.md && git commit -m "release: v$(VER)"
	git tag "v$(VER)"
	git push origin main && git push gh main --tags

release-minor: check build
	$(eval VER := $(shell npm version minor --no-git-tag-version | tr -d 'v'))
	chlog release $(VER) && chlog sync
	git add package.json CHANGELOG.yaml CHANGELOG.md && git commit -m "release: v$(VER)"
	git tag "v$(VER)"
	git push origin main && git push gh main --tags

release-major: check build
	$(eval VER := $(shell npm version major --no-git-tag-version | tr -d 'v'))
	chlog release $(VER) && chlog sync
	git add package.json CHANGELOG.yaml CHANGELOG.md && git commit -m "release: v$(VER)"
	git tag "v$(VER)"
	git push origin main && git push gh main --tags
