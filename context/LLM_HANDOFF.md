# Agent handoff

Start a new session with:

```text
Continue work in /Users/stripes/Documents/GitHub/app-template. Read AGENTS.md and context/LLM_HANDOFF.md first. Preserve manual edits and run git status --short before editing.
```

This repository is a focused SVG icon-library application. It includes the reusable top bar with centered icon search, a searchable and copyable 7,281-icon main catalog with compact 132–140px uniform-font SF Symbols/Custom cards sized to keep uninterrupted 20-character names intact and editable source filters, 500-icon batches, directly editable icon names/types/groups, identical Name/Type field layouts across metadata entry points, selected-category right-click removal with Undo, compact override export, and a sticky resizable category rail. Search terms receive high-contrast highlighting in result titles and catalog-card names, while selected search-field text uses a high-contrast accent selection. Type and Source share one filter row. The rail includes a persistent Ultra/Light/Medium/Bold/Black selector that treats imported All 1 Ultralight, All 3 Light, All 5 Medium, All 7 Bold, and All 9 Black artwork as canonical for matching SF Symbol previews and copied markup, maps 50 app-facing names to verified native counterparts across all five weights so all 6,918 SF Symbols have complete native coverage, exposes unclipped 1/3/5/7/9 shortcut bubbles, and leaves Bold as the default; custom icons do not change. A selects the All category, and C clears the search plus active category, type, source, and developer label-length filters. Category rows use larger text, share an aligned label inset, keep counts flush right, and place right/down disclosure chevrons at the far left inside the row container. The compiler scopes embedded SVG stylesheet selectors to each source artwork, preventing category-specific icon CSS from changing those application chevrons. The rail separates semantic **What it is** destinations from **How it looks** treatments; How it looks roots and descendants are alphabetized in both the rail and metadata editor. Recreation nests Games and Sport; Transportation nests Automotive; Geography nests Countries, Regions, Mapping, and Places; Nature nests Animals & Plants and Weather; Editing nests Text Formatting; and Entertainment & Media replaces Media. Development and Energy & Power provide dedicated semantic destinations for the expanded SF Symbols set. Geography separates geographic areas from mapping tools and physical destinations: Countries holds country outlines, Regions holds continents, administrative areas, territories, and world/globe views, Mapping holds map and navigation symbols, and Places holds buildings, landmarks, parks, stations, and other destinations. Arrows is an appearance branch with Chevron, Chevron Arrow, Triangle, and Triangle Arrow children. The former Actions, Locations, Games, Sports & Recreation, and Norway & Sweden category choices are removed, with legacy values migrated to current destinations. People is limited to icons whose metadata identifies a person or body part. Other remains visible directly below All at zero and every retained icon has at least one group and searchable name/category/synonym tags. The permanent override set contains 409 entries, including 150 exact category replacements imported from the September 4 export; exact entries may intentionally retain a broad parent or remove an inferred child/source category. Matching baked metadata is automatically removed from device-local pending overrides. The generated 93 MB catalog is committed as four deterministic 22–25 MB data parts plus a small assembler to avoid GitHub large-file warnings. The compiler excludes the broad `!backups:data` parent while reading its configured Objects & Tools, `norway:sweden`, `indicies`, `Rest`, native-weight `All 1 Ultralight`, `All 3 Light`, `All 5 Medium`, `All 7 Bold`, and `All 9 Black` children, retains the existing compiled catalog when former source folders move, and preserves unique stable IDs for distinct artwork sharing a source name. The main-page What’s New notice visibly counts down and marks itself seen after 30 seconds. Settings keeps its vertical icon-led navigation; its application-wide Text Size slider fills the row like the segmented controls, Button Style uses a matched square-only, A-only, and supplied square-and-A symbol set, and Hints uses the supplied circular restore symbol. Mobile Settings has one full-screen scroll surface with a sticky close header, and tab changes reset it to the top. Release Notes remain separate from the dedicated filterable Roadmap, with Shortcuts below Roadmap. GitHub setup presents Owner, linked Repository, Branch, and linked Path together on one config-driven metadata line above the token, remember choice, and compact Forget/Test/Save actions; state normalization prevents imports from redirecting that target. App Template targets `themadat/app-data/main/data/app-template.json`. The app also retains Developer Mode filters and divider feedback, Notes, combined local/GitHub Sync status, persistence/recovery, install assets, and the offline shell. The removed Records interface, multi-note workspace, rich-text editor, and app-space Roadmap are not part of the template.

How it looks includes Dashed & Dotted with 142 explicit dashed/dotted variants and Layered & Stacked with 88 explicit layer/stack variants. Permanent metadata overrides retain these objective appearance memberships.

On desktop, category navigation is vertically compact and category labels remain on one truncated line until the user widens the resizable rail. Mobile keeps larger horizontally scrolling category targets.

