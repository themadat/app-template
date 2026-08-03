# Verification checklists

## Automated baseline

- [ ] Every JavaScript file and `sw.js` passes `node --check`.
- [ ] Both manifests parse as JSON.
- [ ] `git diff --check` is clean.
- [ ] Every local `src`, `href`, manifest icon, and service-worker shell path exists.
- [ ] No console errors appear during startup or the tested workflows.

## Desktop

- [ ] Header, version/Beta pills, global search, toolbar, status, and module navigation fit without horizontal overflow.
- [ ] `/` focuses global search; results route to notes, Help, releases, and Roadmap.
- [ ] Notes opens as one modal, focuses its textarea, autosaves plain text, appears in global search, and restores focus when closed.
- [ ] The current four-part version matches the build id, asset queries, and service-worker cache; each release-log date appears beside its version number.
- [ ] Roadmap search, Released/Planned/Wishlist filters, and every sort option work.
- [ ] Settings, Help, What’s New, Shortcuts, Roadmap, and Developer tabs render and manage focus.
- [ ] Toasts and polite/assertive announcements communicate completion without relying on color.

## Tablet and mobile

- [ ] At representative 768px and 390px widths, document and body scroll widths do not exceed the viewport.
- [ ] Top controls remain touch-sized and form fields do not trigger unwanted input zoom.
- [ ] Notes fills the mobile viewport without horizontal overflow or nested page scrolling.
- [ ] Support fills the screen and uses one scrolling content surface.
- [ ] Floating Sync stays inside safe areas and does not obscure required controls.

## Keyboard and accessibility

- [ ] Visible focus, logical focus order, labels, roles, and ARIA state are correct.
- [ ] Escape closes menus, popovers, and dialogs and returns focus to the trigger.
- [ ] `?`, `2`, `N`, `V`, `S`, `E`, and the Developer Mode shortcut work outside editable fields.
- [ ] Holding the configured modifier reveals shortcut hints and releasing it hides them.
- [ ] Tabs and menu items support arrow-key movement.
- [ ] Reduced-motion mode removes nonessential transitions and animations.
- [ ] Light and dark themes meet contrast needs; status always includes text or an accessible label.

## Persistence, import, and migration

- [ ] Notes, Roadmap filters and sorting, hints, release state, and preferences persist after reload.
- [ ] Reset Preferences preserves notes; Erase All removes content, preferences, token, and recovery data only after custom confirmation.
- [ ] Export contains state-model version, notes, preferences, and module settings, but never the GitHub token.
- [ ] A malformed or oversized import is rejected without replacing current data.
- [ ] A valid import shows its preview, migrates and sanitizes, confirms replacement, and preserves a recovery copy.
- [ ] `docs/examples/legacy-backup-v1.json` and `legacy-backup-v2.json` migrate without losing their user content.

## GitHub synchronization

- [ ] Missing configuration opens setup; invalid values show actionable validation.
- [ ] Connection testing distinguishes authentication, permission, missing repository/branch, network, and malformed remote-file failures.
- [ ] Local-only, remote-only, current, missing-file, first-sync, conflict, offline, and error states have distinct accessible labels and styles.
- [ ] Conflict choices include merge, upload, download, and cancel; no divergent data is overwritten silently.
- [ ] Download and merge preserve a recovery copy and keep device-local cloud settings.
- [ ] Visibility, interval, and reconnect checks do not overlap or apply stale responses.
- [ ] JSON backup/restore remains usable without GitHub.

## PWA and recovery

- [ ] First online visit caches every `SHELL` entry and a later offline reload opens Notes, Roadmap, and Support.
- [ ] An online refresh revalidates and displays current HTML, CSS, and JavaScript instead of preferring stale cache entries.
- [ ] A waiting service worker shows Update available and refreshes only after the user chooses it.
- [ ] Light/dark favicon, manifest, touch icon, install icon, and splash assets resolve.
- [ ] Manual recovery copy enables Restore; restoring replaces state only after confirmation.
- [ ] Storage quota and unavailable-API paths show useful fallback messages.
