# Source application audit

This audit was completed before implementation. It covers the reusable foundations in:

- `/Users/stripes/Documents/GitHub/visit-tracker`
- `/Users/stripes/Documents/GitHub/cocktail-list`

The template intentionally does not copy either application's names, content, artwork, geographic data, recipes, inventories, or business rules.

## Executive summary

Both sources are local-first, dependency-free, single-page applications built with plain HTML, CSS, and JavaScript. Both use browser storage, JSON backup and restore, responsive layouts, searchable/filterable data, install guidance, keyboard shortcuts, safe external links, and compact toolbar-driven interfaces.

The stronger reusable foundation is a combination rather than a direct copy:

- Adopt Visit Tracker's single normalized state object, default-state repair, persisted workspace layout, native dialogs, reusable settings/help/releases area, configurable themes, and keyboard coverage.
- Adapt Cocktail List's optional GitHub Contents API synchronization, remote fingerprinting, periodic checks, and visible sync status.
- Replace limitations shared by or present in either source: add an explicit schema version and migration pipeline, import previews, recoverable replacements, storage-quota handling, centralized identity, focus restoration, a service worker, system theme support, merge-aware conflicts, and secret-free exports.

## Shared reusable feature inventory

### Architecture

- Static single-page application.
- Plain HTML, CSS, and JavaScript with no required build step or runtime package.
- Local-first operation with optional network actions.
- Central render/update flow driven by in-memory state.
- Companion manifest and icon files.
- Responsive rules that change density and navigation for smaller screens.
- Central version constant displayed in the interface.

### Interface shell

- Sticky top bar with identity, version, search, and compact actions.
- Search shortcut using `/`.
- Search, filters, sorting, expandable rows, modal editors, and empty states.
- Icon-only toolbar actions with accessible labels.
- Sticky headers and floating actions.
- Mobile-specific restructuring rather than only shrinking desktop controls.
- Visible status affordances and progress messaging.

### Persistence and portability

- `localStorage` as the authoritative store for user data.
- Automatic persistence after edits.
- Default data and normalization/migration behavior.
- JSON export and import.
- Sanitization of imported fields.
- Preservation of user-created records through application upgrades.
- Separate per-device settings for optional network configuration.

### Appearance

- CSS custom properties for application colors and sizing.
- Theme-aware icons or install assets.
- Strong focus and selected-state treatments.
- Touch-friendly mobile controls.
- Safe-area adjustments in important fixed/mobile surfaces.

### Accessibility and interaction

- Semantic buttons and form controls for most primary actions.
- Keyboard-operable expandable rows.
- Escape handling for dialogs and popovers.
- ARIA state such as `aria-expanded`, `aria-selected`, `aria-pressed`, and live status.
- Shortcut-hint overlays activated by a modifier combination.
- Pointer and keyboard activation for primary objects.
- Reduced-motion handling in Visit Tracker.

### Installation and support

- Web app manifest and install icons.
- Device-oriented installation guidance.
- In-app version display.
- Feature/release information and help-like documentation.
- Manual JSON backup as the durable fallback path.

## Differences and recommended template approach

