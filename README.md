# Local Workspace

Local Workspace is a reusable, domain-neutral foundation for a local-first web application. It is a static single-page Progressive Web App built with HTML, CSS, and browser JavaScript: no build step, package manager, runtime dependency, backend, account, or sign-in is required.

The template includes a neutral Records module, an optional Documents workspace, versioned browser-local state, backup and restore, optional GitHub synchronization, responsive list/detail layouts, themes, searchable help and releases, keyboard support, install guidance, and an offline application shell.

The source audit and design decisions were completed before implementation:

- [Source audit](docs/SOURCE-AUDIT.md)
- [Architecture and state strategy](docs/ARCHITECTURE.md)
- [Customization and module removal](docs/CUSTOMIZATION.md)
- [Reusable components](docs/COMPONENTS.md)
- [Verification checklists](docs/TESTING.md)

Agent-assisted development uses [AGENTS.md](AGENTS.md) and the durable [handoff](context/LLM_HANDOFF.md). The supported lifecycle shorthands are `wish`, `plan`, `start`, and `cut`; the wish ledger lives in [context/WISHES.md](context/WISHES.md).

## Run locally

Service workers do not run reliably from a `file:` URL, so use any small static server from this folder. For example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. There is nothing to install or compile.

## Set up a new app repository with GitHub SSH

Use SSH for the Git remote when creating an application from this template. This prevents Git from prompting for a GitHub username and password; GitHub authenticates the computer with an SSH key instead.

1. Check whether this computer already has an Ed25519 key:

   ```sh
   ls -al ~/.ssh
   ```

   If both `id_ed25519` and `id_ed25519.pub` exist, keep them and continue to step 3. The file ending in `.pub` is the public key. Never copy, upload, or share the private `id_ed25519` file.

2. If the key does not exist, create it with the email address used by your GitHub account:

   ```sh
   ssh-keygen -t ed25519 -C "YOUR_GITHUB_EMAIL"
   ```

   Accept the suggested file location. A passphrase is optional but recommended.

3. On macOS, start the SSH agent and save the key in Keychain:

   ```sh
   eval "$(ssh-agent -s)"
   ssh-add --apple-use-keychain ~/.ssh/id_ed25519
   ```

   On Linux, use `ssh-add ~/.ssh/id_ed25519` after starting the SSH agent instead.

4. Copy the public key on macOS:

   ```sh
   pbcopy < ~/.ssh/id_ed25519.pub
   ```

   On other systems, display it with `cat ~/.ssh/id_ed25519.pub` and copy the complete line. In GitHub, open **Settings → SSH and GPG keys → New SSH key**, choose **Authentication Key**, paste the public key, and save it.

5. Test the connection:

   ```sh
   ssh -T git@github.com
   ```

   The first connection may ask you to confirm GitHub's host fingerprint. A successful test says that you authenticated and that GitHub does not provide shell access.

6. Create the new repository from this template on GitHub, then use its SSH URL. For a fresh clone:

   ```sh
   git clone git@github.com:OWNER/REPOSITORY.git
   ```

   If the app is already cloned and its remote uses `https://`, switch it to SSH and verify the result:

   ```sh
   git remote set-url origin git@github.com:OWNER/REPOSITORY.git
   git remote -v
   ```

7. Push the initial branch and remember its upstream:

   ```sh
   git push -u origin main
   ```

After that, ordinary `git pull` and `git push` commands use SSH. If Git still requests a GitHub username and password, run `git remote -v` and confirm that the URL starts with `git@github.com:` rather than `https://`. If it reports `Permission denied (publickey)`, confirm that the public key was added to the correct GitHub account and loaded into the SSH agent. A prompt for the SSH key's passphrase is local and is not a GitHub password.

GitHub's official guides cover [generating and loading an SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent?apiVersion=2022-11-28&platform=mac), [adding the public key to an account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account), and [testing the connection](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection).

