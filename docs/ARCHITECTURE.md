# Proposed architecture

This structure was approved by the source audit before implementation. Required foundation, shared components, optional modules, demonstration data, and extension points are kept visibly separate.

## File and module structure

```text
index.html
manifest.webmanifest
manifest-dark.webmanifest
sw.js
assets/
  css/
    app.css                    Required shell, components, responsive layout, themes
  icons/
    favicon.svg                Appearance-aware browser icon
    app-icon-*.svg             Editable neutral icon sources
    icon-*.png                 Generated PWA and home-screen assets
    splash-*.png               Optional Apple launch assets
  js/
    config.js                  Identity, feature flags, statuses, releases, roadmap, help
    core/
      utils.js                 Escaping, sanitizing, validation, ids, dates, hashes
      state.js                 Defaults, schema, migrations, normalization, validation
      storage.js               Load/save, quota recovery, recovery snapshots, secret storage
      components.js            Dialogs, confirmations, toasts, popovers, focus management
      portability.js           JSON export, import parsing, preview, replacement
      sync.js                  Optional GitHub Contents API state machine
      pwa.js                   Service worker, update, device diagnostics, theme-aware assets
    app.js                     Shell rendering, event wiring, records/documents/support modules
docs/
  SOURCE-AUDIT.md              Evidence and decisions from both source applications
  ARCHITECTURE.md              This design and state strategy
  CUSTOMIZATION.md             Rename, themes, modules, records, releases, assets
  COMPONENTS.md                Reusable component and accessibility conventions
  TESTING.md                   Desktop/mobile/offline/import/migration/sync checklists
```

The browser loads ordered classic scripts. Each file attaches a narrow API to `window.LocalApp`; there is no bundler, package manager, import map, or runtime dependency.

## State schema

The persisted root is one human-readable object:

```json
{
  "schemaVersion": 3,
  "meta": {
    "appVersion": "1.0.0",
    "buildId": "2026.08.01.1",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "lastMutationId": "unique id",
    "tombstones": {
      "records": [],
      "documents": []
    }
  },
  "workspace": {
    "title": "My Workspace",
    "records": [],
    "documents": []
  },
  "preferences": {
    "appearance": {},
    "controls": {},
    "hints": {},
    "installation": {}
  },
  "ui": {
    "activeModule": "records",
    "selectedRecordId": "",
    "selectedDocumentId": "",
    "search": "",
    "records": {},
    "documents": {},
    "panels": {},
    "navigation": {},
    "dismissedHints": [],
    "seenReleaseVersion": ""
  },
  "modules": {
    "records": {},
    "documents": {},
    "roadmap": {},
    "cloudSync": {}
  }
}
```

Secrets are not part of this object. A GitHub token is stored under a separate per-device storage key and is never included in exports, developer output, or visible token fields after initial entry.

### Record model

Records demonstrate a replaceable entity type without domain rules:

