# App Template

A static, local-first SVG icon library with no required build step, runtime dependency, backend, account, or sign-in. Search the compiled catalog and select any icon to copy its complete inline SVG for another app.

The template starts on the pre-launch `0.0.1` line at version `0.0.1.43` (`major.minor.patch.build`). Routine updates increment the fourth number.

The included product surface is intentionally focused:

- Sticky application header with version, Beta, centered icon search, Notes, and Settings controls.
- Full-width responsive catalog of 4,540 deduplicated SVG icons gathered from the configured local sources.
- Compact 132–140px Symbol/Custom cards sized for uninterrupted 20-character names beside a sticky, horizontally resizable filter rail with a persistent Light/Medium/Bold SF Symbol weight selector and categories split into **What it is** and **How it looks**. Semantic destinations include Recreation with Games and Sport children, Geography with Countries, Regions, Mapping, and Places children, Entertainment & Media, Indices, Celebrations & Awards, Clothing & Personal Items, Education & Science, Home & Appliances, Apps & Branding, Devices & Connectivity, nested Text Formatting, and Nature with Animals & Plants and Weather children. The appearance set includes Arrows with Chevron, Triangle, Chevron Arrow, and Triangle Arrow children, plus Badged, Building, Circled, Squared, Slashed, Shapes, and Rays & Sparkles. The catalog also provides semantic search tags, persistent collapsible branches, editable names/types/groups/filter sources, right-click group removal with Undo, compact override export, source details, module shortcuts, 500-icon batches, and one-click SVG copying.
- Single plain-text Notes modal that starts empty and autosaves locally.
- Replaceable Roadmap inside Settings with search, view filters, and sorting.
- Settings, searchable Help, What’s New, release history, shortcut reference, and Roadmap views.
- Optional GitHub Contents API synchronization with explicit conflict choices and manual JSON backup/restore.
- Contextual hints, toast and live announcements, keyboard shortcuts, including V/X What’s New banner actions and a visible 30-second auto-dismiss countdown, shortcut-hint mode, and hidden Developer Mode with minimum-label-length filtering.
- Installable offline PWA shell with light/dark assets and a bottom new-version toast with R/X Force Refresh and Close shortcuts.

## Run locally

From the repository folder:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Use a local server instead of opening `index.html` directly so the service worker and PWA behavior can run.

## Start a new application

1. Update identity, version, release notes, help, roadmap data, repository links, and feature flags in `assets/js/config.js`.
2. Mirror the public name and description in `manifest.webmanifest`, `manifest-dark.webmanifest`, and the fallback metadata in `index.html`.
3. Leave the default Notes document blank or add intentional starter text in `demoDocuments()` inside `assets/js/core/state.js`.
4. Keep the committed icon catalog when the new app should retain the full searchable SVG collection, even if you replace the main page. Remove its UI only when the new app does not need icon browsing; the shell, Notes, Settings, and synchronization modules remain independent.
5. Use `major.minor.patch.build` versions. Increment the fourth number for every completed application update; when intentionally changing major, minor, or patch, reset the build number to `1` unless another value is required. Keep `identity.buildId` equal to the full version, add the matching dated release entry, update the build query values in `index.html`, and update `CACHE_NAME` plus `ASSET_VERSION` in `sw.js` together.

## Project structure