This SSH setup is for maintaining the application's source repository. The optional in-app GitHub synchronization module runs in a browser and therefore continues to use a narrowly scoped access token; browsers cannot use a computer's SSH key for that feature.

## Host as a static site

Upload the repository contents without changing their relative paths. Any static host that serves HTTPS and JSON/manifest files with ordinary MIME types will work. The service worker is scoped to the folder containing `sw.js`, so keep it at the application root.

## Update the application icons

The editable icon sources and generated install assets are in `assets/icons/`. Keep the existing filenames unless you also update every reference in `index.html`, both manifest files, `assets/js/config.js`, and `sw.js`.

1. Replace `app-icon-light.svg` and `app-icon-dark.svg` with square SVG artwork. Keep important artwork inside the central 80% so the maskable versions remain legible when a device crops them into a circle or rounded square.
2. Update `favicon.svg`. It can contain light/dark CSS using `prefers-color-scheme`, as the included favicon does.
3. Export the light application SVG to:
   - `icon-192.png` at 192 × 192
   - `icon-512.png` at 512 × 512
   - `icon-512-maskable.png` at 512 × 512
   - `apple-touch-icon.png` at 180 × 180
4. Export the dark application SVG to:
   - `icon-192-dark.png` at 192 × 192
   - `icon-512-dark.png` at 512 × 512
   - `icon-512-maskable-dark.png` at 512 × 512
   - `apple-touch-icon-dark.png` at 180 × 180
5. Replace `splash-light.svg` and `splash-dark.svg`, then export them as `splash-light.png` and `splash-dark.png` at 1170 × 1170.

You can export with a vector editor such as Inkscape, Figma, Illustrator, or Affinity Designer. If Inkscape is installed, these are example commands:

```sh
inkscape assets/icons/app-icon-light.svg --export-filename=assets/icons/icon-192.png --export-width=192 --export-height=192
inkscape assets/icons/app-icon-light.svg --export-filename=assets/icons/icon-512.png --export-width=512 --export-height=512
inkscape assets/icons/app-icon-light.svg --export-filename=assets/icons/icon-512-maskable.png --export-width=512 --export-height=512
inkscape assets/icons/app-icon-light.svg --export-filename=assets/icons/apple-touch-icon.png --export-width=180 --export-height=180

inkscape assets/icons/app-icon-dark.svg --export-filename=assets/icons/icon-192-dark.png --export-width=192 --export-height=192
inkscape assets/icons/app-icon-dark.svg --export-filename=assets/icons/icon-512-dark.png --export-width=512 --export-height=512
inkscape assets/icons/app-icon-dark.svg --export-filename=assets/icons/icon-512-maskable-dark.png --export-width=512 --export-height=512
inkscape assets/icons/app-icon-dark.svg --export-filename=assets/icons/apple-touch-icon-dark.png --export-width=180 --export-height=180

inkscape assets/icons/splash-light.svg --export-filename=assets/icons/splash-light.png --export-width=1170 --export-height=1170
inkscape assets/icons/splash-dark.svg --export-filename=assets/icons/splash-dark.png --export-width=1170 --export-height=1170
```

After replacing icons:

1. Increase the build identifier in `assets/js/config.js` and change `CACHE_NAME` in `sw.js` so installed copies receive the new assets.
2. Confirm that every icon path in `manifest.webmanifest`, `manifest-dark.webmanifest`, `index.html`, and `sw.js` exists.
3. Clear the old service worker/cache during local testing or test in a fresh browser profile.
4. Install the app once in light mode and once in dark mode to inspect the launcher icon, maskable crop, favicon, theme color, and splash artwork.

## Project map

