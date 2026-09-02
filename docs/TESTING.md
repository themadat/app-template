# Verification checklists

## Automated baseline

- [ ] Every JavaScript file and `sw.js` passes `node --check`.
- [ ] Both manifests parse as JSON.
- [ ] `git diff --check` is clean.
- [ ] Every local `src`, `href`, manifest icon, and service-worker shell path exists.
- [ ] No console errors appear during startup or the tested workflows.

## Desktop

- [ ] Header, version/Beta pills, centered global search, toolbar, icon catalog, and combined floating storage/sync status fit without horizontal overflow.
- [ ] The full-width catalog reports 3,129 unique icons, initially renders up to 500 wider responsive cards with separate preview-copy and direct-name-edit controls plus bottom-corner type/compact-info controls, keeps Counterclockwise on one line at the default text size, keeps the longest Arrow Trianglehead label to four lines at the same normal font size as every other card, wraps longer names, keeps persistent category chips plus type/source controls in the compact vertical left rail, remains alphabetically ordered, and progressively reveals additional 500-icon batches.
- [ ] `/` focuses global search; Enter closes suggestions and moves to matching cards below; suggestion results still focus their corresponding copy button or route to Notes, Help, releases, and the Settings Roadmap.
- [ ] No retained source comes from SVG Converter’s generated output folders, no SF Symbol name appears more than once, no display label contains `Svgrepo Com`, and the excluded malformed E Push extraction is absent; all previews avoid unintended filled canvas rectangles; all 646 current `Badge` SVGs appear under Badged and any available expected nested subtype, all 49 current `Time` SVGs appear under Time, all 65 current `Cloud:Drive` SVGs appear under Cloud & Drive, all 110 current `Shapes` SVGs appear under Shapes, all 30 current `Sparkles:Rays` SVGs and the earlier Rays collection appear under Rays & Sparkles, all 173 current `Weather` SVGs appear under Weather, all 133 current `Health` SVGs appear under Health, and all 159 current `Nature` SVGs appear under Nature; the earlier `!Badge`, `!Time`, `server:drive`, `shapes`, `sparkles`, `weather`, `!Health`, `!Nature`, and `!Rays` names remain supported; Badged exposes 39 primary choices, omits Circle/Multiple/Slash as direct children, retains its 24 plain-badge records under Badge, nests Shield/Triangle under Shapes and Circle/Triangle under Exclamation Mark, and places `clock.badge.checkmark` under Checkmark rather than Clock; every parent branch can be collapsed, persists that state, and moves selected descendants to the visible parent when closing; Up/Down activates adjacent visible categories; name, alias, semantic-tag, category, and multi-word searches return expected icons; selecting a preview copies complete SVG markup; selecting a name and the Icon details Edit metadata action open the same complete editor; right-click removes the icon from the selected category and Undo restores it; each information button opens category, tag, identifier, alias, filename, repository, path, and source-symbol details plus direct Name/Type fields that match the complete editor; editing validates names and Custom/Symbol type, changes the filter source without discarding original provenance, adds/removes multiple recursive groups, resets one icon through custom confirmation, and exports every saved override as a simple compiler-ready JSON array; all 82 permanent supplied overrides appear in the compiled output; focus returns to the opener when dialogs close.
- [ ] No retained source comes from SVG Converter’s aggregate `app-input/!All/` roll-up.
- [ ] Every file in the requested `!Accessibility` (122), `!Editing` (163), `!Keyboard` (104), `!Maps` (141), `!Math` (101), `!Media` (106), `!Privacy & Security` (155), and `!Transportation` (119) folders is represented by an icon assigned to its matching quick category after deduplication; equivalent folder names without `!` remain supported.
- [ ] In Developer Mode, a minimum label length such as 30 filters the main catalog and reports the matching count; clearing restores the catalog, disabling Developer Mode suspends the filter, and Export overrides is enabled only when local icon changes exist.
- [ ] Copying shows visible and announced success, and clipboard denial provides an actionable failure message.
- [ ] Notes opens blank as one modal, focuses its textarea, autosaves plain text, has no Done button or autosave heading, appears in global search, and restores focus when closed.
- [ ] The current four-part version matches the build id, asset queries, and service-worker cache; each release-log date appears beside its version number.
- [ ] Roadmap search, Released/Planned/Wishlist filters, and every sort option work inside Settings.
- [ ] Settings, Help, What’s New, Shortcuts, Roadmap, and Developer tabs render and manage focus; the main-page What’s New banner exposes V/X, and the New version available toast exposes R to Force Refresh and X to close, directly and with Shift–Control–Option.
- [ ] Toasts and polite/assertive announcements communicate completion without relying on color.

