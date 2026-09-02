# Customization

## Rename the application

Change `identity` in `assets/js/config.js`, then mirror user-visible fallback metadata in `index.html`, `manifest.webmanifest`, and `manifest-dark.webmanifest`. Update repository and support URLs before publishing.

## Replace demonstration data

- Edit `demoDocuments()` in `assets/js/core/state.js` for the first-run note.
- Edit `roadmap` and `releases` in `assets/js/config.js`.
- Keep stable ids and valid ISO dates.
- Do not ship secrets, personal data, or domain-specific source-application content.

## Update the icon catalog

Edit SVG template literals or standalone SVG files in their source apps, then run `node build/compile-icon-library.mjs` from this repository. The default scan discovers every non-hidden sibling directory beside `app-template`, including `mctree-mchome`; pass explicit directories as command arguments to use a narrower group. Commit the regenerated `assets/js/icon-library.js`; it contains the SVGs, multi-category assignments, semantic tags, aliases, and source metadata, so every app copied from the template retains the complete catalog without Node or a runtime build. Commit `build/icon-library-overrides.json` when exported name/group/filter-source changes should remain hard-coded across later rebuilds.

The compiler accepts every complete SVG template literal ending with `</svg>` and a closing backtick, fixed SF Symbol markup embedded in source HTML, and standalone `.svg` files up to 256 KB. It removes XML wrappers, rejects scripts, event handlers, foreign objects, JavaScript or external URLs, and dynamic template fragments, then deduplicates normalized artwork, coalesces same-name SF Symbols while retaining every source reference, labels each result as SF Symbol or Custom, removes the imported `Svgrepo Com` label suffix, assigns every icon to one or more quick-select categories, and expands common concepts such as delete/trash or settings/gear into searchable tags. SVG Converter’s generated `output/` and `output-circle:square/` folders are skipped because their converted copies can lose transparent-rectangle opacity; keep the raw conversion folders instead. Source-aware rules recognize both earlier and reorganized input names: `!Badge`/`Badge` maps to Badged and an available suffix-specific subtype, `!Time`/`Time` maps to Time, `server:drive`/`Cloud:Drive` maps to Cloud & Drive, `shapes`/`Shapes` maps to Shapes, `sparkles`/`Sparkles:Rays` and `!Rays`/`Rays` map to Rays & Sparkles, `weather`/`Weather` maps to Weather, `!Health`/`Health` maps to Health, and `!Nature`/`Nature` maps to Nature, including symbols merged with another source. Badge subtype detection reads only content after the final badge token and maps an empty suffix to plain Badge; Shapes contains Shield and Triangle, and Exclamation Mark contains Circle and Triangle. Circle, Multiple, and Slash are intentionally omitted as direct Badge children, while square, circle, and slash metadata still assigns the top-level Squared, Circled, and Slashed groups. Retained SF Symbol paint is normalized to `currentColor`. Edit `ICON_CATEGORIES`, source-aware rules, and `TAG_GROUPS` in the compiler when a new app needs additional neutral taxonomy.

The in-app editor writes sanitized name/group/filter-source overrides into local state. The source choice changes repository filtering without discarding the compiled original-source list. **Export overrides** downloads a plain JSON array containing `iconId`, `label`, `categories`, and an optional `source`. Attach it to a future request, merge its entries into the committed override file, or replace `build/icon-library-overrides.json` with it and rebuild the catalog. The compiler accepts both this simple array and the older wrapped `app-template-icon-library-overrides` format. Unknown icon IDs are reported as missing, invalid file formats fail the compiler, and unrecognized category or source IDs are discarded. Every recognized child group gains its required ancestors automatically.

## Appearance

Base theme variables live at the top of `assets/css/app.css`, while the editable fallback colors live in `config.themeDefaults`. User colors and the single application-wide text scale are normalized in `state.js` and applied in `app.js`. Settings intentionally has no preset chooser or manual motion override; reduced motion follows the device preference.

## Keyboard shortcuts

Add a visible entry to `SHORTCUTS` in `assets/js/app.js`, add `data-shortcut` to the related control when a hint is useful, and handle the key in `handleGlobalKeydown()`. Ignore shortcuts in editable controls and always retain a visible, keyboard-operable action.

## Add a record type or module

1. Define a narrow default and normalizer in `assets/js/core/state.js`.
2. Add migration handling before changing stored shapes.
3. Add a semantic module surface and navigation control in `index.html`.
4. Add render and event functions in `assets/js/app.js`.
5. Add responsive and reduced-motion styles.
6. Include the collection in export/sync payloads only if users manage it.
7. Document and test empty, loading, disabled, offline, and error states that apply.

Avoid generic abstractions until a second real module needs the same behavior.

## Remove optional modules

- Roadmap: remove its Settings tab/panel and event/render code, then set `features.roadmap` to `false`. Release history can remain without planned/wishlist views.
- GitHub Sync: remove `core/sync.js`, its script tag, settings/status markup, related event wiring, and its `sw.js` cache entry. Keep JSON backup/restore.
- Developer tools: set `features.developerTools` to `false` and remove the Developer panel if it will never be used.
- Contextual hints: set `features.hints` to `false` and remove hint/settings markup if desired.
- Notes: remove its top-bar control, modal, and event code. Retain legacy document migration fields until old backups no longer need support.
- Icon library: remove `icon-library.js`, its script and service-worker entries, the main-page catalog markup/styles, and the related render/copy/filter code in `app.js`. Replace the `main` landmark with the new application interface.

## Publish a version

Versions use `major.minor.patch.build`. Increment the fourth component for every completed application update. If a major, minor, or patch value changes, reset the build component to `1` unless another value is required. Add the newest release card first, show its date beside its version in the release log, keep `buildId` equal to the full version, update manifest text if public metadata changed, update the build queries in `index.html`, and set the matching `CACHE_NAME` and `ASSET_VERSION` in `sw.js`. Use the commit subject `Version - Text`, then run the complete checklist in `docs/TESTING.md`.

## Icons and PWA assets

Follow the size and export instructions in the README. Keep the service worker asset list synchronized with renamed files and verify light, dark, maskable, touch, favicon, and splash variants.
