# Reusable components and conventions

The shared component layer uses native HTML wherever possible and attaches small behavior helpers through `window.LocalApp.components`. It does not require a framework.

## Dialogs, sheets and confirmations

`components.openDialog(dialog, options)` records the trigger, opens the native modal, and focuses the requested or first appropriate control. Closing restores focus. Escape uses the native dialog lifecycle. On small screens, application dialogs become full-screen surfaces with one page scroll; a dialog can use the same structure as a mobile sheet without nested scrolling.

Use `components.confirm(options)` for destructive or consequential yes/no decisions and `components.choose(options)` for several explicit outcomes such as upload/download/merge/cancel. Titles and body text must identify the affected content. Do not use browser `alert`, `confirm`, or `prompt`.

## Popovers, menus and context actions

`components.openPopover(element, anchor, options)` clamps the surface to the visible viewport and restores focus on close. The shared secondary-action menu supports arrow keys, Home/End, Enter/Space, Escape, outside clicks, right-click, and optional long press. Every action in a context menu must also appear as a visible button or keyboard operation.

## Listboxes, pickers and tabs

Search result lists expose `role="listbox"` and options with selected state. Prefer native `select`, color, text, number, and file inputs for ordinary pickers. Support panels use a tablist with arrow-key navigation, managed `tabindex`, `aria-selected`, and labelled tabpanels.

## Toasts, inline status and progress

Use `components.toast(message, options)` for short non-blocking completion or failure messages. Global and cloud states always combine an icon, label, and semantic color. Polite and assertive live regions announce background status and errors. The shared loading overlay is reserved for operations that temporarily block the whole application; button-level operations use busy labels and disabled state.

## Empty, unavailable, error and disabled states

- Empty state: explain why nothing is shown and offer the likely next action.
- Unavailable state: name the missing browser, network, or configuration capability.
- Error state: preserve local data, describe recovery, and avoid raw untrusted response bodies.
- Disabled state: use a native disabled control when possible; when not possible, add `aria-disabled="true"` and suppress activation.
- Offline state: keep local work usable and make the unavailable network action explicit.

## Search and expandable rows

Global search is available from the sticky shell and `/` focuses it outside editable controls. Module searches persist where they represent a useful working state. Record summaries use an expandable button with `aria-expanded`; expansion is operable without pointer input.

## Drag handles and reordering

Drag handles are buttons, not generic clickable containers. Pointer drag is a convenience. Focus an item and use `Alt` plus an arrow key for the equivalent reorder operation. Status is announced after a move, and persisted order values are normalized.

## Rich text

The Documents editor allows a deliberately small formatting set. Stored and imported markup passes through an allow-list sanitizer; user text is escaped by default and unsanitized strings are never assigned to `innerHTML`. Links allow only safe HTTP(S) URLs, open in a new window, and receive `noopener noreferrer`.

## Adding a component

1. Start with the closest native element and semantic role.
2. Define keyboard, touch, mouse, focus, Escape and outside-click behavior.
3. Add accessible name, state attributes, validation and a live announcement if state changes elsewhere.
4. Ensure the surface fits the visual viewport and mobile safe areas.
5. Add a non-drag, non-hover, non-context-menu path for critical actions.
6. Check reduced motion, forced colors, 200% text, light/dark themes and screen-reader order.

## State attributes used by the shell

The template uses `aria-pressed` for toggle controls, `aria-selected` for tabs/list choices, `aria-expanded` for details and advanced sections, `aria-current` for module navigation, `aria-disabled` when native disabling is unavailable, `aria-live` for status, and `aria-busy` during asynchronous operations. Keep the property and its visible state synchronized in the same render path.
