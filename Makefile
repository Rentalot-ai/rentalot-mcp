.PHONY: build dev test lint typecheck publish publish-dry check release-patch release-minor release-major worktree worktree-clean

WORKTREE_SCRIPT ?= scripts/worktree-setup.sh
BASE ?= $(shell git branch --show-current 2>/dev/null || echo HEAD)

worktree:
	@test -n "$(BRANCH)" || (echo "BRANCH is required: make worktree BRANCH=agent/name [BASE=$$(git branch --show-current)]" >&2; exit 1)
	@bash "$(WORKTREE_SCRIPT)" "$(BRANCH)" "$(BASE)"

worktree-clean:
	@test -n "$(BRANCH)" || (echo "BRANCH is required: make worktree-clean BRANCH=agent/name" >&2; exit 1)
	@git worktree remove --force ".worktrees/$(BRANCH)"

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
