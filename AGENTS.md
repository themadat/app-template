# App Template — Agent Instructions

Static, local-first HTML/CSS/JavaScript application. There is no required build step, runtime dependency, backend, account, or sign-in. `context/LLM_HANDOFF.md` is the durable source of truth for agent workflows and repository-specific invariants; read it before implementing anything.

## Session start

1. Run `git status --short`. Existing and manual edits are authoritative; preserve them.
2. Read `context/LLM_HANDOFF.md` and `context/WISHES.md`.
3. If a feature is in flight, inspect `git log --oneline -5`, `git diff main...HEAD --stat`, and the `## Resume` section of its plan document.

## Agent Continuity Protocol

Agent work must be resumable across sessions.

### `continue`

When the user sends only `continue`, resume the current task:

1. Read `AGENT_STATUS.md`.
2. Inspect `git status`, the current diff, recent relevant commits, and relevant changed files.
3. Verify `AGENT_STATUS.md` against the actual repository state.
4. Determine whether the current phase is `PLANNING`, `IMPLEMENTING`, `TESTING`, `VERIFYING`, `COMPLETE`, or `BLOCKED`.
5. Continue with the next unfinished work.
6. Do not redo completed work unless repository inspection or verification shows it is necessary.
7. Keep `AGENT_STATUS.md` updated as work progresses.

If `AGENT_STATUS.md` does not exist, infer the current state from the repository, current task context, Git history, and working tree, then create it when an unfinished task is active.

### Persistent status

Maintain a concise `AGENT_STATUS.md` in the repository root for any active agent task. Update it after meaningful milestones and before stopping whenever possible. It describes the current resumable state, not a verbose work log. Use this structure:

```md
# Goal
Current task.
# Status
PLANNING | IMPLEMENTING | TESTING | VERIFYING | COMPLETE | BLOCKED
# Checkpoint
Current agent checkpoint version and commit, if one exists.
# Completed
- Completed work
# Remaining
- Remaining work
# Verification
- Build: PASS | FAIL | NOT RUN
- Tests: PASS | FAIL | NOT RUN
- Lint: PASS | FAIL | NOT RUN
- Review: PASS | FAIL | NOT RUN
# Next
Exact next action.
# Decisions
- Important implementation decisions or assumptions
```

### Agent checkpoints

A `+X` build suffix represents an agent checkpoint, not a release or specifically a usage-limit event, for example `1.4.0`, `1.4.0+1`, and `1.4.0+2`. For long-running tasks, checkpoint at useful stable boundaries so another agent can resume without losing significant work. Good boundaries include:

- completion of a meaningful implementation unit;
- the transition from implementation to testing;
- the transition from testing to verification;
- substantial progress before another large unit;
- low available usage or context; or
- an expected session stop.

Do not depend on predicting exactly when usage or context will run out.

When creating a checkpoint:

1. Reach a coherent stopping point.
2. Update `AGENT_STATUS.md`.
3. Find the existing canonical version source and preserve the normal version while incrementing only supported build metadata.
4. Run reasonable validation for the state being checkpointed.
5. Update `# Checkpoint` in `AGENT_STATUS.md`.
6. If the user has explicitly authorized commits, commit with `checkpoint: <version> - <short description>` and then record both the checkpoint version and commit hash, for example `1.4.0+2 (a1b2c3d)`.

This repository's canonical application version is `identity.version` in `assets/js/config.js`, mirrored by `identity.buildId` and the version/cache/deployment surfaces described below. Its required `major.minor.patch.build` convention does not support a `+X` suffix. Do not change the application version for an agent checkpoint; record the checkpoint number only in `AGENT_STATUS.md`. The existing rule requiring explicit user authorization before any commit also applies to checkpoint commits.

Do not automatically create a checkpoint commit when unrelated user changes would be included, secrets or unwanted generated files are present, the repository is knowingly too broken to provide a useful resume state, or the user has instructed you not to commit. Never discard, reset, overwrite, or clean unrelated user changes to create a checkpoint.

### Usage and context awareness

During long-running work, periodically check remaining usage, context, or session limits when the environment exposes them. When capacity appears low:

1. Stop starting large implementation units.
2. Finish the smallest coherent unit in progress.
3. Run the most relevant available verification.
4. Update `AGENT_STATUS.md`.
5. Create an agent checkpoint if it is safe and authorized.
6. Leave `# Next` with a precise instruction for the next agent.

If capacity cannot be determined, rely on regular milestone checkpoints.

### Completion standard