## Tablet and mobile

- [ ] At representative 768px and 390px widths, document and body scroll widths do not exceed the viewport; the rail remains vertical at tablet width and becomes a compact top filter surface on mobile.
- [ ] Top controls remain touch-sized and form fields do not trigger unwanted input zoom.
- [ ] Notes fills the mobile viewport without horizontal overflow or nested page scrolling.
- [ ] Icon details and metadata editing fill the mobile viewport, wrap long content, keep one scrollable content panel, and present touch-sized group checkboxes and footer actions.
- [ ] Settings fills the screen and uses one scrolling content surface.
- [ ] Floating Sync stays inside safe areas and does not obscure required controls.

## Keyboard and accessibility

- [ ] Visible focus, logical focus order, labels, roles, and ARIA state are correct.
- [ ] Escape closes menus, popovers, and dialogs and returns focus to the trigger.
- [ ] `/`, `H`/`?`, `,`, `2`, `N`, `V`, `R`, `X`, `S`, `E`, `T`, and `D`/`|` work in their valid contexts outside editable fields; icon commands F/G/I/C/L work directly and with Shift–Control–Option.
- [ ] Holding Shift–Control–Option reveals shortcut hints only for enabled controls in the active page or dialog, and releasing any chord key hides them.
- [ ] Hovering a shortcut-enabled control shows both its plain key and Shift–Control–Option command.
- [ ] Tabs and menu items support arrow-key movement; icon cards support Left/Right/Up/Down plus Home/End without hiding the separate information controls; the filter-rail separator supports drag/touch plus Left/Right/Home/End resizing and reports its current value; Developer Mode shows the rail percentage only while pointer dragging.
- [ ] Appearance contains color mode, then button presentation, then one iOS-style text-size slider; there are no Primary/Secondary/status color editors, theme presets, or manual motion controls, the slider updates application and reading text together, and the device reduced-motion setting removes nonessential transitions and animations.
- [ ] Light and dark themes meet contrast needs; status always includes text or an accessible label.

## Persistence, import, and migration

- [ ] Icon category/type/source settings, category collapse state, filter-rail width, icon name/type/group/filter-source overrides, Notes, Roadmap filters and sorting, hints, release state, and preferences persist after reload.
- [ ] Reset Preferences preserves notes and icon metadata overrides; Erase All removes content, overrides, preferences, token, and recovery data only after custom confirmation.
- [ ] Backup export contains state-model version, notes, preferences, icon metadata overrides, and module settings, but never the GitHub token; compact override export is a plain array containing stable icon IDs, labels, category IDs, and only explicitly changed type/filter-source values.
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

- [ ] First online visit caches every `SHELL` entry, including the generated icon catalog, and a later offline reload supports icon search/copy, Notes, the Settings Roadmap, and Settings.
- [ ] An online refresh revalidates and displays current HTML, CSS, and JavaScript instead of preferring stale cache entries.
- [ ] A waiting service worker shows a bottom New version available toast; its arrow-only Force refresh action and contextual R shortcut activate it and reload the browser tab or installed PWA, while X closes the notice. R/X also work with Shift–Control–Option, display shortcut hints, and stay inactive when a dialog owns focus.
- [ ] The Safari favicon uses a fully opaque `#8E8E93` background with visible blue blueprint geometry and no inset outline; manifest, touch icon, install icon, and splash assets resolve.
- [ ] Manual recovery copy enables Restore; restoring replaces state only after confirmation.
- [ ] Storage quota and unavailable-API paths show useful fallback messages.