```text
index.html                     Application shell, icon-library page, Notes, and dialogs
assets/css/app.css             Theme, layout, components, and responsive behavior
assets/js/config.js            Identity, versions, theme defaults, help, releases, and roadmap
assets/js/icons.js             Inline SF Symbol SVG catalog
assets/js/icon-library.js      Generated, deduplicated icon data used by the main page
assets/js/app.js               Application rendering, actions, and keyboard wiring
assets/js/core/state.js        Defaults, normalization, migrations, validation, and merge
assets/js/core/storage.js      Local persistence, secret storage, and recovery copies
assets/js/core/components.js   Dialogs, popovers, menus, toasts, and loading UI
assets/js/core/portability.js  JSON export, validation preview, and import
assets/js/core/sync.js         Optional GitHub synchronization state machine
assets/js/core/pwa.js          PWA assets, update notices, and device detection
assets/icons/                  Editable and generated application assets
build/compile-icon-library.mjs Dependency-free development-time icon scanner/compiler
build/icon-library-overrides.json Compiler-consumed permanent name/group/source overrides
manifest*.webmanifest          Light and dark install metadata
sw.js                          Offline shell and update cache
docs/                          Architecture, components, customization, and test checklists
context/                       Agent wish, plan, start, and cut workflow
```

## Rebuild the SVG icon catalog

The committed `assets/js/icon-library.js` file is sufficient at runtime; rebuilding it is an optional development task. By default, the compiler discovers and scans every non-hidden sibling directory beside `app-template`, including `mctree-mchome`. It deliberately excludes the broad `!backups:data` parent, while adding only its configured `icons/app-input/Objects & Tools`, `norway:sweden`, and `indicies` children as focused sources. It also retains the existing compiled catalog so icons do not disappear merely because an earlier source folder moved out of the active scan; use `excludedIconIds` for intentional removal. It captures every complete SVG template literal that closes with `</svg>` and a backtick, fixed SF Symbol markup embedded in source HTML, and standalone `.svg` files. It rejects dynamic, executable, or externally referenced SVG content, skips generated `dist/` directories and standalone canvases larger than 256 KB, deduplicates matching artwork, coalesces repeated SF Symbol names, classifies results as SF Symbols or Custom, assigns one or more reusable categories, generates semantic search tags, removes the imported `Svgrepo Com` suffix from display labels, and preserves aliases plus source metadata. Source-aware rules place country outlines and country-specific geographic icons in Geography → Countries; continents, states, provinces, territories, other administrative outlines, and world/globe views in Geography → Regions; map pins, routes, navigation symbols, compass/direction symbols, map layers, and controls in Geography → Mapping; and buildings, landmarks, monuments, points of interest, parks, airports, transit stations, and other destinations in Geography → Places. Text Formatting inputs remain under Editing, Connectivity inputs in Devices & Connectivity, game artwork in Recreation → Games, sports in Recreation → Sport, and Norway & Sweden source records in Commerce. Requested sources retain repository provenance and normally compile under Objects & Tools or Indices; an exact permanent override may intentionally remove a source category while preserving that provenance. Every retained icon still maps into at least one semantic category. People is restricted to symbols whose metadata describes a person or body part. Arrow metadata drives the Chevron, Triangle, Chevron Arrow, and Triangle Arrow appearance branches; Building-shaped artwork receives the Building appearance filter. Existing Actions, Locations, Maps, Maps & Travel, Games, Sports & Recreation, and Norway & Sweden stored values migrate into the current taxonomy. The other curated SVG Converter folders retain their dedicated categories after deduplication unless an exact permanent override changes membership. Badged exports 39 primary choices, including `Badge` for a plain badge with no suffix; its Shapes branch contains Shield and Triangle, while Exclamation Mark contains Circle and Triangle. Circle, Multiple, and Slash remain searchable but are not direct Badge filters. Name metadata also drives Building, Squared, Circled, and Slashed. Other stays visible directly beneath All even when its count is zero.

The aggregate `svg-converter/app-input/!All/` roll-up is also skipped because its copies would add redundant aliases and provenance without adding unique artwork.

For taxonomy changes, use roughly 20 icons or 1% of the catalog as a top-level-category starting point. Smaller categories are justified when they represent a distinct, high-intent lookup such as Food & Drink, or when they are nested under a broader parent; avoid creating a top-level filter for a handful of incidental matches.

Run it after adding or changing source symbols:

```sh
node build/compile-icon-library.mjs
```

To scan a different group of local repositories, pass their directories explicitly:

