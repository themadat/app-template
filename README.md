# App Template

A deliberately minimal static HTML application shell. It has no build step, package manager, runtime dependency, backend, account, or domain-specific feature.

The shipped interface contains only:

- A responsive, sticky top bar.
- Application icon, name, version, and automatic Beta indicator.
- Two basic Apple-style buttons using inline SF Symbol SVGs.
- Light and dark themes.
- Developer Mode through a press-and-hold on the application icon.
- An intentionally empty `<main>` element for the new application.
- A small offline PWA shell.

## Run locally

From the repository folder:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Nothing needs to be installed or compiled.

## Start a new application

1. Edit the application identity in `assets/js/config.js`.
2. Mirror the public name, description, and theme colors in `manifest.webmanifest` and `manifest-dark.webmanifest`.
3. Replace the empty `<main id="mainContent">` in `index.html` with the new application.
4. Rename or remove the two example top-bar buttons. Their `data-app-action` attributes are extension hooks; the template does not attach behavior to them.
5. Add application styles after the shell styles in `assets/css/app.css`, or move them into separate stylesheets.
6. Increase `identity.buildId` and update `CACHE_NAME` in `sw.js` whenever shipped browser assets change.

The application icon remains the only built-in control: click or tap it to switch themes, and press and hold it to toggle Developer Mode. Developer Mode adds `DEV` to the single version pill. A `BETA` pill appears for a `/beta/` path, `?beta=1`, or `?beta=true`.

## Project structure

```text
index.html                 Top bar and empty application area
assets/css/app.css         Shell variables, layout, buttons, and responsive styles
assets/js/config.js        Application identity and shell settings
assets/js/icons.js         Inline SVG symbol catalog
assets/js/app.js           Theme, Developer Mode, identity, and PWA registration
assets/icons/              Editable and generated application assets
manifest*.webmanifest      Light and dark install metadata
sw.js                      Offline shell cache
context/                   Agent wish, plan, start, and cut workflow
```

## Add or change top-bar buttons

Copy one of the existing buttons in `index.html` and give it a neutral extension hook:

```html
<button class="top-action" type="button" data-app-action="example">
  <span class="action-icon" aria-hidden="true" data-symbol="more"></span>
  <span class="action-label">Example</span>
</button>
```

Register SF Symbol SVG markup in `assets/js/icons.js`; use SVG symbols instead of emoji or icon-font glyphs whenever possible. Give the button an accessible name whenever its visible text is not sufficient.

## Update the application icons

Editable sources and generated install assets are in `assets/icons/`. Keep the existing filenames unless you also update their references in `index.html`, both manifests, `assets/js/config.js`, and `sw.js`.

1. Replace `app-icon-light.svg` and `app-icon-dark.svg` with square SVG artwork. Keep important artwork inside the central 80% for maskable crops.
2. Update `favicon.svg`.
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
6. Increase the build identifier and service-worker cache name so installed copies receive the new assets.

Example Inkscape export:

```sh
inkscape assets/icons/app-icon-light.svg --export-filename=assets/icons/icon-512.png --export-width=512 --export-height=512
inkscape assets/icons/app-icon-dark.svg --export-filename=assets/icons/icon-512-dark.png --export-width=512 --export-height=512
```

After replacement, verify the favicon, launcher icon, maskable crop, and splash artwork in both appearances.

## Set up GitHub SSH

Use an SSH remote so Git does not ask for a GitHub username and password.

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

4. Copy the public key:

   ```sh
   pbcopy < ~/.ssh/id_ed25519.pub
   ```

   Add it in GitHub under **Settings → SSH and GPG keys → New SSH key**. Never upload or share the private file without `.pub`.

5. Test authentication:

   ```sh
   ssh -T git@github.com
   ```

6. Use the repository’s SSH URL:

   ```sh
   git remote set-url origin git@github.com:OWNER/REPOSITORY.git
   git remote -v
   git push -u origin main
   ```

If Git reports `Permission denied (publickey)`, confirm the key is loaded and attached to the correct GitHub account. A prompt for the SSH key’s passphrase is local; it is not a GitHub password.

## Host as a static site

Upload the repository contents without changing their relative paths. Use HTTPS in production so the service worker and installation features are available. Keep `sw.js` at the application root because its location defines the offline scope.

## Agent workflow

`AGENTS.md` and `context/LLM_HANDOFF.md` define the repository workflow. The supported shorthands are:

- `wish`: record an idea only.
- `plan`: investigate and document it only.
- `start`: implement an approved plan.
- `cut`: finalize a release.
