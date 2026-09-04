# Agent handoff

Start a new session with:

```text
Continue work in /Users/stripes/Documents/GitHub/app-template. Read AGENTS.md and context/LLM_HANDOFF.md first. Preserve manual edits and run git status --short before editing.
```

This repository is a focused SVG icon-library application. It includes the reusable top bar with centered icon search, a searchable and copyable 7,232-icon main catalog with compact 132–140px uniform-font SF Symbols/Custom cards sized to keep uninterrupted 20-character names intact and editable source filters, 500-icon batches, directly editable icon names/types/groups, identical Name/Type field layouts across metadata entry points, selected-category right-click removal with Undo, compact override export, and a sticky resizable category rail. The rail includes a persistent Light/Medium/Bold selector that applies self-contained SVG morphology only to SF Symbol previews and copied markup; Bold remains the default and custom icons do not change. Category rows use larger text, share an aligned label inset, keep counts flush right, and place right/down disclosure chevrons at the far left inside the row container. The rail separates semantic **What it is** destinations from **How it looks** treatments; How it looks roots and descendants are alphabetized in both the rail and metadata editor. Recreation nests Games and Sport; Transportation nests Automotive; Geography nests Countries, Regions, Mapping, and Places; Nature nests Animals & Plants and Weather; Editing nests Text Formatting; and Entertainment & Media replaces Media. Development and Energy & Power provide dedicated semantic destinations for the expanded SF Symbols set. Geography separates geographic areas from mapping tools and physical destinations: Countries holds country outlines, Regions holds continents, administrative areas, territories, and world/globe views, Mapping holds map and navigation symbols, and Places holds buildings, landmarks, parks, stations, and other destinations. Arrows is an appearance branch with Chevron, Chevron Arrow, Triangle, and Triangle Arrow children. The former Actions, Locations, Games, Sports & Recreation, and Norway & Sweden category choices are removed, with legacy values migrated to current destinations. People is limited to icons whose metadata identifies a person or body part. Other remains visible directly below All at zero and every retained icon has at least one group and searchable name/category/synonym tags. The permanent override set contains 409 entries, including 150 exact category replacements imported from the September 4 export; exact entries may intentionally retain a broad parent or remove an inferred child/source category. Matching baked metadata is automatically removed from device-local pending overrides. The compiler excludes the broad `!backups:data` parent while reading only its configured Objects & Tools, `norway:sweden`, `indicies`, and `Rest` children, retains the existing compiled catalog when former source folders move, and preserves unique stable IDs for distinct artwork sharing a source name. The main-page What’s New notice visibly counts down and marks itself seen after 30 seconds. The app also retains simplified Appearance settings, Developer Mode filters and divider feedback, Notes, Settings/Roadmap, combined local/GitHub Sync status, persistence/recovery, install assets, and the offline shell. The removed Records interface, multi-note workspace, rich-text editor, and app-space Roadmap are not part of the template.

How it looks includes Dashed & Dotted with 142 explicit dashed/dotted variants and Layered & Stacked with 88 explicit layer/stack variants. Permanent metadata overrides retain these objective appearance memberships.

On desktop, category navigation is vertically compact and category labels remain on one truncated line until the user widens the resizable rail. Mobile keeps larger horizontally scrolling category targets.

The app-identity SVGs give the grid, X, and three concentric circles the same 24-unit stroke width and full opacity so every path remains visible at 42px. The favicon keeps its full-bleed Safari-gray background and uses neon-blue geometry with three grid lines per axis, an X, and two circles but no square outlines; its center horizontal and vertical bars match the X stroke while the four outer grid guides remain lighter. GitHub Pages uses the checked-in custom Actions workflow. Its dynamic run title mirrors the required version-prefixed commit subject in Actions, while its fixed workflow name carries the matching application version for GitHub Mobile notifications.

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
- Add only the architecture the real feature needs. Do not reintroduce the former Records interface, rich-text editor, or a speculative framework.
- Use `major.minor.patch.build` versions. For every completed application update, increment the fourth `build` component. When the user chooses a new major, minor, or patch value, reset `build` to `1` unless they specify it. Keep `identity.buildId` equal to the full version, add or update the matching dated release entry, update the build queries in `index.html`, update `CACHE_NAME` plus `ASSET_VERSION` in `sw.js`, and update the version in `.github/workflows/deploy-pages.yml`'s workflow `name` together.
- Verify the affected desktop, mobile, accessibility, and offline behavior.

