# Customization guide

This guide separates safe configuration changes from application-specific extension work. Keep the required state, storage, portability, component, and PWA foundations unless your replacement supplies the same guarantees.

## Rename the application

1. Change `identity.name`, `shortName`, `description`, repository links, support links, version, and build id in `assets/js/config.js`.
2. Mirror the public name, short name, description, version-related shortcut URLs, and theme colors in `manifest.webmanifest` and `manifest-dark.webmanifest`. Static manifests intentionally duplicate this small public subset so browsers can read install metadata before JavaScript runs; `config.js` remains the runtime source of truth.
3. Replace the editable SVG sources in `assets/icons/`, then regenerate the PNG sizes listed by both manifests.
4. Change the storage key prefix only before release. Changing it later requires a legacy-key migration or users will appear to lose their local data.

The visible version, Help release cards, export metadata, state metadata, service-worker cache id, and update notice should all move together for a release.

## Replace demonstration data

Edit `demoRecords()` and `demoDocuments()` in `assets/js/core/state.js`. Keep stable ids, valid ISO timestamps, and the documented normalized shapes. Sample content must not contain secrets because it is shipped to every browser.

For a production application, set `features.demoData` to `false` after deciding what an empty first run should show. Developer Mode has a demonstration-data reset for testing; it is hidden in normal use.

## Themes and branding

- Base semantic variables live near the top of `assets/css/app.css`.
- One-click presets and editable status colors live in `assets/js/config.js`.
- User colors are accepted only when `CSS.supports("color", value)` succeeds; derived shades use guarded color mixing.
- `textScale` changes application-wide type and `readingScale` affects the document editor separately.
- Light/dark icon and manifest selection is handled in `assets/js/core/pwa.js`.

Preserve contrast and non-color status cues when changing palettes. Test light, dark, system, forced-colors, and reduced-motion modes.

## Configure modules

Feature flags are in `assets/js/config.js`:

| Flag | Module |
| --- | --- |
| `records` | Generic record list/detail demonstration |
| `documents` | Rich-text document workspace |
| `cloudSync` | GitHub configuration and status controls |
| `roadmap` | Searchable released/planned/wishlist view |
| `developerTools` | Hidden diagnostics and test tools |
| `installation` | Device-specific install helper |
| `hints` | Contextual hint system |
| `demoData` | First-run sample records and documents |

Flags hide and disable a module without changing the persisted schema. That is the lowest-risk way to customize the template.

## Remove an optional module completely

After disabling its feature flag and testing old-state normalization:

- Documents: remove its navigation, workspace and creation dialog from `index.html`, its render/event code from `assets/js/app.js`, and document-specific styles. Retain document migration fields until old user backups no longer need support.
- GitHub sync: remove `assets/js/core/sync.js`, its script tag, sync settings/status markup, and the file from the service-worker shell list. Keep JSON import/export.
- Roadmap: remove the roadmap markup, navigation, configuration data and render functions.
- Developer tools: remove its tab panel and rendering/actions. Diagnostics are never required at runtime.
- Installation helper: remove `assets/js/core/pwa.js` only if you also remove install/update guidance; keep service-worker registration elsewhere if offline support remains required.
- Hints: remove the hint banner and actions after defaulting the normalized hint state safely.

Always remove stale asset paths from `sw.js`; one missing precache resource can prevent a new shell from installing.

## Add a new record field

1. Add a safe default and normalizer to `normalizeRecord()` in `assets/js/core/state.js`.
2. Add the field to `demoRecords()` if it helps explain the feature.
3. Add semantic controls to the record detail renderer in `assets/js/app.js`.
4. Update search, filter, sorting, export summaries, merge behavior, and help where relevant.
5. If existing persisted state needs conversion, increment `schemaVersion` and add a sequential migration.
6. Test absent, malformed, extreme-length, imported, and conflict-merged values.

## Add a new module

Create a namespaced state object under `modules` and user content under `workspace`. Give it explicit defaults and a strict normalizer. Add one navigation route and an accessible top-level region, register shortcuts only when they do not conflict, include module content in sync/export as appropriate, and add its local shell resources to `sw.js`. Avoid a generic plugin framework until two real modules need the same lifecycle.

## Create a migration

1. Increase `config.schemaVersion` and the current storage key suffix.
2. Keep the old storage key in `storage.legacyKeys`.
3. Add a pure `migrateNtoNPlus1(input)` function in `assets/js/core/state.js`.
4. Register it in the `migrations` map.
5. Preserve recognized user-created content; map renamed, split, combined, and removed values explicitly.
6. Let current normalization sanitize and fill defaults after all migrations run.
7. Add fixtures under `docs/examples/` and run them through the import preview before release.

Never mutate an imported object in place, skip a version, or overwrite an already-published migration. Unknown future schema versions must remain rejected.

## Register a shortcut

Add the visible description to the `SHORTCUTS` array in `assets/js/app.js`, then implement it in the global or appropriate module handler. Ignore printable global shortcuts while the user is editing, unless the shortcut uses a modifier and is safe. Update Help and verify the shortcut at desktop, mobile hardware-keyboard, and assistive-technology focus states.

## Publish a version

1. Update `identity.version` and `identity.buildId`.
2. Add a structured release entry with date, features, improvements, fixes, and known issues.
3. Change `CACHE_NAME` in `sw.js` and review every precached resource.
4. Mirror install metadata in both manifests.
5. Regenerate icons if branding changed.
6. Export/import the new state, import every supported legacy fixture, and complete `docs/TESTING.md`.
7. Deploy all files atomically where possible. The app will show an update notice when the new service worker is ready.
