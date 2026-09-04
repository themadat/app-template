# Architecture

## Layers

The application is a static page with ordered scripts and no module loader:

1. `config.js` defines identity, feature flags, theme defaults, help, releases, and demonstration Roadmap content.
2. `icons.js` provides the small SF Symbol set used by the application shell.
3. `icon-library.js` is the committed generated catalog of sanitized, deduplicated SVG symbols, categories, semantic tags, aliases, and source metadata; `build/icon-library-overrides.json` supplies permanent display-name, type, group, filter-source, and exclusion metadata.
4. `core/utils.js` provides escaping, sanitization, URL/color validation, ids, dates, and hashing.
5. `core/state.js` owns defaults, normalization, migrations, validation, export envelopes, sync payloads, and collection merging.
6. `core/storage.js` loads and autosaves browser state, stores the optional token separately, and manages one recovery copy.
7. `core/components.js` implements dialogs, choices, menus/popovers, loading UI, toasts, and long press.
8. `core/portability.js` handles safe JSON import and export.
9. `core/sync.js` implements optional GitHub synchronization.
10. `core/pwa.js` manages appearance-aware install metadata, device detection, service-worker registration, and update messaging.
11. `app.js` renders the searchable icon catalog, shell, and Settings modules and binds interactions and shortcuts.

`build/compile-icon-library.mjs` is a dependency-free development tool rather than a runtime requirement. By default it discovers every non-hidden sibling application directory and only the configured Objects & Tools, `norway:sweden`, and `indicies` children beneath the excluded `!backups:data` parent. It captures complete SVG template literals and standalone SVG files, sanitizes the markup, classifies SF Symbols versus Custom artwork, hashes normalized artwork, merges aliases/source references, coalesces repeated SF Symbol names, skips generated bundles and corrupted derived outputs, normalizes SF Symbol paint to currentColor, removes the `Svgrepo Com` display-label suffix, assigns multiple categories where appropriate, expands semantic search tags, and rewrites the single generated catalog file. Categories expose a `meaning` or `appearance` section. Geography owns Countries, Regions, Mapping, and Places; source-aware and metadata rules separate country outlines, regional/administrative areas and world views, map/navigation tools, and physical destinations. Other source-aware rules place Text Formatting, Connectivity, game artwork, indices, and Norway/Sweden currency symbols into their focused source categories and applicable existing semantic categories. Legacy Locations, Maps, and Maps & Travel category IDs normalize during compilation and state loading. Badged remains a collapsible appearance tree with 39 primary choices—including plain Badge—plus nested Shapes and Exclamation Mark variants. Stable icon IDs let the compiler apply validated display-name, type, category, and optional filter-source changes from `build/icon-library-overrides.json` after deduplication. The UI renders 500 matching cards at a time so the large catalog remains responsive.

All modules attach to `window.LocalApp`. Runtime network access occurs only after the user configures or invokes GitHub Sync.

## State model

The current model is version 4:

```json
{
  "schemaVersion": 4,
  "meta": {
    "appVersion": "0.0.1.42",
    "buildId": "0.0.1.42",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "lastMutationId": "stable id",
    "tombstones": { "records": [], "documents": [] }
  },
  "workspace": {
    "title": "My App",
    "records": [],
    "documents": [
      {
        "id": "app-notes",
        "title": "Notes",
        "html": "Escaped plain text"
      }
    ]
  },
  "preferences": {
    "appearance": {},
    "controls": {},
    "hints": {},
    "installation": {}
  },
  "ui": {
    "activeModule": "roadmap",
    "selectedDocumentId": "app-notes",
    "search": "",
    "documents": {},
    "panels": {},
    "navigation": {},
    "seenReleaseVersion": "",
    "supportTab": "settings"
  },
  "modules": {
    "iconLibrary": { "category": "all", "kind": "all", "source": "all", "sidebarWidth": 204, "minimumLabelLength": 0, "collapsedCategories": ["badged"], "overrides": [] },
    "documents": {},
    "roadmap": {},
    "cloudSync": {}
  }
}
```