Do not mark a task `COMPLETE` merely because coding is finished. `COMPLETE` means the requested functionality is implemented, relevant tests pass, build/typecheck and lint pass where applicable, the implementation has been reviewed against the original request, and no known required work remains. The expected progression is generally:

`IMPLEMENTING` → `TESTING` → `VERIFYING` → `COMPLETE`

Use `TESTING` when implementation is finished but testing is incomplete. Use `VERIFYING` after tests pass while final review remains. When truly complete, set `AGENT_STATUS.md` to `COMPLETE`, record final verification clearly, and do not create another `+X` checkpoint solely for completion unless the normal release/version workflow requires it.

Installing or updating this protocol alone does not change the application version. Create `AGENT_STATUS.md` only while an unfinished task is active; otherwise wait until agent work begins.

## Working rules

- Search with `rg` before reading broad file ranges. Keep edits narrow and never reformat unrelated code.
- Keep the application static, dependency-free at runtime, and usable from an ordinary static host.
- Central identity, versions, and shell settings live in `assets/js/config.js`.
- Preserve the focused foundation: top bar with centered search, blank main workspace, single Notes modal, demonstrative Roadmap inside Settings, combined floating storage/sync status, local persistence/recovery, and optional GitHub Sync. Do not restore the removed Records interface, multi-note workspace, rich-text editor, or an app-space Roadmap without an explicit request.
- Keep additions narrow and configurable. The compatibility state may retain legacy record/document fields so older backups and sync copies remain readable.
- Application versions use `major.minor.patch.build`. Every completed application update increments the fourth `build` number. An explicit major, minor, or patch change resets `build` to `1` unless the user specifies another value. Keep `identity.buildId` identical to the full four-part `identity.version`, add or update the matching dated release entry, update the build queries in `index.html` plus the service-worker cache/build ids, and keep the version in `.github/workflows/deploy-pages.yml`'s workflow `name` identical so GitHub Mobile deployment notifications show it. Wish, plan, and agent-instruction-only edits do not change the app version unless explicitly requested. The destructive `reset` workflow is the sole exception: it deliberately starts a copied application at `0.0.1.1`.
- Use semantic HTML, labelled controls, visible focus, safe URLs, and escaped user text.
- Use the shared inline SVG symbol catalog for interface icons whenever an appropriate symbol exists; do not use emoji or font glyphs for standard controls.
- Verify proportionally: JavaScript syntax, manifest JSON parsing, `git diff --check`, referenced asset paths, and relevant desktop/mobile/offline workflows.
- Stop local preview servers before the final response.

## Workflow shorthands

Treat these one-word user requests as repository workflows:

- `reset`: turn a copied repository into a clean new-app foundation at `0.0.1.1`, retaining the reusable shell and infrastructure while removing the icon-library product. Before editing, explicitly obtain or confirm the app name and obtain the replacement app-icon source; autofill the identity, replace every icon/favicon/install variant, and bake all retained base-UI symbols into the self-contained interface catalog. If GitHub Sync remains enabled, guide the user through provisioning its `themadat/app-data` JSON file and narrowly scoped fine-grained token using the checklist links. Follow the preflight and complete reset contract in `context/LLM_HANDOFF.md` and `docs/RESET.md`; do not run it against the canonical template accidentally.
- `wish`: capture a scoped idea in `context/WISHES.md`; do not plan or implement it.
- `plan`: investigate a wish and write or revise `context/WISH-###-<slug>-PLAN.md`; do not implement it.
- `start`: implement an approved plan, maintain its Resume block, update the app and build versions, and verify the work.
- `cut`: finalize the active line as a release, update all version/release/cache surfaces, close the wish, and run the full release checklist.

The detailed contracts are in `context/LLM_HANDOFF.md`, with the destructive reset checklist in `docs/RESET.md`. Do not silently advance from one lifecycle stage to another.

## End of turn

After changing files, finish with:

1. A concise outcome summary and verification result.
2. Exactly one copy-paste-ready shell command that stages only the files belonging to the completed request, commits them with the exact subject shape `Version - Text`, and pushes the current branch to `origin`.

Command shape:

```bash
git add . && git commit -m "X.Y.Z.B - Describe the completed change" && git push origin <current-branch>
```

Do not run the commit or push unless the user explicitly asks. Use `git add .` when `git status --short` confirms every change belongs to the completed request; otherwise list only the task files and call out the unrelated changes. Never use `git add -A` when unrelated or user-owned changes are present. If no files changed, do not suggest an empty commit.
