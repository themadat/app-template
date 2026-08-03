# Shared components

## Dialogs and choices

`components.openDialog()` stores the trigger, opens a native modal, and focuses the requested or first appropriate control. Closing restores focus. Confirmation, message, choice, import-preview, creation, and Support dialogs share this lifecycle. On mobile, application dialogs become full-screen surfaces with one scrolling panel.

Use `components.confirm()` for destructive operations and `components.choose()` when the user must explicitly select among safe alternatives such as sync merge/upload/download.

## Menus and popovers

`components.openMenu()` renders an anchored menu into the shared popover. Positioning is clamped to the visible viewport, focus moves into the menu, arrow keys move between commands, and Escape closes and restores focus. Note actions support click, right-click, and long press.

## Toasts, announcements, and loading

`components.toast()` updates the reusable `role="status"` toast and can include one action. Critical completion text can also be written to the assertive live region. `components.setLoading()` controls the modal loading overlay for operations such as connection tests.

## Empty and error states

Module empty states use one shared visual pattern with a heading, explanation, and optional visible recovery action. Sync, storage, import, and PWA failures use inline status, message dialogs, or persistent toasts depending on whether immediate action is required.

## Notepad

Notepad is a deliberately basic plain-text editor backed by the compatibility `documents` collection. User text is escaped before storage, list previews use sanitized text, and imported legacy rich text is converted to readable text when opened in the textarea. Notes support search, sorting, pointer reorder, `Alt + Arrow` reorder, deletion confirmation, and mobile list/detail navigation.

## Global search

`/` focuses the global search unless the user is already editing a field. Results include notes, Help topics, release entries, and Roadmap items. Result activation routes to the relevant module or Support view. Module-specific searches remain independent.

## Shortcut hints

Controls declare `data-shortcut`. When the configured modifier is held, a CSS badge appears without replacing the visible control. Shortcuts never replace visible buttons or native interactions.

## Icon conventions

Use the inline SVG catalog in `assets/js/icons.js` whenever an appropriate SF Symbol exists. Controls still require meaningful visible text or an accessible name; state is never communicated by icon or color alone.