```sh
node build/compile-icon-library.mjs /path/to/first-app /path/to/second-app
```

The compiler rewrites only `assets/js/icon-library.js` and reads optional permanent metadata changes from `build/icon-library-overrides.json`. Pass explicit directory arguments when you want a narrower scan than the default sibling-directory discovery. After rebuilding, advance the app build version and test tag/name search, multi-word queries, nested categories, pointer and keyboard rail resizing plus width persistence, SVG rendering, absence of same-name SF Symbol duplicates, Enter-to-results focus, module shortcuts, type/source filters, compact previews, metadata editing, update-file export, details, clipboard copying, and offline loading. The generated file is committed, so apps copied from this template have the complete catalog without Node or a runtime build.

## Edit icon metadata

Open an icon’s information button to edit its **Name** and **Type** directly while viewing provenance. Select the displayed icon name to open the complete metadata editor for Name, Type, groups, and the source used by repository filtering; the original repository, file, path, and source-symbol list remains unchanged in Icon details. When a category is selected, right-click an icon to remove it from that group; the confirmation toast provides Undo. Category branches can be collapsed independently and remember that state. These overrides autosave locally, participate in JSON backup and GitHub Sync, and survive **Reset preferences**. An edit that would leave an icon without a group is placed in Interface. **Reset icon** restores only that icon’s compiled metadata.

Select **Export overrides** in the editor or Developer Mode—or use the Export overrides action in the save toast—to create `app-template-icon-overrides-YYYY-MM-DD.json`. Attach that file in a future request and ask for it to be hard-coded. The compact file is a plain array containing `iconId`, `label`, `categories`, plus `kind` and `source` only when those values differ from the compiled metadata; it can also replace `build/icon-library-overrides.json` directly because the compiler accepts both the simple array and wrapped format. The wrapped format may include `excludedIconIds` when a bad extraction must remain absent from later rebuilds, and permanent entries may use `exactCategories: true` when exported memberships must replace inferred source or child categories exactly. Each entry uses the stable generated icon id, so changed metadata still applies on later catalog rebuilds. After a catalog update bakes an entry in, the app removes that matching entry from its local pending overrides automatically, so the next export contains only later edits. The file contains no SVG content, tokens, or other secrets.

## Update the application icons

Editable sources and generated install assets are in `assets/icons/`. Keep the existing filenames unless you also update every reference in `index.html`, both manifests, `assets/js/config.js`, and `sw.js`.

1. Replace the six editable source files named `App Icon Template Light.svg`, `App Icon Template Light.png`, `App Icon Template Dark.svg`, `App Icon Template Dark.png`, `App Icon Template Gray.svg`, and `App Icon Template Gray.png`.
2. Copy the light and dark SVG sources to `app-icon-light.svg` and `app-icon-dark.svg`; keep their X and concentric circles prominent while rendering the construction grid as a quieter secondary detail at 42px. Copy the gray SVG source to `favicon.svg`; keep its Safari-gray background fully opaque and edge to edge, use a saturated neon-blue stroke, and retain the grid, X, and concentric circles without square outlines. Keep important install-icon artwork inside the central 80% for maskable crops.
3. Export the light icon to:

   - `icon-192.png` at 192 × 192
   - `icon-512.png` at 512 × 512
   - `icon-512-maskable.png` at 512 × 512
   - `apple-touch-icon.png` at 180 × 180

4. Export the dark icon to:

   - `icon-192-dark.png` at 192 × 192
   - `icon-512-dark.png` at 512 × 512
   - `icon-512-maskable-dark.png` at 512 × 512
   - `apple-touch-icon-dark.png` at 180 × 180

5. Replace `splash-light.svg` and `splash-dark.svg`, then export `splash-light.png` and `splash-dark.png` at 1170 × 1170.
6. Advance the fourth component of the app version, use the same full version as the build identifier, add the matching release entry, update the build queries in `index.html`, and update both `CACHE_NAME` and `ASSET_VERSION` in `sw.js` so installed copies receive the assets.

