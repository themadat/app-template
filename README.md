# App Template

A static, local-first SVG icon library with no required build step, runtime dependency, backend, account, or sign-in. Search the compiled catalog and select any icon to copy its complete inline SVG for another app.

The template starts on the pre-launch `0.0.1` line at version `0.0.1.21` (`major.minor.patch.build`). Routine updates increment the fourth number.

The included product surface is intentionally focused:

- Sticky application header with version, Beta, centered icon search, Notes, and Settings controls.
- Full-width responsive catalog of 2,380 deduplicated SVG icons gathered from the sibling local applications.
- Dense Symbol/Custom cards beside a compact sticky, horizontally resizable category/filter rail, with Cloud/Server, Shapes, 39 nested Badged subcategories, Squared, Circled, Slashed, Sparkled, Time, and Weather categories, semantic search tags, editable names/groups, compact override export, on-demand source details, module shortcuts, 500-icon rendering batches, and one-click SVG copying.
- Single plain-text Notes modal that starts empty and autosaves locally.
- Replaceable Roadmap inside Settings with search, view filters, and sorting.
- Settings, searchable Help, What’s New, release history, shortcut reference, and Roadmap views.
- Optional GitHub Contents API synchronization with explicit conflict choices and manual JSON backup/restore.
- Contextual hints, toast and live announcements, keyboard shortcuts, including V/X What’s New banner actions, shortcut-hint mode, and hidden Developer Mode with minimum-label-length filtering.
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
assets/js/config.js            Identity, versions, themes, help, releases, and roadmap
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
build/icon-library-overrides.json Compiler-consumed permanent name/group overrides
manifest*.webmanifest          Light and dark install metadata
sw.js                          Offline shell and update cache
docs/                          Architecture, components, customization, and test checklists
context/                       Agent wish, plan, start, and cut workflow
```

## Rebuild the SVG icon catalog

The committed `assets/js/icon-library.js` file is sufficient at runtime; rebuilding it is an optional development task. By default, the compiler discovers and scans every non-hidden sibling directory beside `app-template`, including `mctree-mchome`. It captures every complete SVG template literal that closes with `</svg>` and a backtick, fixed SF Symbol markup embedded in source HTML, and standalone `.svg` files. It rejects dynamic, executable, or externally referenced SVG content, skips standalone canvases larger than 256 KB, deduplicates matching artwork, coalesces repeated SF Symbol names, classifies results as SF Symbols or Custom, assigns one or more reusable categories, generates semantic search tags, removes the imported `Svgrepo Com` suffix from display labels, and preserves aliases plus source metadata. For `svg-converter`, it deliberately ignores the generated `output/` and `output-circle:square/` trees because those copies remove transparent-canvas opacity and duplicate the raw symbols. Source-aware rules accept both the earlier and reorganized collection names: `!Badge` or `Badge` maps to Badged, `!Time` or `Time` maps to Time, `server:drive` or `Cloud:Drive` maps to Cloud/Server, `shapes` or `Shapes` maps to Shapes, `sparkles` or `Sparkles:Rays` maps to Sparkled, and `weather` or `Weather` maps to Weather. These assignments remain when symbols merge with existing sources. Badged exports 39 nested choices, including `Badge` for a plain badge with no suffix; Circle, Multiple, and Slash remain searchable but are not nested Badge filters. Name metadata also drives Squared, Circled, Slashed, and Sparkled.

Run it after adding or changing source symbols:

```sh
node build/compile-icon-library.mjs
```

To scan a different group of local repositories, pass their directories explicitly:

```sh
node build/compile-icon-library.mjs /path/to/first-app /path/to/second-app
```

The compiler rewrites only `assets/js/icon-library.js` and reads optional permanent metadata changes from `build/icon-library-overrides.json`. Pass explicit directory arguments when you want a narrower scan than the default sibling-directory discovery. After rebuilding, advance the app build version and test tag/name search, multi-word queries, nested categories, pointer and keyboard rail resizing plus width persistence, SVG rendering, absence of same-name SF Symbol duplicates, Enter-to-results focus, module shortcuts, type/source filters, compact previews, metadata editing, update-file export, details, clipboard copying, and offline loading. The generated file is committed, so apps copied from this template have the complete catalog without Node or a runtime build.

## Rename icons and change groups

Open an icon’s information dialog, select **Edit name & groups**, change its display name or group checkboxes, and save. These overrides autosave locally, participate in JSON backup and GitHub Sync, and survive **Reset preferences**. **Reset icon** restores only that icon’s compiled metadata.

Select **Export overrides** in the editor or Developer Mode—or use the Export overrides action in the save toast—to create `app-template-icon-overrides-YYYY-MM-DD.json`. Attach that file in a future request and ask for it to be hard-coded. The compact file is a plain array containing only `iconId`, `label`, and `categories`; it can also replace `build/icon-library-overrides.json` directly because the compiler accepts both the simple array and the older wrapped format. Each entry uses the stable generated icon id, so a changed display name still applies on later catalog rebuilds. The file contains no SVG content, tokens, or other secrets.

## Update the application icons

Editable sources and generated install assets are in `assets/icons/`. Keep the existing filenames unless you also update every reference in `index.html`, both manifests, `assets/js/config.js`, and `sw.js`.

1. Replace the six editable source files named `App Icon Template Light.svg`, `App Icon Template Light.png`, `App Icon Template Dark.svg`, `App Icon Template Dark.png`, `App Icon Template Gray.svg`, and `App Icon Template Gray.png`.
2. Copy the light and dark SVG sources to `app-icon-light.svg` and `app-icon-dark.svg`. Copy the gray SVG source to `favicon.svg`; keep its Safari-gray background fully opaque and edge to edge, and use favicon-weight blueprint strokes so the construction design remains visible at tab size. Keep important install-icon artwork inside the central 80% for maskable crops.
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

After a completed change, agents provide one copy-paste command that stages only relevant files, creates a commit in the form `Version - Text` (for example, `0.0.1.21 - Refine icon catalog controls`), and pushes the current branch. When every working-tree change belongs to the update, the command uses `git add .`; if unrelated changes exist, it names only the relevant files. Agents do not run it unless explicitly asked.
