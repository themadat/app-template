# Agent handoff

Start a new session with:

```text
Continue work in /Users/stripes/Documents/GitHub/app-template. Read AGENTS.md and context/LLM_HANDOFF.md first. Preserve manual edits and run git status --short before editing.
```

The workflow shorthands are `wish`, `plan`, `start`, and `cut`. They deliberately separate backlog capture, design, implementation, and release finalization so a new agent can resume from repository context rather than chat history.

## Workflows

### `wish` — capture an idea

Record an idea for later without planning or implementing it.

- Read `context/WISHES.md`, check for duplicates, and assign the next unused `WISH-###` id.
- Capture a title, behavior-focused description, rationale, priority, effort, target kind or version, acceptance criteria, constraints, affected modules, and open questions.
- Use reasonable defaults when intent is clear. Ask only when ambiguity materially changes scope or architecture, and record assumptions.
- Set status to `Proposed`. Do not create a plan, edit application code, or retarget a release unless explicitly requested.
- The internal wish ledger is not user-facing and requires no version or release-note update. Add a matching item to `config.roadmap` only when the user explicitly wants it shown in the demonstration Roadmap.

### `plan` — investigate and document

Explore a wish before implementation.

- Read the wish, this handoff, the latest release entry, and the relevant code paths.
- Identify scope, non-goals, UI states, accessibility, responsive behavior, state-model effects, migration needs, import/export and sync effects, offline behavior, security risks, and tests.
- Create or revise `context/WISH-###-<slug>-PLAN.md` with a `## Resume` section at the top, followed by decisions, phases, file/symbol map, schema changes, acceptance criteria, test plan, and open questions.
- Link the plan from the wish and set its status to `Planned`.
- Planning-only changes do not alter application files, build id, service-worker cache, or release notes unless explicitly requested.
- Do not implement during `plan`.

### `start` — implement an approved plan

Open or continue implementation from a written plan.

- Read the wish, plan, and handoff before editing. If no adequate plan exists, stop and run `plan` unless the user explicitly requests a small direct change.
- Set the wish status to `Active` and keep the plan's `## Resume` section current with completed work, in-progress work, exact next steps, touched files/symbols, verification, and gotchas.
- Preserve the static, dependency-free architecture and optional-module boundaries.
- For application behavior changes, update `identity.buildId` in `assets/js/config.js` and `CACHE_NAME` in `sw.js` together. Use `YYYY.MM.DD.N`; increment `N` for subsequent builds on the same date.
- Change `identity.version` only when the planned release version is explicitly chosen or during `cut`.
- Persisted state changes require defaults, normalization, validation, and sequential migrations in `assets/js/core/state.js`. Keep older backup wrappers importable and tokens outside exported state.
- Update help, shortcuts, tests, and customization docs as the implemented surface requires.
- Verify relevant desktop, tablet, mobile, offline, import/migration/recovery, accessibility, and mocked sync behavior before stopping.

### `cut` — finalize a release

Turn the active implementation line into a coherent release.

- Inventory dirty files and preserve unrelated/manual edits.
- Choose or confirm the semantic version and update `identity.version` in `assets/js/config.js`.
- Set a fresh `identity.buildId` and matching `CACHE_NAME` in `sw.js`.
- Add one structured release entry in `config.releases`: date, title, summary, features, improvements, fixes, and known issues. Keep it public-facing and free of prompts or internal workflow details.
- Mark the wish `Shipped`, record the released version and date, and move any remaining follow-ups into new wishes.
- Refresh Help, What's New, Roadmap, README, manifests, install metadata, and documentation wherever the release changed their claims. Do not change `schemaVersion` unless the persisted model actually changed.
- Replace the plan's Resume block with a short completion note and move the completed plan to `context/archive/` when historical detail is useful; otherwise remove its active reference from this handoff.
- Run syntax and JSON checks, `git diff --check`, asset-reference checks, desktop/mobile smoke tests, offline service-worker reload, current and legacy import tests, recovery tests, accessibility checks, and mocked cloud first-sync/conflict tests when sync changed.
- Stop preview servers and leave no active line unless the user explicitly keeps one open.

## Version and release surfaces

- Runtime identity and public version: `assets/js/config.js` → `identity`.
- Current state-model version and storage keys: `assets/js/config.js` plus migrations in `assets/js/core/state.js`.
- Public release history, Help content, roadmap demonstration data, statuses, themes, and feature flags: `assets/js/config.js`.
- Visible version rendering: `assets/js/app.js`.
- Offline cache version and shell resources: `sw.js`.
- Install metadata and icon paths: `manifest.webmanifest`, `manifest-dark.webmanifest`, and `index.html`.
- Public operating and customization guidance: `README.md` and `docs/`.

Build ids invalidate the offline shell; semantic versions communicate releases to users. A behavior change normally bumps the build id. A schema change separately bumps `schemaVersion` and adds a sequential migration. Documentation-only and planning-only changes need neither.

## Repository map

- `index.html`: semantic application shell and dialogs.
- `assets/css/app.css`: shell, components, themes, responsive layouts, safe areas, reduced motion.
- `assets/js/config.js`: identity and replaceable structured product content.
- `assets/js/core/utils.js`: escaping, rich-text sanitization, colors, safe URLs, ids, dates, fingerprints.
- `assets/js/core/state.js`: defaults, schema, migrations, normalization, validation, merge behavior.
- `assets/js/core/storage.js`: startup loading, autosave, recovery snapshots, quota handling, separate secret storage.
- `assets/js/core/components.js`: dialogs, confirmations, menus, popovers, toasts, focus behavior.
- `assets/js/core/portability.js`: JSON export, safe import, preview, confirmation, recovery.
- `assets/js/core/sync.js`: optional GitHub Contents synchronization and conflict state machine.
- `assets/js/core/pwa.js`: installation, device guidance, appearance-aware assets, service-worker updates.
- `assets/js/app.js`: rendering, module behavior, shortcuts, and event wiring.
- `docs/`: source audit, architecture, components, customization, and verification checklists.

## Invariants

- Browser-local state is primary; cloud synchronization is optional and user-initiated.
- Never export, render, or log a stored GitHub token. Preserve it only in the separate per-device secret key.
- Imports and remote responses are untrusted: parse, migrate, normalize, sanitize, validate, preview, confirm, and save a recovery copy before replacement.
- Preserve user records and documents across upgrades. Deletion tombstones must survive sync merges until they are safely superseded.
- External links allow only safe HTTP(S) URLs and open with `noopener noreferrer` behavior.
- Critical actions must have visible keyboard/touch routes; hover, drag, right-click, and long press are conveniences only.
- Mobile uses explicit list/detail navigation and full-screen dialogs; desktop panel visibility and proportions remain independently persistent.
- A missing optional browser API must produce an unavailable state, not a broken application.

## Verification baseline

From the repository root:

```sh
for file in assets/js/config.js assets/js/core/*.js assets/js/app.js sw.js; do node --check "$file" || exit 1; done
node -e "const fs=require('fs'); for (const file of ['manifest.webmanifest','manifest-dark.webmanifest','docs/examples/legacy-backup-v1.json','docs/examples/legacy-backup-v2.json']) JSON.parse(fs.readFileSync(file,'utf8'));"
git diff --check
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000`, perform the relevant checks in `docs/TESTING.md`, and stop the server before the final response.

## End-of-turn handoff

The final response after file changes has one concise summary and one copy-paste command. The command stages only task files, commits with a specific imperative subject, and pushes the current branch. Determine the branch before composing it; do not assume `main`. Do not execute it unless explicitly asked.
