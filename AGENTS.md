# App Template

Static, local-first HTML/CSS/JavaScript; no runtime dependencies or build step.

## Work efficiently

- Before edits, run `git status --short`; preserve existing work. Search with `rg`, then read relevant sections only. Never dump generated icon catalogs, full logs, or unrelated docs.
- Read `context/LLM_HANDOFF.md` only when resuming; WISHES only for backlog work. Read recent commits only when history matters. Keep one task per objective; recommend a fresh task for unrelated work.
- Bound tool output; report summaries and failures. Verify affected behavior once; broaden only for failures or shared-code risk. No app tests for documentation-only edits. Stop preview servers.
- Keep responses concise. No unsolicited plans, status files, or subagents. Record a short Resume only for interrupted work.

## Preserve

- Keep the icon library and existing shell; no Records UI or rich-text/multi-note workspace.
- Keep storage/migrations stable. Never export credentials, import a replacement sync target, or bypass recovery/confirmation.
- Use accessible controls, escaped text, safe URLs, and shared SVGs.
- No commits/pushes without authorization; keep Git remotes computer-independent.

## On demand

Use docs/ICONS.md for catalog work, COMPONENTS.md for UI/search, ARCHITECTURE.md for state/sync/offline, TESTING.md for affected checks, CUSTOMIZATION.md for configuration/releases, and GIT-SETUP.md for SSH.

## Workflows

- `wish`: record title, desired behavior, status in WISHES; no implementation.
- `plan`: investigate and write a proportionate plan; no implementation. `start`: implement it and verify.
- `cut`: finalize release and close its wish. Bump only config's VERSION once per completed app-change batch, before deployment; follow CUSTOMIZATION. No documentation-only bump.
- `reset`: read docs/RESET.md; confirm copied checkout, identity, and replacement icon. Never reset this canonical template accidentally.

After file changes, give outcome, verification, and one scoped stage/commit/push command using `Version - Text`. Omit the command for unchanged files.
