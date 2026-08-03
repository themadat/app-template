# App Template — Agent Instructions

Static, local-first HTML/CSS/JavaScript application. There is no required build step, runtime dependency, backend, account, or sign-in. `context/LLM_HANDOFF.md` is the durable source of truth for agent workflows and repository-specific invariants; read it before implementing anything.

## Session start

1. Run `git status --short`. Existing and manual edits are authoritative; preserve them.
2. Read `context/LLM_HANDOFF.md` and `context/WISHES.md`.
3. If a feature is in flight, inspect `git log --oneline -5`, `git diff main...HEAD --stat`, and the `## Resume` section of its plan document.

## Working rules

- Search with `rg` before reading broad file ranges. Keep edits narrow and never reformat unrelated code.
- Keep the application static, dependency-free at runtime, and usable from an ordinary static host.
- Central identity, versions, feature flags, releases, roadmap examples, and help content live in `assets/js/config.js`.
- Persisted fields require a default, normalization, validation, and a backward-compatible migration when the schema changes. Never discard user-created records or documents during an upgrade.
- App behavior changes update `identity.buildId` and the service-worker cache id together. Documentation-only and agent-instruction changes do not require release churn.
- Use semantic HTML, labelled controls, visible focus, live status where appropriate, safe URLs, escaped user text, and the shared dialog/focus behavior.
- Use the shared inline SVG symbol catalog for interface icons whenever an appropriate symbol exists; do not use emoji or font glyphs for standard controls.
- Verify proportionally: JavaScript syntax, JSON parsing, `git diff --check`, referenced asset paths, and relevant desktop/mobile/offline workflows.
- Stop local preview servers before the final response.

## Workflow shorthands

Treat these one-word user requests as repository workflows:

- `wish`: capture a scoped idea in `context/WISHES.md`; do not plan or implement it.
- `plan`: investigate a wish and write or revise `context/WISH-###-<slug>-PLAN.md`; do not implement it.
- `start`: implement an approved plan, maintain its Resume block, update the build id when application behavior changes, and verify the work.
- `cut`: finalize the active line as a release, update all version/release/cache surfaces, close the wish, and run the full release checklist.

The detailed contracts are in `context/LLM_HANDOFF.md`. Do not silently advance from one lifecycle stage to another.

## End of turn

After changing files, finish with:

1. A concise outcome summary and verification result.
2. Exactly one copy-paste-ready shell command that stages only the files belonging to the completed request, commits them with a specific imperative one-line message, and pushes the current branch to `origin`.

Command shape:

```bash
git add <changed-files> && git commit -m "Describe the completed change" && git push origin <current-branch>
```

Do not run the commit or push unless the user explicitly asks. Never use `git add .` or `git add -A` when unrelated or user-owned changes are present. If no files changed, do not suggest an empty commit.