Icon-library overrides are normalized to stable icon ID, sanitized display name, optional Custom/Symbol type, recognized category IDs with required ancestors, and an optional recognized filter source. Legacy `locations`, `locations-countries`, `locations-regions`, `locations-mapping`, `locations-places`, `maps`, `maps-travel`, and `other` assignments migrate to the compiled semantic categories without losing name/type/source edits. Permanent overrides may opt into exact category replacement so an exported removal is not repopulated by inferred child membership. The filter-source override changes filtering only; compiled source-file provenance remains intact. Overrides are user-managed content: backup and sync include them, Reset Preferences preserves them, and Erase All removes them. Category collapse state and filter-rail width persist as preferences. `minimumLabelLength` is a Developer Mode filter from 0 through 120; it persists locally but is ignored while Developer Mode is off.

The single Notes modal continues to use the legacy `documents` collection and `html` field so older exports remain compatible. New editing is plain text; it is escaped before being stored in the stable `app-notes` document. Fresh Notes are blank, and normalization removes the exact former demonstration sentence while preserving all other user text. The v3→v4 migration consolidates multiple older documents into this one note and keeps their titles as section headings. Empty `records` and related tombstone/UI fields are retained only as backward-compatibility scaffolding for older backups and sync data. There is no Records interface or demonstration record data.

The GitHub token is never part of application state. It lives under a separate per-device storage key and is excluded from export, sync payloads, diagnostics, and visible fields after entry.

## Persistence and migration

Startup checks the current storage key and then known legacy keys. Every candidate runs through wrapper unwrapping, sequential migration, normalization, sanitization, and validation. Malformed saved state falls back to a valid recovery copy or a fresh default without replacing an import file.

User mutations update metadata and schedule an autosave. Storage failures emit an application event that becomes an actionable toast. Import, cloud download, merge, reset, and other replacements create or preserve recovery data as appropriate.

Add a migration by creating `migrateNtoNPlus1`, registering it in `migrations`, increasing `schemaVersion`, and adding a fixture that proves renamed, removed, split, or combined values preserve user content.

## GitHub conflict strategy

The sync module stores a baseline target, SHA, and content hash after a successful sync. A remote check compares local, remote, and baseline hashes:

- Local only: upload.
- Remote only: download after saving a recovery copy.
- Equal: report Current.
- No baseline or missing remote file: request a first-sync decision.
- Both changed: offer merge, upload, download, or cancel.

Merging chooses the newer note for each stable id, honors newer deletion tombstones, and takes preferences from the newer whole state while preserving local per-device cloud configuration. Requests are sequenced and aborted to prevent overlap and stale responses. Checks repeat periodically, on visibility, and when connectivity returns.

## Accessibility and responsive behavior

The shell uses landmarks, native buttons and inputs, native dialogs, tabs, status regions, and explicit ARIA state. The icon catalog is an announced list of native copy buttons; its sticky vertical filter rail labels separate What it is and How it looks groups, using native pressed buttons, nested groups, and collapse buttons. The resizable divider is an operable ARIA separator, and search results can move focus to the corresponding card. Collapse controls expose `aria-expanded`/`aria-controls`; collapsing a branch with the selected descendant moves selection to the visible parent. Icon details labels and validates its direct Name/Type fields; the complete metadata editor labels every group checkbox and source selector, manages recursive parent/subgroup membership, and uses a custom confirmation before resetting an icon. Copy and save results use live toast messaging. Opening a dialog moves focus; closing restores the trigger. Escape closes temporary UI. All primary actions have keyboard and touch equivalents.

Notes uses one spacious modal on desktop and a full-screen editor on mobile. Settings also becomes a full-screen dialog with one scrolling content surface. Safe-area variables, 16px mobile form controls, reduced motion, and horizontal overflow protection are built into the shared stylesheet.

## PWA and offline strategy

`sw.js` precaches the application shell, all core scripts, manifests, and light/dark assets. Same-origin application requests use the network first with cache revalidation, then fall back to the cached shell when offline. Optional GitHub API traffic remains network-only. A waiting service worker triggers a persistent bottom **New version available** toast. Its accessible clockwise-arrow action activates the waiting worker and reloads through a cache-busting URL so installed PWAs can update immediately. Contextual R and X shortcuts run Force Refresh or close the notice, with plain and Shift–Control–Option commands registered through the shared shortcut system.