```json
{
  "id": "record-id",
  "title": "Example item",
  "summary": "Short plain-text description",
  "category": "General",
  "status": "active",
  "url": "https://example.com",
  "tags": ["sample"],
  "favorite": false,
  "order": 0,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Document model

```json
{
  "id": "document-id",
  "title": "Welcome",
  "html": "<p>Allow-listed rich text</p>",
  "order": 0,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

## Migration strategy

1. Parse without mutating the active state.
2. Detect the input shape and convert known legacy export wrappers.
3. Read `schemaVersion`, defaulting recognized legacy objects to version 1.
4. Apply sequential, pure migrations (`1 → 2`, then `2 → 3`).
5. Normalize every supported field against defaults and allow-lists.
6. Sanitize all strings, rich text, URLs, colors, ids, arrays, and numeric ranges.
7. Validate required structural invariants.
8. Return a candidate and human-readable summary.
9. Before replacement, save the current state as a recoverable local snapshot.
10. Commit the candidate only after explicit confirmation.

Migrations demonstrate renamed, removed, split, and combined fields. Unknown fields are intentionally pruned from the normalized state while recognized user content is retained. Migration failures leave the active state untouched.

## Accessibility plan

- Native landmarks, headings, buttons, inputs, links, tabs, and `<dialog>` elements.
- One dialog manager records the trigger, chooses initial focus, relies on native modal focus containment, handles Escape, and restores focus.
- Tabs use `role="tablist"`, `role="tab"`, `role="tabpanel"`, arrow-key navigation, `aria-selected`, and managed `tabindex`.
- Menus, listboxes, popovers, and expandable objects maintain ARIA state and close on Escape/outside interaction.
- All icon-only controls have names and tooltips; button presentation can switch among icon, text, or both.
- Focus is visible, ordering is predictable, and controls meet a 44px mobile target.
- Status is always icon + text + color, announced through polite/assertive live regions.
- Dragging and long-press actions have buttons and keyboard equivalents.
- Motion is reduced through both system media queries and the app preference.
- Destructive dialogs identify the exact scope of deletion.
- Automated checks are supplemented by the manual checklist in `docs/TESTING.md`.

## Responsive layout plan

- Desktop (`≥ 960px`): sticky shell, module rail, independently showable list/detail panels, draggable keyboard-operable divider, and persisted proportions.
- Tablet (`700–959px`): single-column content with compact horizontal module navigation and full-width detail surfaces.
- Mobile (`< 700px`): explicit list/detail navigation, bottom-safe floating actions, full-screen dialogs with a single document scroll surface, 16px form controls, and no compressed desktop columns.
- All sizes: `min-width: 0`, content wrapping, viewport-clamped popovers, safe-area padding, and global overflow prevention.

## PWA and offline strategy

- Cache only the versioned application shell and local assets.
- Use cache-first for shell assets and navigation fallback; optional GitHub API requests remain network-only.
- Install a new cache atomically and remove old application caches during activation.
- Continue running if service workers, caches, native browser installation, or storage estimates are unavailable.
- Announce an installed update and let the user explicitly refresh.
- Switch light/dark manifest and icon references when appearance changes.
- Leave installation to the browser or operating system rather than intercepting its prompt with an in-app modal.

## Cloud synchronization conflict strategy

The optional GitHub module stores a JSON backup in a configured repository file using the GitHub Contents API.

1. Compute a stable fingerprint of syncable state without secrets or volatile diagnostics.
2. Retain the last successful baseline fingerprint and remote SHA per target.
3. Check the remote file at startup after configuration, periodically, on visibility, and when connectivity returns.
4. Classify setup, checking, uploading, downloading, current, local-only change, remote-only change, first-sync, conflict, offline, and error states.
5. On a clean one-sided change, the primary Sync action performs the indicated transfer.
6. On first sync or divergence, show a custom decision dialog: upload local, download remote, merge, or cancel.
7. Merge records/documents by id and `updatedAt`, honoring newer deletion tombstones; use the newer state for preferences while preserving local per-device cloud configuration.
8. Save a recovery snapshot before download or merge replacement.
9. Use a busy guard, request sequence, and `AbortController` so overlapping or stale responses cannot mutate state.
10. If GitHub returns an unexpected SHA conflict, stop and recheck; never retry a destructive write silently.

Browser storage cannot make a personal access token cryptographically secure. The interface explains this limitation, stores the token only on the configured device, never exports or re-displays it, and lets the user forget it at any time.

## Removable optional modules

- Documents workspace (`features.documents`).
- GitHub synchronization (`features.cloudSync`).
- Roadmap (`features.roadmap`).
- Developer tools (`features.developerTools`).
- Contextual hints (`features.hints`).
- Demonstration records (`features.demoData`, replaced on first-run customization).

Each module is hidden through `assets/js/config.js`; removal instructions identify any associated markup/script/cache entries. The Records shell, state layer, storage layer, component layer, accessibility behavior, backup/restore, and PWA shell are the required foundation.
