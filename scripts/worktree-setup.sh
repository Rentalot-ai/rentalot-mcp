#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:?Usage: worktree-setup.sh <branch-name> [base-branch]}"
BASE="${2:-HEAD}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE_DIR="$REPO_ROOT/.worktrees/$BRANCH"

sync_agent_context() {
  local src_root="$1"
  local dst_root="$2"
  local path

  for path in skills .agents .opencode .claude; do
    [ -e "$src_root/$path" ] || continue
    if [ -e "$dst_root/$path" ]; then
      echo "agent context exists, skipping: $path" >&2
      continue
    fi

    echo "syncing agent context: $path" >&2
    if command -v rsync >/dev/null 2>&1; then
      rsync -a \
        --exclude '.git' \
        --exclude '.beads' \
        --exclude '.env' \
        --exclude '.env.*' \
        --exclude 'node_modules' \
        --exclude 'dist' \
        --exclude 'build' \
        --exclude 'target' \
        --exclude '.cache' \
        "$src_root/$path" "$dst_root/"
    else
      cp -R "$src_root/$path" "$dst_root/"
    fi
  done
}

link_shared_path() {
  local src_root="$1"
  local dst_root="$2"
  local path="$3"

  [ -e "$src_root/$path" ] || return 0
  if [ -e "$dst_root/$path" ] || [ -L "$dst_root/$path" ]; then
    echo "shared path exists, preserving: $path" >&2
    return 0
  fi

  echo "linking shared path: $path" >&2
  ln -s "$src_root/$path" "$dst_root/$path"
}

exclude_local_worktree_paths() {
  local dst_root="$1"
  local exclude_file

  exclude_file="$(cd "$dst_root" && git rev-parse --git-path info/exclude)"
  mkdir -p "$(dirname "$exclude_file")"
  grep -qxF ".beads" "$exclude_file" 2>/dev/null || printf "\n.beads\n" >>"$exclude_file"
  grep -qxF ".codegraph" "$exclude_file" 2>/dev/null || printf ".codegraph\n" >>"$exclude_file"
}

setup_project() {
  local dst_root="$1"

  if [ -d "$REPO_ROOT/node_modules" ] && [ ! -e "$dst_root/node_modules" ]; then
    ln -s "$REPO_ROOT/node_modules" "$dst_root/node_modules"
    return 0
  fi

  if [ ! -e "$dst_root/node_modules" ] && command -v bun >/dev/null 2>&1; then
    (cd "$dst_root" && bun install --frozen-lockfile)
  fi
}

cd "$REPO_ROOT"

if [ -d "$WORKTREE_DIR" ]; then
  link_shared_path "$REPO_ROOT" "$WORKTREE_DIR" ".beads"
  link_shared_path "$REPO_ROOT" "$WORKTREE_DIR" ".codegraph"
  exclude_local_worktree_paths "$WORKTREE_DIR"
  sync_agent_context "$REPO_ROOT" "$WORKTREE_DIR"
  setup_project "$WORKTREE_DIR"
  echo "$WORKTREE_DIR"
  exit 0
fi

git worktree add "$WORKTREE_DIR" -b "$BRANCH" "$BASE" 2>/dev/null || \
  git worktree add "$WORKTREE_DIR" "$BRANCH"

link_shared_path "$REPO_ROOT" "$WORKTREE_DIR" ".beads"
link_shared_path "$REPO_ROOT" "$WORKTREE_DIR" ".codegraph"
exclude_local_worktree_paths "$WORKTREE_DIR"
sync_agent_context "$REPO_ROOT" "$WORKTREE_DIR"
setup_project "$WORKTREE_DIR"

echo "$WORKTREE_DIR"