The app-identity SVGs give the grid, X, and three concentric circles the same 24-unit stroke width and full opacity so every path remains visible at 42px. The favicon keeps its full-bleed Safari-gray background and uses neon-blue geometry with three grid lines per axis, an X, and two circles but no square outlines; its center horizontal and vertical bars match the X stroke while the four outer grid guides remain lighter. GitHub Pages uses the checked-in custom Actions workflow. Its dynamic run title mirrors the required version-prefixed commit subject in Actions, while its fixed workflow name carries the matching application version for GitHub Mobile notifications.

## Workflows

### `reset`

Transform a copied repository into a clean foundation for a different application. This is an implementation workflow, not a wish/plan stage, and it intentionally makes broad deletions inside the copied repository.

- Read and follow `docs/RESET.md` completely before editing. Its keep/remove/rewrite lists are the authoritative reset checklist.
- Run the normal session preflight, inspect the repository path and `origin`, and require a clean working tree unless every pending change is explicitly part of the reset. Never reset the canonical `app-template` checkout or its canonical remote merely because the user typed the shorthand; if the target still appears canonical, obtain explicit confirmation and the new application identity first.
- Ask for or confirm the new application name before editing, then derive and autofill its short name, slug, page/manifest titles, download and sync filenames, storage namespace, and identity copy. Ask for a high-quality square app-icon source before editing and replace the header icon, favicon, install/touch/maskable icons, splash artwork, and editable sources; a completed reset never retains placeholder App Template art.
- Preserve the reusable static shell, Notes, vertical Settings experience, Appearance, generic Help/What’s New/Roadmap/Shortcuts sections, local persistence and recovery, JSON portability, optional GitHub Sync, PWA/offline behavior, accessibility, responsive layout, application-icon assets, and deployment workflow.
- Remove the searchable icon-library product: generated catalog parts and assembler, compiler and overrides, catalog markup and dialogs, catalog-only state/storage fields, render/edit/filter/copy logic, catalog-only shortcuts and hints, unused styles, service-worker entries, and all icon-library-specific product prose. Before removal, inventory every retained `data-symbol`, helper call, component action, and config symbol; bake their exact SVGs into `assets/js/icons.js` and remove its catalog fallback so the top bar, search, Notes, every Settings page, GitHub Sync, dialogs, toasts, and PWA controls stay intact without the generated library.
- Leave the main workspace as a semantic blank starter surface. Reset Roadmap to no items, Help to only accurate generic shell guidance, What’s New to one initial `0.0.1.1` release, Notes to blank, and `context/WISHES.md` to an empty `WISH-001` ledger. Remove obsolete wish/plan documents.
- Set every application/build/cache/deployment version surface to `0.0.1.1`, establish a new app-specific local-storage and sync identity so data from the template cannot bleed into the copied app, and rewrite README, architecture, component, customization, testing, and two-laptop Git setup documentation to describe only the retained starter foundation.
- When GitHub Sync remains enabled, guide the user through creating `data/<app-slug>.json` in `themadat/app-data`, point the read-only `config.cloudSync` target to it, and require a fine-grained token scoped only to `app-data` with **Contents: Read and write**. Use the quick links and verification checklist in `docs/RESET.md`; never request the token in chat or store it in source or app data.
- Do not rewrite Git history, change remotes, create repositories, commit, push, or deploy unless the user separately asks.
- Run the reset-specific acceptance checks in `docs/RESET.md`, then the surviving application verification baseline.

Reset is the only workflow allowed to move the application version backward. Its purpose is to begin a new product line, not to roll back the existing icon application.

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
- `docs/GIT-SETUP.md`: copy-paste terminal Git and GitHub SSH setup for separate personal and work Macs.

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

Check desktop and mobile layout, no horizontal overflow, centered global search, 500-icon batches, sticky desktop category rail, What it is/How it looks grouping, nested Arrows/Recreation/Geography filters, category-specific SVG stylesheet isolation, strict geographic area/tool/destination separation, strict People membership, zero uncategorized retained icons, Objects & Tools semantic cross-classification, category Up/Down activation, recursive collapse/persistence, A-to-All and C-to-clear behavior, nested Badged filters, legacy category migration, direct Name/Type editing, group/filter-source editing with retained provenance, compact override export, Developer Mode filters and divider feedback, Notes, Settings/Roadmap, combined local/GitHub Sync status, sync setup, modified and unmodified shortcuts, contextual hints, SVG controls, theme click/T shortcut, Beta detection, fresh online reloads, the new-version Force refresh action, and offline reload. Stop the server afterward.

## End of turn

After file changes, give one concise outcome/verification summary followed by exactly one copy-paste command that stages only task files, commits with the exact subject shape `Version - Text`, and pushes the current branch. Use `git add .` when `git status --short` confirms all changes belong to the task; otherwise name the task files explicitly. Do not run it unless explicitly requested.
