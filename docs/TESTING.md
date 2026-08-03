# Verification checklists

Use a static HTTP server. Test with a clean browser profile and with an upgraded profile that already contains data. Complete both automated smoke checks and manual keyboard/screen-reader checks before a release.

## Accessibility

- [ ] Landmarks, headings, controls, fields, lists and links use appropriate native semantics.
- [ ] Every icon-only control has a useful accessible name and tooltip.
- [ ] Keyboard focus is always visible and follows a predictable order.
- [ ] Dialogs focus an appropriate element, contain focus, close with Escape and restore the trigger.
- [ ] Tabs, menus, listboxes, expandable rows and comparison/roadmap objects are keyboard-operable.
- [ ] Drag and long-press operations have visible and keyboard alternatives.
- [ ] Validation errors identify their field and are announced.
- [ ] Loading, sync, save, offline and error states are exposed through live regions.
- [ ] Status never depends on color alone.
- [ ] Text and control contrast passes WCAG AA in light and dark themes.
- [ ] Touch controls remain usable at 44 × 44 CSS pixels where practical.
- [ ] System and application reduced-motion settings suppress nonessential animation.
- [ ] 200% text zoom does not hide actions or create horizontal page scrolling.
- [ ] Forced-colors mode retains focus, selection, status and boundaries.

## Desktop

- [ ] Test current Chrome/Edge, Firefox and Safari at 1280 × 800 and a wide display.
- [ ] Header, search, navigation and floating status remain available without covering content.
- [ ] List/detail panels can be independently hidden and restored.
- [ ] Divider moves with pointer and keyboard; its proportion persists after reload.
- [ ] Popovers and context menus remain within every viewport edge.
- [ ] `/`, `?`, module shortcuts, major-action shortcuts and Escape behave as documented.
- [ ] Holding the configured modifier shows useful shortcut hints without blocking primary content.
- [ ] Record/document reorder works by drag and keyboard.

## Tablet

- [ ] Test portrait and landscape around 768 × 1024.
- [ ] Desktop multi-panel layout becomes a clear single-column list/detail flow.
- [ ] Navigation and action controls wrap without horizontal overflow.
- [ ] On-screen keyboard does not hide active form controls.
- [ ] Touch, pointer and hardware-keyboard paths produce equivalent results.

## Mobile

- [ ] Test iPhone-sized 390 × 844 and an Android-sized 412 × 915 viewport.
- [ ] List/detail uses explicit forward/back navigation, not compressed columns.
- [ ] Dialogs use the full screen with one scroll surface and safe-area padding.
- [ ] Inputs remain at 16px or larger and do not trigger unwanted zoom.
- [ ] Floating actions do not cover selected fields, toasts or final list rows.
- [ ] Long press opens secondary actions without making them the only route.
- [ ] No page, dialog, list item, URL or long title causes horizontal overflow.

## Local persistence and recovery

- [ ] First run generates valid neutral demonstration state.
- [ ] Add, edit, select, filter, sort, search, resize and preference changes survive reload.
- [ ] Rapid input does not create duplicate actions or lose the last value.
- [ ] Malformed, partial and missing stored state recover to normalized state without a blank crash.
- [ ] Storage denial and quota failure show an actionable error while keeping in-memory work available.
- [ ] Reset Preferences preserves records and documents.
- [ ] Erase All Data identifies scope, requires custom confirmation and returns to an empty workspace.
- [ ] A saved recovery snapshot can be restored after import/download replacement.

## JSON export and import

- [ ] Export filename is descriptive and timestamped.
- [ ] Export contains records, documents, settings and state-model version.
- [ ] Export never contains the configured GitHub token.
- [ ] Current export imports into a clean browser with matching counts and content.
- [ ] Bare v1, wrapped v2 and current v3 fixtures show the correct preview and migrations.
- [ ] Renamed, removed, split and combined legacy values normalize as documented.
- [ ] Invalid JSON, oversized files, future schema versions and unusable shapes are rejected without changing current state.
- [ ] Imported HTML, URLs, ids, arrays, colors, lengths and numbers are sanitized or rejected.
- [ ] Replacement requires confirmation and creates a recovery snapshot first.

## Offline and installation

- [ ] First HTTPS/localhost load registers the service worker and fully caches the shell.
- [ ] Reload with network disabled opens records, documents, settings and backup features.
- [ ] Network-only sync clearly reports offline and never blocks local editing.
- [ ] Light/dark manifest, favicon, install icon and theme colors match appearance.
- [ ] Install instructions match iPhone, iPad, Android, Mac and Windows/other categories.
- [ ] Standalone launch is detected where the browser exposes it.
- [ ] A changed cache/build id produces an update-available notice and refreshes only after user action.

## GitHub synchronization

- [ ] Sync remains dormant before configuration and explicit test/action.
- [ ] Owner, repository, branch and path validation rejects unsafe or malformed targets.
- [ ] Token is stored according to the remember choice, masked after entry and forgettable.
- [ ] Connection test distinguishes authentication, missing repository/branch, offline and network failures.
- [ ] Missing remote file presents first-sync choices.
- [ ] Local-only changes upload; remote-only changes download; equal copies report Current.
- [ ] Divergence never overwrites silently and offers upload, download, merge or cancel.
- [ ] Merge honors newer item timestamps and deletion tombstones.
- [ ] Download and merge create recovery snapshots.
- [ ] A stale SHA/write conflict stops and rechecks rather than retrying blindly.
- [ ] Periodic, visibility and online rechecks do not overlap or apply stale responses.
- [ ] Unexpected remote JSON is treated as an untrusted import and cannot replace local state.

## Release and support content

- [ ] Visible version, export metadata, newest release and manifest metadata agree.
- [ ] What’s New appears once per version and dismissal persists.
- [ ] Help search finds installation, backup, sync and shortcut guidance.
- [ ] Released/planned/wishlist roadmap filters and every requested sort work.
- [ ] Developer Mode diagnostics omit secrets and arbitrary code execution.
- [ ] Disabling each optional feature flag leaves the remaining application coherent.
