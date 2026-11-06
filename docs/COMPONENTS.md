# Shared UI

Use labelled semantic controls and `assets/js/icons.js` for standard symbols. State needs text or an accessible name as well as color/artwork.

- `components.openDialog`: remember trigger, open native modal, move focus; closing restores focus. Use confirm for destructive actions and choose for explicit sync decisions.
- `components.openMenu`: viewport-clamped popover with keyboard navigation and Escape.
- `components.toast` and `setLoading`: shared announcements and busy UI.
- Notes: one plain-text, autosaving modal; fullscreen on mobile.
- Settings: vertical icon-led tabs, separate Data Sync, Help, What's New, Roadmap, Shortcuts, and optional Developer panel. One mobile scroll surface with sticky close control.
- Appearance: system/light/dark, icons/text/both buttons, app-wide text scale, hints default off. Reduced motion follows the OS.
- App icon: click/T changes theme; hold or D/pipe toggles Developer Mode. Keep Beta separate from the version label.

## Search and catalog

The top bar is **Search Everything**: icons, settings, Notes, Help, Roadmap, and releases. Settings results open and focus controls without executing their actions. Results alternate between providers so catalog matches cannot crowd out support. Arrow Down enters results, Up/Down navigates, Enter activates a focused result, and Escape returns to search. Enter inside the search field retains the catalog's submit behavior.

`App.search.register({ id, search(query), activate(id), enabled?, limit? })` adds a provider and returns an unregister function. `search` returns `{ id, title, meta }` objects using stable IDs and plain text. `App.search.query(query, { only?, limit? })` combines results; `App.search.matches(text, query)` requires all terms and respects quoted word/phrase boundaries. Providers should return only a small result set. Keep activation separate from matching and never index credentials. Register app providers at startup after storage loads. Icon name-only mode restricts results to the icon provider.

Search matches names, aliases, tags, kinds, and categories, excluding provenance. Quoted words/phrases require whole matches; unquoted terms match partially, all terms required. Apostrophe enables displayed-name-only mode; slash focuses/selects the query and disables it. Clear resets filters and this mode. Suggestions and highlights use the same matching rules.

Cards render in batches of 500, preview click copies SVG, name click edits metadata, and info shows provenance. Right-click selected-category removal offers Undo. Type/Source share a row; weights affect previews/details/copied SF Symbols only. The desktop rail resizes and persists; mobile uses horizontal categories. Collapsing a selected branch moves selection to its parent. Keep category CSS isolated from SVG artwork.

## Tables

`App.tables.mount(container, { caption, columns, rows, preferences?, onPreferencesChange? })` creates a semantic table with filtering/counts, sorting, sticky headers, compact rows, and adjustable widths under Columns. Range controls support keyboard and touch. Overflow stays inside a labelled, keyboard-focusable table region on mobile. Reset view clears filtering/sorting, restores configured widths, and returns comfortable rows.

Each column has `{ id, label, width?, type?, sortable?, value? }`; `type: "number"` enables numeric sorting, `sortable: false` disables sorting, and `value(row)` supplies computed plain text. Missing values sort last in both directions. Cells always use textContent. The returned controller has `setRows(rows)` and `destroy()`. Optional `preferences` accepts `{ widths, compact }`; `onPreferencesChange` lets an app save those choices in its own device preferences. The helper does not alter storage or sync schemas. Do not mount a new table on every keystroke: use its controller so focus and view controls survive updates.

## Import review

`App.importReview.create({ prepare, onPreview, apply, confirm?, onApplied?, onError?, onBusy? })` returns `preview(input)`, `commit()`, `cancel()`, and `getPhase()`. `prepare` parses, migrates, sanitizes, and validates using the app's existing data contract; throw on failure. `onPreview` displays the prepared candidate and warnings without changing saved data. An explicit user action calls `commit`; optional async `confirm(candidate)` must accept before `apply(candidate)` runs. `apply` owns recovery and mutation and must throw on failure. Only `onApplied` reports success.

Late file reads cannot replace a newer review, repeated commits are ignored, and cancellation during confirmation prevents apply. Cancellation is unavailable once apply starts. Errors retain a reviewed candidate for retry when appropriate. Use `onBusy` to disable Continue; avoid blocking a confirmation dialog with a loading overlay.

Backup import uses this lifecycle and the shared table to compare current and imported content. Filtering is preview-only: restoration remains a complete replacement after confirmation and a successful recovery save. Credentials and the fixed sync target stay outside the import contract. Domain-specific parsers, row selection, and additive merge rules belong to the consuming app, not the backup importer.

## Keyboard

Register commands in `SHORTCUTS`, declare `data-shortcut` for hints, and provide a visible action. Shift–Control–Option reveals eligible badges; hover explains them. Respect editable fields, IME, browser shortcuts, and modal focus. Chorded Clear/Update may work inside search; plain C/R must not consume typing. Use arrows for tabs, categories, and cards; Escape closes temporary UI and restores focus.

The toolbar Update symbol changes when an update waits. What's New dismisses after a device-configured 1–300 seconds (default 20); contextual V/X open/dismiss it. Do not restore the removed update pop-up.