Example Inkscape exports:

```sh
inkscape assets/icons/app-icon-light.svg --export-filename=assets/icons/icon-512.png --export-width=512 --export-height=512
inkscape assets/icons/app-icon-dark.svg --export-filename=assets/icons/icon-512-dark.png --export-width=512 --export-height=512
```

Verify the favicon, launcher icon, maskable crop, and splash artwork in both appearances.

## Set up GitHub SSH for repository work

This controls Git clone, pull, and push from your computer. It is separate from the optional in-app sync module, which uses the GitHub Contents API and a fine-grained token because a browser cannot use your SSH key.

1. Check for an existing key:

   ```sh
   ls -al ~/.ssh
   ```

2. If `id_ed25519` and `id_ed25519.pub` do not exist, create them:

   ```sh
   ssh-keygen -t ed25519 -C "YOUR_GITHUB_EMAIL"
   ```

3. On macOS, load the key and save it in Keychain:

   ```sh
   eval "$(ssh-agent -s)"
   ssh-add --apple-use-keychain ~/.ssh/id_ed25519
   ```

4. Copy the public key and add it in GitHub under **Settings → SSH and GPG keys → New SSH key**:

   ```sh
   pbcopy < ~/.ssh/id_ed25519.pub
   ```

   Never upload or share the private file without `.pub`.

5. Test authentication and set the repository’s SSH remote:

   ```sh
   ssh -T git@github.com
   git remote set-url origin git@github.com:OWNER/REPOSITORY.git
   git remote -v
   git push -u origin main
   ```

If Git reports `Permission denied (publickey)`, confirm the key is loaded and attached to the correct GitHub account. A prompt for the SSH key’s passphrase is local; it is not a GitHub password.

## Configure optional in-app GitHub Sync

Open **Settings → Storage & GitHub** and provide:

- Repository owner and name.
- Branch and JSON file path.
- A fine-grained personal access token limited to the selected repository with **Contents: Read and write** permission.

The token stays in browser storage on that device, is never included in exports or diagnostics, and is not displayed again. The Sync button checks local and remote state before choosing upload, download, merge, or conflict handling. JSON export/import remains the fallback.

## Host as a static site

Upload the repository contents without changing their relative paths. Use HTTPS in production so service-worker and install features are available. Keep `sw.js` at the application root because its location defines the offline scope.

For GitHub Pages, use **Settings → Pages → Deploy from a branch**, select `main` and `/ (root)`, then save. GitHub’s built-in **pages build and deployment** workflow will publish each push. Do not add a second push-triggered Pages workflow unless you first disable branch deployment; enabling both paths creates two deployments for the same commit.

The service worker checks the network first for same-origin application files, and `index.html` gives build-stamped URLs to the application assets. An ordinary browser refresh therefore retrieves a consistent current set of HTML, CSS, and JavaScript when online, then falls back to the cached shell when offline. When a waiting worker is ready, a persistent **New version available** toast appears at the bottom. Its clockwise-arrow action force-activates that worker and reloads with a cache-busting URL, including in the installed PWA. While the toast is visible, <kbd>R</kbd> runs Force Refresh and <kbd>X</kbd> closes the notice; both also work with Shift–Control–Option.

## Agent workflow

`AGENTS.md` and `context/LLM_HANDOFF.md` define the repository workflow:

- `wish`: record an idea only.
- `plan`: investigate and document it only.
- `start`: implement an approved plan.
- `cut`: finalize a release.

After a completed change, agents provide one copy-paste command that stages only relevant files, creates a commit in the form `Version - Text` (for example, `0.0.1.43 - Add SF Symbol weights`), and pushes the current branch. When every working-tree change belongs to the update, the command uses `git add .`; if unrelated changes exist, it names only the relevant files. Agents do not run it unless explicitly asked.
