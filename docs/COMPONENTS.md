# Shared components

## Dialogs and choices

`components.openDialog()` stores the trigger, opens a native modal, and focuses the requested or first appropriate control. Closing restores focus. Confirmation, message, choice, import-preview, creation, and Settings dialogs share this lifecycle. On mobile, application dialogs become full-screen surfaces with one scrolling panel.

Use `components.confirm()` for destructive operations and `components.choose()` when the user must explicitly select among safe alternatives such as sync merge/upload/download.

## Menus and popovers

`components.openMenu()` renders an anchored menu into the shared popover. Positioning is clamped to the visible viewport, focus moves into the menu, arrow keys move between commands, and Escape closes and restores focus.

## Toasts, announcements, and loading

`components.toast()` updates the reusable `role="status"` toast and can include one text or SF Symbol action. Critical completion text can also be written to the assertive live region. `components.setLoading()` controls the modal loading overlay for operations such as connection tests.

## Empty and error states

Module empty states use one shared visual pattern with a heading, explanation, and optional visible recovery action. Sync, storage, import, and PWA failures use inline status, message dialogs, or persistent toasts depending on whether immediate action is required.

## Notes

Notes is one large, initially blank plain-text textarea in a native modal. It opens from the visible Notes control or `N`, autosaves locally, closes from the standard close control or Escape, and returns focus to its trigger. There is no redundant Done action or autosave heading. The compatibility `documents` collection remains in state and sync payloads, but normalization consolidates it to the stable `app-notes` document. Migration from earlier multi-note state retains each title as a section heading and preserves its text.

## Global search

`/` focuses the centered global search unless the user is already editing a field. Enter closes the suggestion list, renders matching icon cards below, scrolls to the catalog, and focuses the first match. Results also include Notes, Help topics, release entries, and Roadmap items; those suggestion buttons retain their direct routes.

## Icon catalog

Catalog cards deliberately show only the SVG preview and multiline name, with Custom/Symbol at bottom left and a compact information button at bottom right. Selecting the card copies its complete sanitized SVG. The full-width catalog uses a compact sticky vertical rail for result count, type, source, and persistent multi-category chips, including Cloud/Server, Shapes, Badged with nested Plus/Minus/Checkmark/Xmark choices, Squared, Circled, Slashed, and Sparkled. A pointer-, touch-, and keyboard-operable divider changes the rail width and persists it locally; the mobile layout keeps horizontal category chips and hides the divider. Results remain alphabetical. Global search matches names, aliases, categories, semantic tags, repositories, and source metadata. The information dialog shows categories, tags, normalized identifier, aliases, repositories, filenames, full paths, and source-symbol names. Arrow keys, Home, and End move among visible card copy buttons.

## Shortcut hints

Controls declare `data-shortcut`. Holding Shift–Control–Option reveals badges only on enabled controls in the active page or dialog; hovering a shortcut-enabled control exposes the plain and chorded commands. Global shortcuts use physical key codes and work both directly and with the full chord held. Command-key combinations remain available to the browser. The main-page What’s New banner exposes V to view release notes and contextual X to dismiss the notice. The New version available toast dynamically exposes R for Force Refresh and X to close. The icon library exposes F for categories and filters, G for the first result, I for focused-icon details, C to clear search, and L to load more. Shortcuts never replace visible buttons or native interactions.

## Icon conventions

Use the inline SVG catalog in `assets/js/icons.js` whenever an appropriate SF Symbol exists. Controls still require meaningful visible text or an accessible name; state is never communicated by icon or color alone.