### `cut`

Finalize an active line as a release.

- Confirm the semantic version and update `identity.version`.
- Confirm the major, minor, and patch values, set the fourth build component to `1` unless another value is requested, and use that full version for the build and service-worker cache ids.
- Update the manifests and README when public identity or behavior changed.
- Mark the wish `Shipped`, record its version/date, and archive its plan when useful.
- Run the complete verification baseline below.

Do not silently move from one lifecycle stage to another.

## Repository map

- `index.html`: sticky shell, icon catalog, Notes, Settings, dialogs, and live regions.
- `assets/css/app.css`: themes, safe areas, components, module layouts, and responsive behavior.
- `assets/js/config.js`: identity, version/build id, assets, theme defaults, Help, releases, and Roadmap data.
- `assets/js/icons.js`: inline SF Symbol SVG catalog.
- `assets/js/app.js`: rendering, event wiring, shortcuts, theme, Developer Mode, and Beta detection.
- `assets/js/core/`: state, storage, reusable components, portability, GitHub Sync, and PWA behavior.
- `assets/icons/`: editable SVG sources and generated install assets.
- `.github/workflows/deploy-pages.yml`: static-site Pages deployment with version-labelled Actions runs and GitHub Mobile notifications.
- `manifest.webmanifest` and `manifest-dark.webmanifest`: install metadata.
- `sw.js`: minimal offline shell.
- `README.md`: setup, customization, icons, SSH, and hosting instructions.

## Invariants

- Keep the runtime static, dependency-free, backend-free, and hostable as ordinary files.
- Preserve the full sibling-repository icon scan and searchable icon catalog, single Notes modal, and Settings Roadmap unless the user explicitly removes or replaces them.
- Use one GitHub Pages deployment path. Keep **Settings → Pages → Source** set to **GitHub Actions** so `.github/workflows/deploy-pages.yml` is the only deployment triggered by pushes to `main`; do not also enable branch deployment.
- The built-in application icon click changes theme; press-and-hold toggles Developer Mode without also changing theme.
- Developer Mode adds `DEV` to the single version pill. Beta remains a separate environment pill.
- Standard interface icons use inline SF Symbol SVGs rather than emoji or icon fonts.
- New controls use native elements, accessible names, visible focus, and touch-sized hit areas.
- Avoid horizontal overflow and preserve safe-area and reduced-motion behavior.
- Every application update advances the fourth component of the visible `major.minor.patch.build` version, with the same full value used for the build id, release, asset queries, and service-worker cache.
- The full application version in `.github/workflows/deploy-pages.yml`'s workflow `name` matches every other version surface; GitHub Mobile ignores `run-name` and displays this fixed name in completion notifications.

## Verification baseline

From the repository root:

```sh
for file in assets/js/*.js sw.js; do node --check "$file" || exit 1; done
node -e "const fs=require('fs'); for (const file of ['manifest.webmanifest','manifest-dark.webmanifest']) JSON.parse(fs.readFileSync(file,'utf8'));"
git diff --check
python3 -m http.server 8000
```

Check desktop and mobile layout, no horizontal overflow, centered global search, 500-icon batches, sticky desktop category rail, What it is/How it looks grouping, nested Arrows/Recreation/Geography filters, strict geographic area/tool/destination separation, strict People membership, zero uncategorized retained icons, Objects & Tools semantic cross-classification, category Up/Down activation, recursive collapse/persistence, nested Badged filters, legacy category migration, direct Name/Type editing, group/filter-source editing with retained provenance, compact override export, Developer Mode filters and divider feedback, Notes, Settings/Roadmap, combined local/GitHub Sync status, sync setup, modified and unmodified shortcuts, contextual hints, SVG controls, theme click/T shortcut, Beta detection, fresh online reloads, the new-version Force refresh action, and offline reload. Stop the server afterward.

## End of turn

After file changes, give one concise outcome/verification summary followed by exactly one copy-paste command that stages only task files, commits with the exact subject shape `Version - Text`, and pushes the current branch. Use `git add .` when `git status --short` confirms all changes belong to the task; otherwise name the task files explicitly. Do not run it unless explicitly requested.