| Area | Responsibility | Classification |
| --- | --- | --- |
| `index.html`, `assets/css/app.css`, `assets/js/app.js` | Application shell, responsive workspaces, event wiring | Required foundation |
| `assets/js/core/state.js`, `storage.js`, `utils.js` | State defaults, validation, migrations, local persistence, defensive utilities | Required foundation |
| `assets/js/core/components.js` | Dialogs, menus, popovers, toasts, status and focus behavior | Shared reusable components |
| `assets/js/core/portability.js` | Safe JSON backup preview, confirmation, import and export | Required foundation |
| `assets/js/core/pwa.js`, manifests, `sw.js`, icons | Installation, offline shell, updates and device guidance | Required foundation |
| Records | Generic structured-entity example and primary shell | Demonstration and extension point |
| Documents, Roadmap, GitHub sync, Developer Mode, hints | Features that can be disabled or removed | Optional modules |
| `assets/js/config.js` | Identity, versions, features, status definitions, help, releases and sample roadmap | Central configuration |

## State and persistence

`localStorage` is the primary state store. Startup loading unwraps known legacy backup shapes, applies sequential migrations, normalizes every supported value, sanitizes rich text and URLs, and validates required invariants. Invalid state never replaces the active copy. Mutations save automatically after a short delay; quota and storage failures are surfaced in the interface.

The current schema is version 3. The readable shape is documented in [ARCHITECTURE.md](docs/ARCHITECTURE.md). Deletion tombstones let the optional sync merge distinguish deletion from an older copy. A separate recovery snapshot is created before imports, cloud downloads, and merges.

The GitHub token is a per-device secret stored under its own browser key. It is not part of application state, JSON exports, diagnostics, or subsequent token displays.

## Backup format

Exports use this envelope:

```json
{
  "exportFormat": "local-first-workspace-backup",
  "exportedAt": "2026-08-01T12:00:00.000Z",
  "application": { "name": "Local Workspace", "version": "1.0.0" },
  "schemaVersion": 3,
  "state": {}
}
```

Imports accept this format plus the documented older wrappers and bare legacy states. Parsing, migration, sanitization, validation, and preview happen before the replacement confirmation. Existing state remains intact if any step fails.

## Main customization points

- Rename and version the product in `assets/js/config.js`; mirror public install metadata in both manifest files.
- Replace neutral demonstration records and documents in `assets/js/core/state.js`.
- Edit CSS variables in `assets/css/app.css`, then adjust presets and editable color defaults in `assets/js/config.js`.
- Register shortcuts in the `SHORTCUTS` list and keyboard handler in `assets/js/app.js`.
- Add sequential migrations in `assets/js/core/state.js`; never rewrite old migration behavior after release.
- Add release notes, roadmap entries, and help topics as structured arrays in `assets/js/config.js`.

Detailed recipes, PWA asset guidance, adding a record type, removing optional modules, and publishing a version are in [CUSTOMIZATION.md](docs/CUSTOMIZATION.md).

## Cloud synchronization

GitHub sync is off until the user configures an owner, repository, branch, JSON path, and access token, then explicitly tests the connection. The primary Sync action classifies local-only changes, remote-only changes, equality, first sync, divergence, missing remote files, offline state, authentication problems, and network failures. Divergent copies are never silently overwritten; upload, download, merge, and cancel choices are shown as appropriate.

For a private repository, create a fine-grained GitHub token limited to that repository with Contents read/write access. Browser storage cannot make such a token cryptographically secure, so use the narrowest permissions and forget it on shared devices. Manual JSON backup always remains available.

## Accessibility conventions

Use native elements first, keep every primary action keyboard-operable, give icon controls names, preserve visible focus, and announce state with text/icon as well as color. New dialogs and popovers must use the shared focus lifecycle. Drag, long-press, hover, and context-menu conveniences need visible or keyboard equivalents. See [COMPONENTS.md](docs/COMPONENTS.md) and [TESTING.md](docs/TESTING.md).

## Browser support

The template targets current evergreen desktop and mobile browsers. Unsupported optional APIs degrade to explanatory unavailable states; the local records, documents, settings, and JSON backup features do not depend on network access.
