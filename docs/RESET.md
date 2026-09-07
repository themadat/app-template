# Reset a copied template

The one-word `reset` workflow turns a copy of App Template into a clean foundation for a different product. It keeps the reusable local-first application shell and removes the current SVG icon-library product. This is a source transformation performed by an agent, not a browser preference reset or a shell script.

The refined pre-launch shell at version `0.0.1.1` is the semantic baseline. Do not revert the repository to an old commit: later reusable fixes to Settings, sync, storage, PWA behavior, accessibility, and responsive layout must survive.

## Required preflight

1. Run `git status --short`, inspect the current path, and inspect `git remote -v`.
2. Continue only in the intended copied repository. Treat a directory named `app-template`, an `origin` ending in `themadat/app-template`, or an unchanged **App Template** identity as a canonical-target warning. If any remain, require explicit confirmation that this exact checkout should be transformed and obtain the new identity first.
3. Require a clean working tree unless every pending change is explicitly part of the reset. Do not discard or overwrite unrelated work.
4. Resolve the new application name, short name, filesystem-safe slug, one-sentence description, repository/support URL, and storage namespace. Prefer explicit values, then a non-template remote, then the copied-directory name. Ask for only the values that remain ambiguous.
5. Record the files that will be deleted before deleting them. Use exact paths; never use an unresolved broad glob or touch `.git`.

## Keep

- The static, dependency-free HTML/CSS/JavaScript architecture.
- The application header and semantic blank main workspace.
- The single plain-text Notes modal and its local autosave behavior.
- Vertical Settings navigation and the Appearance, Help, What’s New, Roadmap, Shortcuts, and Developer sections. What’s New and Roadmap remain separate.
- Theme selection, button presentation, text scale, contextual hints, focus handling, keyboard infrastructure, safe-area support, reduced-motion support, and responsive layout.
- Combined local/GitHub status, recovery copies, JSON export/import, and optional GitHub Sync with secrets kept outside exported state.
- PWA registration, offline shell, update notice, manifests, install assets, and the GitHub Pages Actions workflow.
- `assets/js/icons.js` and only the symbols needed by the retained interface. This small inline interface-symbol set is not the icon-library product.
- Reusable utilities and components in `assets/js/core/`, pruned to the state and behavior the starter shell still uses.
- The `reset`, `wish`, `plan`, `start`, and `cut` workflow contracts.

## Remove

- `assets/js/icon-library-part-1.js` through `assets/js/icon-library-part-4.js` and `assets/js/icon-library.js`.
- `build/compile-icon-library.mjs` and `build/icon-library-overrides.json`. Remove the empty `build/` directory if nothing reusable remains.
- Icon-library scripts and preload/cache entries from `index.html` and `sw.js`.
- The catalog rail, weight selector, cards, empty/loading states, metadata and details dialogs, override export controls, and icon-specific Developer controls from `index.html`.
- Catalog loading, search, category, source, type, weight, editing, override, copy, rail-resizing, pagination, and icon-specific shortcut code from `assets/js/app.js`.
- Icon-library state defaults, normalization, migrations, backup fields, and sync payload fields from `assets/js/core/state.js` and related core files. A new app does not inherit compatibility obligations for the template’s icon metadata.
- Catalog-only CSS after confirming that no retained shell component uses it.
- Catalog hints, Help topics, release history, Roadmap items, shortcut entries, feature flags, and other configuration content.
- Icon compiler, taxonomy, source-folder, canonical-weight, generated-file, catalog-count, icon-editing, and icon-specific testing prose throughout README, docs, agent context, and sample data.
- Obsolete wish/plan documents from the previous product line.

Do not remove the application icon assets, PWA icons, or the interface SVG symbol helper merely because their names contain “icon.” They serve the retained shell.

## Rewrite the starter state

- Set `identity.version` and `identity.buildId` to `0.0.1.1`.
- Set the same `0.0.1.1` value in every `index.html` build query, `CACHE_NAME`, `ASSET_VERSION`, and the fixed workflow `name` in `.github/workflows/deploy-pages.yml`.
- Apply the resolved name, short name, description, URLs, and theme metadata in `assets/js/config.js`, `index.html`, both manifests, and any downloadable backup metadata.
- Give the new application distinct local-storage, secret-storage, recovery, install, and GitHub Sync identifiers derived from its slug. Do not load the template’s existing browser data into the new app.
- Leave Notes blank on first run.
- Replace releases with one dated `0.0.1.1` entry describing the new application foundation. This is the entire initial What’s New history.
- Set Roadmap data to an empty array. The retained Roadmap UI must show an accurate empty state rather than demonstration items.
- Replace Help with concise topics that describe only retained behavior: getting started, Notes, appearance, backup/restore, optional GitHub Sync, install/offline updates, privacy, and shortcuts. Omit a topic when its corresponding feature is removed.
- Rebuild the visible shortcut list from the retained controls only. Remove catalog commands such as category, clear-filter, first-result, details, load-more, and weight keys.
- Reset `context/WISHES.md` to its empty ledger structure with `Next id: WISH-001`. Delete old `context/WISH-*-PLAN.md` files.
- Rewrite `README.md`, `docs/ARCHITECTURE.md`, `docs/COMPONENTS.md`, `docs/CUSTOMIZATION.md`, `docs/TESTING.md`, `AGENTS.md`, and the product description/invariants in `context/LLM_HANDOFF.md` around the new identity and actual retained surface. Keep this reset contract available for later copies, but remove historical icon-product details from it once their exact filenames no longer exist.
- Replace icon-specific sample backups with generic starter examples or remove them together with every reference.
- Leave application icon artwork as a clearly documented placeholder unless the reset request supplies replacement artwork.

Resetting a copied application is the sole versioning exception that may move a version backward. Later completed application changes resume normal four-part versioning at `0.0.1.2`.

## Boundaries

Reset does not rewrite or squash Git history, change branches or remotes, create a GitHub repository, change GitHub Pages settings, commit, push, or deploy. Perform any of those only after a separate explicit request.

Reset also does not invent the new product’s data model or first feature. The output is a blank, working foundation ready for `wish`, `plan`, or a direct scoped implementation request.

## Acceptance checks

1. Search source, runtime, docs, and sample data for the removed filenames and identifiers. No runtime reference to `icon-library`, `iconLibrary`, generated catalog parts, the compiler, catalog categories, canonical weights, catalog-specific shortcuts, or override exports may remain. The only acceptable icon terminology describes application/PWA assets or the retained interface-symbol helper.
2. Confirm that no file larger than 20 MB remains unless the new application intentionally supplied it.
3. Confirm all public identity, storage namespaces, manifests, asset queries, cache ids, release data, and workflow version labels agree with the new app and `0.0.1.1`.
4. Confirm What’s New has exactly one initial release, Roadmap has zero items and a useful empty state, Help contains only accurate retained topics, Notes starts blank, and `context/WISHES.md` starts at `WISH-001`.
5. Run JavaScript syntax checks for every remaining script, parse both manifests, run `git diff --check`, and verify every local path referenced by HTML, manifests, CSS, config, and the service worker exists.
6. Serve the repository locally and test desktop and mobile: startup without console errors, blank main workspace, header, Notes autosave, every Settings page, appearance controls, empty Roadmap, release/help search, shortcut hints, backup/import, combined local/GitHub status, PWA registration, update flow, offline reload, visible focus, reduced motion, and no horizontal overflow.
7. Stop the local server. Review `git status --short` and the deletion list before handing off the change.

The reset is complete only when the copied app works independently without loading, documenting, testing, or storing any part of the former icon-library product.