| Concern | Visit Tracker | Cocktail List | Template decision |
| --- | --- | --- | --- |
| Source layout | Large HTML application script with separate CSS and large data companions | One large HTML file with inline CSS, logic, and data | Use small ordered companion scripts and one stylesheet. Keep plain scripts so the app remains understandable and can open without a module bundler. |
| State shape | One version-labelled state object under one storage key | Many domain-specific storage keys plus separate transient UI state | Use one versioned state envelope for content/preferences/UI plus one separate secret key. |
| State repair | Extensive `defaultState()` and `normalizeState()` repair with legacy key folding | Strong field-level domain sanitizers and several ad hoc migrations | Use explicit sequential migrations, then a comprehensive normalizer and validator. |
| Schema versioning | Stores app version, but migrations are mostly detected by legacy field shape/flags | Export includes build version, but no independent state-model version | Add an integer `schemaVersion` independent of the app release version. |
| Imports | Normalizes first and uses a custom confirmation, but preview detail is limited | Sanitizes many fields, but mutates immediately and reports through native alerts | Parse into an isolated candidate, migrate/normalize/validate, show a summary, save a recovery snapshot, then replace only after custom confirmation. |
| Exports | Complete normalized state; several share formats | Complete user data snapshot and readable JSON | Export the complete state envelope, omit secrets/runtime diagnostics, and include metadata plus a descriptive date/version filename. |
| Dialogs | Native `<dialog>` with broad keyboard handling and good automatic focus containment | Custom overlays with `role="dialog"`; focus restoration/trapping is inconsistent | Use native `<dialog>` through one component manager that records/restores focus and sets an initial focus target. |
| Confirmation | Reusable custom confirmation dialog | Mix of custom overlays and native `confirm`/`alert` | Use the shared custom confirmation and message dialogs for all destructive/import/sync decisions. |
| Themes | Light/dark, configurable palette, presets, text scaling, button presentation | Fixed dark theme with strong CSS-variable palette | Support system/light/dark, validated editable colors, derived shades, presets, and icon/text/both controls. |
| Responsive layout | Persisted split panes and panel visibility; single-column mobile flow | Dense responsive table becomes a mobile card-style layout | Use a generic list/detail workspace with a persisted desktop divider and explicit mobile list/detail navigation. |
| Shortcuts | Extensive global/context shortcuts and optional power-user mode | Smaller modified shortcut system and shortcut badges | Use a registry with collision checks, context predicates, `/`, Escape, major actions, and a configurable modifier-held hint mode. |
| Rich text | Sanitized contenteditable document-like pads | Plain notes and structured forms | Provide an optional sanitized Documents module; never inject imported markup without allow-list sanitization. |
| GitHub sync | Not present | Good baseline SHA/hash detection, periodic/visibility/online checks, and status button | Adapt the state machine, add first-sync and merge dialogs, explicit connection testing, local recovery snapshots, request cancellation/staleness protection, and do not reveal a stored token. |
| Token handling | Not applicable | Token may be stored in local/session storage and is repopulated into the password field | Keep it in a separate per-device key, never export it, never place a stored token back into a visible field, and clearly describe browser-storage limitations. |
| PWA/offline | Manifests and install assets, but no service worker | Manifest and install assets, but no service worker | Add a service worker with an application-shell cache, offline fallback behavior, update messaging, and network-only optional GitHub requests. |
| Identity/config | Name/version and several assets are spread across HTML/JS/manifests | Name/version and assets are similarly repeated | Centralize runtime identity and feature flags in `assets/js/config.js`; keep manifest metadata documented and synchronized. |
| Developer tools | Rich hidden diagnostics and recovery controls | Minimal version/features view | Provide hidden read-only diagnostics, storage usage, active modules/theme/layout, migration fixtures, and safe reset helpers without code execution or secret display. |

## Reusable platform capabilities

- Application identity and feature configuration.
- Responsive app shell and module navigation.
- Local storage, migrations, validation, normalization, and recovery snapshots.
- JSON portability.
- Dialog, popover, menu, listbox, toast, status, loading, empty, error, and confirmation patterns.
- Theme, text-size, button-presentation, icon, status-color, hint, and reduced-motion settings.
- Search, filter, sort, selection, expandable rows, keyboard reordering, and panel layout persistence.
- Shortcut registration and hint display.
- Install guidance, manifest switching, offline status, service-worker updates, and device detection.
- Help, release notes, What's New, roadmap, and hidden developer diagnostics.
- Optional document workspace.
- Optional GitHub synchronization.

## Excluded domain-specific behavior

### From Visit Tracker

- US/state/country/territory data and geographic naming.
- Maps, projections, pan/zoom behavior, map labels, geocoding, coordinates, grids, and overlays.
- Travel levels, visit types, travel notes, trip planning, rings, time zones, external map/flight handoff, and waypoint packs.
- Domain terminology, outdoor branding, release themes, icons, and artwork.

### From Cocktail List

- Cocktail, ingredient, spirit, flavor, glassware, recipe, garnish, rating, inventory, shopping, bar, and archive datasets or rules.
- IBA and third-party source material, image URLs, recommendations, prices, store locations, and business-specific filtering.
- Drink-related branding, icons, release text, and artwork.

## Audit caveats

The sources are mature single-file applications with some purpose-built behavior that is intentionally not generalized. The template implements only abstractions that both sources demonstrate a need for: records, documents, preferences, shell layout, portable state, installability, support content, and optional synchronization. It does not include a general plugin loader, arbitrary schema editor, remote account system, router framework, or runtime package layer.
