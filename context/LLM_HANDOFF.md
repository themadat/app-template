# Agent handoff

Start a new session with:

```text
Continue work in /Users/stripes/Documents/GitHub/app-template. Read AGENTS.md and context/LLM_HANDOFF.md first. Preserve manual edits and run git status --short before editing.
```

This repository is intentionally a blank application shell. The top bar, appearance behavior, install assets, and offline shell are reusable; `main#mainContent` contains no demonstration product or feature framework.

## Workflows

### `wish`

Record an idea in `context/WISHES.md` without planning or implementing it.

- Check for duplicates and use the next `WISH-###` id.
- Capture behavior, rationale, priority, effort, acceptance criteria, constraints, affected files, and material open questions.
- Set the status to `Proposed`.

### `plan`

Investigate a wish without implementing it.

- Create or revise `context/WISH-###-slug-PLAN.md`.
- Put a `## Resume` section first, followed by decisions, scope, non-goals, file map, accessibility/responsive considerations, tests, and open questions.
- Link it from the wish and set the status to `Planned`.
- Do not change runtime files, build ids, or cache ids.

### `start`

Implement an approved plan.

- Read the wish and plan, set the wish to `Active`, and keep the Resume section current.
- Add only the architecture the real feature needs. Do not reintroduce the former demonstration modules or a speculative framework.
- When browser assets or behavior change, update `identity.buildId` in `assets/js/config.js` and `CACHE_NAME` in `sw.js` together.
- Change the semantic version only when the user chooses a release version.
- Verify the affected desktop, mobile, accessibility, and offline behavior.

### `cut`

Finalize an active line as a release.

- Confirm the semantic version and update `identity.version`.
- Set a fresh build id and matching service-worker cache id.
- Update the manifests and README when public identity or behavior changed.
- Mark the wish `Shipped`, record its version/date, and archive its plan when useful.
- Run the complete verification baseline below.

Do not silently move from one lifecycle stage to another.

## Repository map

- `index.html`: sticky top bar and intentionally empty main application area.
- `assets/css/app.css`: themes, safe areas, shell layout, pills, and basic buttons.
- `assets/js/config.js`: identity, version/build id, assets, and shell preferences.
- `assets/js/icons.js`: small inline SF Symbol SVG catalog.
- `assets/js/app.js`: identity rendering, theme switching, Developer Mode, Beta detection, and service-worker registration.
- `assets/icons/`: editable SVG sources and generated install assets.
- `manifest.webmanifest` and `manifest-dark.webmanifest`: install metadata.
- `sw.js`: minimal offline shell.
- `README.md`: setup, customization, icons, SSH, and hosting instructions.

## Invariants

- Keep the runtime static, dependency-free, backend-free, and hostable as ordinary files.
- Keep `main#mainContent` blank unless the user is building a concrete application.
- The built-in application icon click changes theme; press-and-hold toggles Developer Mode without also changing theme.
- Developer Mode adds `DEV` to the single version pill. Beta remains a separate environment pill.
- Standard interface icons use inline SF Symbol SVGs rather than emoji or icon fonts.
- New controls use native elements, accessible names, visible focus, and touch-sized hit areas.
- Avoid horizontal overflow and preserve safe-area and reduced-motion behavior.
- App behavior changes update the build id and service-worker cache id together.

## Verification baseline

From the repository root:

```sh
for file in assets/js/*.js sw.js; do node --check "$file" || exit 1; done
node -e "const fs=require('fs'); for (const file of ['manifest.webmanifest','manifest-dark.webmanifest']) JSON.parse(fs.readFileSync(file,'utf8'));"
git diff --check
python3 -m http.server 8000
```

Check desktop and mobile layout, no horizontal overflow, both basic buttons and SVGs, theme click, Developer Mode hold/toggle-back, Beta detection, and offline reload. Stop the server afterward.

## End of turn

After file changes, give one concise outcome/verification summary followed by exactly one copy-paste command that stages only task files, commits with a specific imperative subject, and pushes the current branch. Do not run it unless explicitly requested.
