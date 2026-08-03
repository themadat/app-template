(function () {
  "use strict";

  const App = window.LocalApp;
  const config = App.config;
  const u = App.utils;
  const model = App.stateModel;
  const storage = App.storage;
  const components = App.components;
  const portability = App.portability;
  const sync = App.sync;
  const pwa = App.pwa;
  let draggedRecordId = "";
  let draggedDocumentId = "";
  let savedDocumentSelection = null;
  let versionView = "released";
  let hintModifierActive = false;

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };

  const SHORTCUTS = [
    { keys: "/", label: "Focus global search", group: "Global" },
    { keys: "Esc", label: "Close a dialog, menu, or mobile detail", group: "Global" },
    { keys: "?", label: "Open Help Center", group: "Global" },
    { keys: "1 / 2 / 3", label: "Open Records / Documents / Roadmap", group: "Navigation" },
    { keys: "N", label: "Add an item in the current module", group: "Actions" },
    { keys: "S", label: "Run the primary sync action", group: "Actions" },
    { keys: "E", label: "Export a JSON backup", group: "Actions" },
    { keys: "Alt + ↑ / ↓", label: "Move the focused record or document", group: "Organizing" },
    { keys: "Enter / Space", label: "Open a focused list item", group: "Lists" },
    { keys: "Arrow keys", label: "Move through tabs, menus, and list choices", group: "Navigation" },
    { keys: "Ctrl + Alt + Shift + D", label: "Toggle hidden Developer Mode", group: "Developer" }
  ];

  function state() {
    return storage.getState();
  }

  function setInputValue(input, value) {
    if (input && document.activeElement !== input) input.value = value == null ? "" : String(value);
  }

  function statusMeta(id) {
    return config.statuses.find(function (status) { return status.id === id; }) || config.statuses[0];
  }

  function activeModuleEnabled(id) {
    if (id === "documents") return config.features.documents && state().modules.documents.enabled;
    if (id === "roadmap") return config.features.roadmap;
    return id === "records";
  }

  function applyIdentity() {
    document.title = config.identity.name;
    $("meta[name='description']").content = config.identity.description;
    $("#appName").textContent = config.identity.name;
    $("#versionButton").textContent = "v" + config.identity.version;
    $("#versionButton").setAttribute("aria-label", "Open release notes for version " + config.identity.version);
    $("#appIcon").src = config.identity.assets.appIconLight;
    $("#releaseCurrentVersion").textContent = "v" + config.identity.version;
    if (!config.features.documents) {
      $("[data-module='documents']")?.setAttribute("hidden", "");
      $("#documentsModule")?.setAttribute("hidden", "");
    }
    if (!config.features.roadmap) {
      $("[data-module='roadmap']")?.setAttribute("hidden", "");
      $("#roadmapModule")?.setAttribute("hidden", "");
      $("#supportRoadmapTab")?.setAttribute("hidden", "");
    }
  }

  function applyAppearance() {
    const appearance = state().preferences.appearance;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = appearance.mode === "dark" || (appearance.mode === "system" && systemDark);
    const root = document.documentElement;
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.buttonStyle = state().preferences.controls.buttonStyle;
    const systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduce = appearance.reducedMotion === "reduce" || (appearance.reducedMotion === "system" && systemReduce);
    root.dataset.motion = reduce ? "reduce" : "full";
    root.style.setProperty("--text-scale", String(appearance.textScale));
    root.style.setProperty("--reading-scale", String(appearance.readingScale));
    root.style.setProperty("--accent", appearance.accent);
    root.style.setProperty("--accent-strong", u.mixColor(appearance.accent, dark ? "#ffffff" : "#000000", dark ? 0.18 : 0.22));
    root.style.setProperty("--accent-soft", u.mixColor(appearance.accent, dark ? "#161c1b" : "#ffffff", dark ? 0.76 : 0.86));
    root.style.setProperty("--accent-2", appearance.accent2);
    root.style.setProperty("--accent-2-soft", u.mixColor(appearance.accent2, dark ? "#161c1b" : "#ffffff", dark ? 0.78 : 0.86));
    root.style.setProperty("--success", appearance.success);
    root.style.setProperty("--warning", appearance.warning);
    root.style.setProperty("--danger", appearance.danger);
    $("#appIcon").src = dark ? config.identity.assets.appIconDark : config.identity.assets.appIconLight;
    pwa.applyAppearanceAssets?.();
  }

  function renderNavigation() {
    const active = state().ui.activeModule;
    $$('[data-module]').forEach(function (button) {
      const selected = button.dataset.module === active;
      button.toggleAttribute("hidden", !activeModuleEnabled(button.dataset.module));
      if (selected) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    $$('[data-module-surface]').forEach(function (surface) {
      surface.hidden = surface.dataset.moduleSurface !== active;
    });
    const label = active === "documents" ? "New document" : active === "roadmap" ? "Roadmap is demonstrative" : "New record";
    $("#newItemButton .button-label").textContent = active === "documents" ? "Document" : "New";
    $("#newItemButton").disabled = active === "roadmap";
    $("#newItemButton").title = label;
    $("#floatingAddButton").disabled = active === "roadmap";
    $("#floatingAddButton").hidden = active === "roadmap";
  }

  function renderPanels() {
    const panels = state().ui.panels;
    $$('[data-workspace-grid]').forEach(function (grid) {
      grid.style.setProperty("--list-ratio", String(panels.listRatio));
      grid.classList.toggle("hide-list", !panels.listVisible);
      grid.classList.toggle("hide-detail", !panels.detailVisible);
      grid.dataset.mobileScreen = state().ui.navigation.mobileScreen;
    });
    $("#toggleListPanelButton").setAttribute("aria-pressed", String(panels.listVisible));
    $("#toggleDetailPanelButton").setAttribute("aria-pressed", String(panels.detailVisible));
    $("#settingsListPanel").setAttribute("aria-pressed", String(panels.listVisible));
    $("#settingsListPanel").textContent = panels.listVisible ? "Shown" : "Hidden";
    $("#settingsDetailPanel").setAttribute("aria-pressed", String(panels.detailVisible));
    $("#settingsDetailPanel").textContent = panels.detailVisible ? "Shown" : "Hidden";
    $$('[role="separator"]').forEach(function (divider) { divider.setAttribute("aria-valuenow", String(Math.round(panels.listRatio * 100))); });
  }

  function renderHeader() {
    $("#workspaceTitle").textContent = state().workspace.title;
    setInputValue($("#globalSearch"), state().ui.search);
    renderSyncStatus();
    const latest = config.releases[0];
    const unread = latest && state().ui.seenReleaseVersion !== latest.version;
    $("#releaseUnreadDot").hidden = !unread;
    const banner = $("#whatsNewBanner");
    banner.hidden = !unread;
    if (unread) {
      $("[data-whats-new-version]").textContent = "v" + latest.version;
      $("[data-whats-new-title]").textContent = latest.title;
      $("[data-whats-new-summary]").textContent = latest.summary;
    }
    const hint = $("#contextHint");
    const hintHidden = !config.features.hints || !state().preferences.hints.enabled || state().preferences.hints.dismissed.includes("workspace-basics");
    hint.hidden = hintHidden;
  }

  function renderSyncStatus() {
    const info = sync.getInfo();
    const offline = navigator.onLine === false;
    const globalIcon = $("[data-global-status-icon]");
    const globalLabel = $("[data-global-status-label]");
    if (offline) {
      globalIcon.textContent = "∕";
      globalLabel.textContent = "Offline · saved locally";
    } else if (!sync.configured()) {
      globalIcon.textContent = storage.isPersistent() ? "✓" : "!";
      globalLabel.textContent = storage.isPersistent() ? "Saved locally" : "Storage unavailable";
    } else {
      globalIcon.textContent = info.icon;
      globalLabel.textContent = info.title;
    }
    [$("#syncToolbarButton"), $("#floatingStatusButton")].forEach(function (button) {
      if (!button) return;
      button.dataset.syncState = info.state;
      button.disabled = info.busy || info.state === "offline";
      button.title = info.title + ". " + info.message;
      button.setAttribute("aria-label", info.title + ". " + info.message);
    });
    $("[data-sync-icon]").textContent = info.icon;
    $("[data-floating-status-icon]").textContent = offline ? "∕" : info.icon;
  }

  function categories() {
    return Array.from(new Set(state().workspace.records.map(function (record) { return record.category; }))).sort(function (a, b) { return a.localeCompare(b); });
  }

  function matchesRecord(record) {
    const ui = state().ui.records;
    const query = state().ui.search.trim().toLowerCase();
    if (ui.statusFilter !== "all" && record.status !== ui.statusFilter) return false;
    if (ui.categoryFilter !== "all" && record.category !== ui.categoryFilter) return false;
    if (ui.favoritesOnly && !record.favorite) return false;
    if (!query) return true;
    return [record.title, record.summary, record.category, record.status, record.tags.join(" ")].join(" ").toLowerCase().includes(query);
  }

  function sortedRecords() {
    const ui = state().ui.records;
    const direction = ui.sortDirection === "desc" ? -1 : 1;
    return state().workspace.records.filter(matchesRecord).slice().sort(function (a, b) {
      let compared = 0;
      if (ui.sortBy === "order") compared = a.order - b.order;
      else if (ui.sortBy === "status") compared = config.statuses.findIndex(function (item) { return item.id === a.status; }) - config.statuses.findIndex(function (item) { return item.id === b.status; });
      else if (ui.sortBy === "updatedAt" || ui.sortBy === "createdAt") compared = Date.parse(a[ui.sortBy]) - Date.parse(b[ui.sortBy]);
      else compared = a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true });
      return compared * direction || a.order - b.order;
    });
  }

  function statusPill(record) {
    const status = statusMeta(record.status);
    return '<span class="status-chip" style="--status-color:' + u.escapeHtml(status.color) + '"><span aria-hidden="true">' + u.escapeHtml(status.icon) + "</span>" + u.escapeHtml(status.label) + "</span>";
  }

  function recordCard(record) {
    const selected = state().ui.selectedRecordId === record.id;
    const expanded = state().ui.records.expandedIds.includes(record.id);
    const tags = record.tags.slice(0, 3).map(function (tag) { return '<span class="tag">' + u.escapeHtml(tag) + "</span>"; }).join("");
    return '<article id="record-option-' + u.escapeHtml(record.id) + '" class="record-card' + (selected ? " selected" : "") + (expanded ? " expanded" : "") + '" role="option" aria-selected="' + selected + '" aria-expanded="' + expanded + '" tabindex="0" draggable="true" data-record-id="' + u.escapeHtml(record.id) + '">' +
      '<span class="drag-handle" aria-hidden="true">⠿</span>' +
      '<div class="record-card-copy"><div class="record-card-title"><strong>' + u.escapeHtml(record.title) + '</strong>' + (record.favorite ? '<span class="favorite-mark" aria-label="Favorite">★</span>' : "") + '</div><div class="record-card-meta">' + statusPill(record) + '<span>' + u.escapeHtml(record.category) + '</span><span>' + u.dateLabel(record.updatedAt) + "</span></div>" +
      (expanded && record.summary ? '<p>' + u.escapeHtml(record.summary) + "</p>" : "") + (tags ? '<div class="tag-row">' + tags + "</div>" : "") + "</div>" +
      '<button class="record-menu-button icon-button" type="button" data-record-menu="' + u.escapeHtml(record.id) + '" aria-label="Actions for ' + u.escapeHtml(record.title) + '" aria-haspopup="menu" aria-expanded="false">•••</button>' +
      "</article>";
  }

  function emptyState(title, message, actionLabel, action) {
    return '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h3>' + u.escapeHtml(title) + '</h3><p>' + u.escapeHtml(message) + '</p>' + (actionLabel ? '<button type="button" class="button primary" data-action="' + u.escapeHtml(action) + '">' + u.escapeHtml(actionLabel) + "</button>" : "") + "</div>";
  }

  function renderRecordControls() {
    const statusSelect = $("#recordStatusFilter");
    const selectedStatus = state().ui.records.statusFilter;
    statusSelect.innerHTML = '<option value="all">All statuses</option>' + config.statuses.map(function (status) { return '<option value="' + status.id + '">' + u.escapeHtml(status.label) + "</option>"; }).join("");
    statusSelect.value = selectedStatus;
    const categorySelect = $("#recordCategoryFilter");
    const selectedCategory = state().ui.records.categoryFilter;
    categorySelect.innerHTML = '<option value="all">All categories</option>' + categories().map(function (category) { return '<option value="' + u.escapeHtml(category) + '">' + u.escapeHtml(category) + "</option>"; }).join("");
    categorySelect.value = categories().includes(selectedCategory) ? selectedCategory : "all";
    $("#recordSort").value = state().ui.records.sortBy;
    $("#recordSortDirection").setAttribute("aria-pressed", String(state().ui.records.sortDirection === "desc"));
    $("#recordSortDirection").textContent = state().ui.records.sortDirection === "desc" ? "↓" : "↑";
    $("#favoritesFilter").setAttribute("aria-pressed", String(state().ui.records.favoritesOnly));
    $("#recordViewModeButton").setAttribute("aria-pressed", String(state().ui.records.viewMode === "compact"));
  }

  function renderRecordList() {
    renderRecordControls();
    const records = sortedRecords();
    $("#recordResultCount").textContent = records.length + " item" + (records.length === 1 ? "" : "s");
    const list = $("#recordList");
    list.dataset.viewMode = state().ui.records.viewMode;
    const stateEl = $("#recordListState");
    if (!state().workspace.records.length) {
      stateEl.innerHTML = emptyState("No records yet", "Add a neutral record or replace this module with your own entity type.", "Add record", "new-record");
      stateEl.hidden = false;
      list.hidden = true;
      return;
    }
    if (!records.length) {
      stateEl.innerHTML = emptyState("No matches", "Try clearing search or record filters.", "Clear filters", "clear-record-filters");
      stateEl.hidden = false;
      list.hidden = true;
      return;
    }
    stateEl.hidden = true;
    list.hidden = false;
    list.innerHTML = records.map(recordCard).join("");
    list.setAttribute("aria-activedescendant", state().ui.selectedRecordId ? "record-option-" + state().ui.selectedRecordId : "");
    $$("[data-record-id]", list).forEach(function (card) {
      components.bindLongPress(card, function () { openRecordMenu(card.dataset.recordId, card); });
    });
  }

  function selectedRecord() {
    return state().workspace.records.find(function (record) { return record.id === state().ui.selectedRecordId; }) || null;
  }

  function renderRecordDetail() {
    const container = $("#recordDetail");
    const record = selectedRecord();
    if (!record) {
      container.innerHTML = emptyState("No record selected", state().workspace.records.length ? "Choose a record from the list." : "Add a record to begin.", state().workspace.records.length ? "" : "Add record", "new-record");
      return;
    }
    const statuses = config.statuses.map(function (status) { return '<option value="' + status.id + '"' + (record.status === status.id ? " selected" : "") + '>' + u.escapeHtml(status.label) + "</option>"; }).join("");
    const urlLink = record.url ? '<button class="safe-link-button" type="button" data-open-url="' + u.escapeHtml(record.url) + '">Open external link <span aria-hidden="true">↗</span></button>' : '<span class="field-help">No external link</span>';
    container.innerHTML = '<header class="panel-header detail-header"><button type="button" class="mobile-back-button" data-mobile-back aria-label="Back to records">← Records</button><div><span class="eyebrow">Record detail</span><strong>' + u.escapeHtml(record.title) + '</strong></div><div class="panel-header-actions"><button class="button icon-button" type="button" data-toggle-favorite="' + u.escapeHtml(record.id) + '" aria-label="' + (record.favorite ? "Remove favorite" : "Add favorite") + '" aria-pressed="' + record.favorite + '" title="Favorite">★</button><button class="button icon-button" type="button" data-record-menu="' + u.escapeHtml(record.id) + '" aria-label="Record actions" aria-haspopup="menu" aria-expanded="false">•••</button></div></header>' +
      '<form class="record-detail-form" data-record-form="' + u.escapeHtml(record.id) + '"><label class="field full"><span>Title</span><input data-record-field="title" maxlength="140" value="' + u.escapeHtml(record.title) + '"></label>' +
      '<label class="field"><span>Category</span><input data-record-field="category" maxlength="60" value="' + u.escapeHtml(record.category) + '"></label><label class="field"><span>Status</span><select data-record-field="status">' + statuses + "</select></label>" +
      '<label class="field full"><span>Summary</span><textarea data-record-field="summary" rows="7" maxlength="4000">' + u.escapeHtml(record.summary) + "</textarea></label>" +
      '<label class="field full"><span>Tags <small>comma separated</small></span><input data-record-field="tags" value="' + u.escapeHtml(record.tags.join(", ")) + '"></label>' +
      '<label class="field full"><span>External URL <small>http/https only</small></span><input data-record-field="url" type="url" inputmode="url" value="' + u.escapeHtml(record.url) + '"></label><div class="full external-link-row">' + urlLink + "</div>" +
      '<div class="record-meta full"><span>Created ' + u.dateLabel(record.createdAt) + "</span><span>Updated " + u.relativeTime(record.updatedAt) + "</span></div>" +
      '<div class="detail-actions full"><div><button type="button" class="button" data-move-record="-1">Move up</button><button type="button" class="button" data-move-record="1">Move down</button></div><button type="button" class="button danger-text" data-delete-record="' + u.escapeHtml(record.id) + '">Delete record</button></div></form>';
  }

  function renderRecords() {
    renderRecordList();
    renderRecordDetail();
  }

  function openRecordMenu(recordId, anchor) {
    const record = state().workspace.records.find(function (item) { return item.id === recordId; });
    if (!record) return;
    components.openMenu(anchor, [
      { icon: record.favorite ? "☆" : "★", label: record.favorite ? "Remove favorite" : "Add favorite", action: function () { toggleFavorite(recordId); } },
      { icon: "↑", label: "Move up", action: function () { reorderRecord(recordId, -1); } },
      { icon: "↓", label: "Move down", action: function () { reorderRecord(recordId, 1); } },
      { separator: true },
      { icon: "×", label: "Delete record", danger: true, action: function () { requestDeleteRecord(recordId); } }
    ], { focus: true });
  }

  function selectRecord(recordId, options) {
    if (!state().workspace.records.some(function (record) { return record.id === recordId; })) return;
    storage.mutate(function (next) {
      next.ui.selectedRecordId = recordId;
      if (!options || options.mobileDetail !== false) next.ui.navigation.mobileScreen = "detail";
    }, { reason: "select-record" });
    renderRecordList();
    renderRecordDetail();
    renderPanels();
  }

  function toggleRecordExpanded(recordId) {
    storage.mutate(function (next) {
      const ids = next.ui.records.expandedIds;
      next.ui.records.expandedIds = ids.includes(recordId) ? ids.filter(function (id) { return id !== recordId; }) : ids.concat(recordId);
    }, { reason: "expand-record" });
    renderRecordList();
  }

  function addRecord(values) {
    const now = u.isoNow();
    const record = {
      id: u.uid("record"),
      title: u.cleanLine(values.title, 140) || "Untitled record",
      summary: u.cleanText(values.summary, 4000).trim(),
      category: u.cleanLine(values.category, 60) || "General",
      status: statusMeta(values.status).id,
      url: u.safeUrl(values.url),
      tags: Array.from(new Set(String(values.tags || "").split(",").map(function (tag) { return u.cleanLine(tag, 32).toLowerCase(); }).filter(Boolean))).slice(0, 20),
      favorite: false,
      order: state().workspace.records.length,
      createdAt: now,
      updatedAt: now
    };
    storage.mutate(function (next) {
      next.workspace.records.push(record);
      next.ui.selectedRecordId = record.id;
      next.ui.navigation.mobileScreen = "detail";
    }, { reason: "add-record" });
    renderRecords();
    renderPanels();
    renderGlobalSearchResults();
    components.toast("“" + record.title + "” was added.", { title: "Record created", kind: "success" });
    return record;
  }

  function updateRecordField(recordId, field, rawValue) {
    const allowed = new Set(["title", "summary", "category", "status", "url", "tags"]);
    if (!allowed.has(field)) return;
    storage.mutate(function (next) {
      const record = next.workspace.records.find(function (item) { return item.id === recordId; });
      if (!record) return;
      if (field === "title") record.title = u.cleanLine(rawValue, 140) || "Untitled record";
      else if (field === "summary") record.summary = u.cleanText(rawValue, 4000).trim();
      else if (field === "category") record.category = u.cleanLine(rawValue, 60) || "General";
      else if (field === "status") record.status = statusMeta(rawValue).id;
      else if (field === "url") record.url = u.safeUrl(rawValue);
      else if (field === "tags") record.tags = Array.from(new Set(String(rawValue || "").split(",").map(function (tag) { return u.cleanLine(tag, 32).toLowerCase(); }).filter(Boolean))).slice(0, 20);
      record.updatedAt = u.isoNow();
    }, { reason: "edit-record" });
    renderRecordList();
  }

  function toggleFavorite(recordId) {
    storage.mutate(function (next) {
      const record = next.workspace.records.find(function (item) { return item.id === recordId; });
      if (record) { record.favorite = !record.favorite; record.updatedAt = u.isoNow(); }
    }, { reason: "favorite-record" });
    renderRecords();
  }

  function reorderRecord(recordId, delta, targetId) {
    storage.mutate(function (next) {
      const items = next.workspace.records.slice().sort(function (a, b) { return a.order - b.order; });
      const from = items.findIndex(function (item) { return item.id === recordId; });
      let to = targetId ? items.findIndex(function (item) { return item.id === targetId; }) : from + delta;
      if (from < 0 || to < 0 || to >= items.length || from === to) return;
      const moved = items.splice(from, 1)[0];
      items.splice(to, 0, moved);
      items.forEach(function (item, index) { item.order = index; });
      next.workspace.records = items;
    }, { reason: "reorder-record" });
    renderRecordList();
    const card = $("[data-record-id='" + u.cssEscape(recordId) + "']");
    card?.focus({ preventScroll: true });
  }

  async function requestDeleteRecord(recordId) {
    const record = state().workspace.records.find(function (item) { return item.id === recordId; });
    if (!record) return;
    const accepted = await components.confirm({ title: "Delete “" + record.title + "”?", message: "This record will be removed from the workspace. A deletion marker will be kept for safe sync merging.", confirmLabel: "Delete record", danger: true });
    if (!accepted) return;
    storage.mutate(function (next) {
      const index = next.workspace.records.findIndex(function (item) { return item.id === recordId; });
      if (index < 0) return;
      next.workspace.records.splice(index, 1);
      next.meta.tombstones.records = next.meta.tombstones.records.filter(function (item) { return item.id !== recordId; }).concat({ id: recordId, deletedAt: u.isoNow() });
      next.workspace.records.forEach(function (item, order) { item.order = order; });
      next.ui.selectedRecordId = next.workspace.records[Math.min(index, next.workspace.records.length - 1)]?.id || "";
      next.ui.navigation.mobileScreen = "list";
    }, { reason: "delete-record" });
    renderRecords(); renderPanels(); renderGlobalSearchResults();
    components.toast("The record was deleted.", { title: "Record removed", kind: "info" });
  }

  function documentMatches(documentItem) {
    const query = (state().ui.documents.search || state().ui.search).trim().toLowerCase();
    return !query || (documentItem.title + " " + u.stripHtml(documentItem.html)).toLowerCase().includes(query);
  }

  function sortedDocuments() {
    const ui = state().ui.documents;
    const direction = ui.sortDirection === "desc" ? -1 : 1;
    return state().workspace.documents.filter(documentMatches).slice().sort(function (a, b) {
      let compared = 0;
      if (ui.sortBy === "order") compared = a.order - b.order;
      else if (ui.sortBy === "updatedAt" || ui.sortBy === "createdAt") compared = Date.parse(a[ui.sortBy]) - Date.parse(b[ui.sortBy]);
      else compared = a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" });
      return compared * direction || a.order - b.order;
    });
  }

  function documentCard(documentItem) {
    const selected = state().ui.selectedDocumentId === documentItem.id;
    const preview = u.stripHtml(documentItem.html).slice(0, 120);
    return '<article id="document-option-' + u.escapeHtml(documentItem.id) + '" class="document-card' + (selected ? " selected" : "") + '" role="option" aria-selected="' + selected + '" tabindex="0" draggable="true" data-document-id="' + u.escapeHtml(documentItem.id) + '"><span class="drag-handle" aria-hidden="true">⠿</span><div><strong>' + u.escapeHtml(documentItem.title) + '</strong><p>' + u.escapeHtml(preview || "Empty document") + '</p><small>Updated ' + u.relativeTime(documentItem.updatedAt) + '</small></div><button class="icon-button" type="button" data-document-menu="' + u.escapeHtml(documentItem.id) + '" aria-label="Actions for ' + u.escapeHtml(documentItem.title) + '" aria-haspopup="menu" aria-expanded="false">•••</button></article>';
  }

  function renderDocumentList() {
    const documents = sortedDocuments();
    setInputValue($("#documentSearch"), state().ui.documents.search);
    $("#documentSort").value = state().ui.documents.sortBy;
    $("#documentResultCount").textContent = documents.length + " document" + (documents.length === 1 ? "" : "s");
    const list = $("#documentList");
    const stateEl = $("#documentListState");
    if (!state().workspace.documents.length) {
      stateEl.innerHTML = emptyState("No documents yet", "Add a document for notes or remove this optional module in configuration.", "Add document", "new-document");
      stateEl.hidden = false; list.hidden = true; return;
    }
    if (!documents.length) {
      stateEl.innerHTML = emptyState("No matches", "Try a different document search.", "Clear search", "clear-document-search");
      stateEl.hidden = false; list.hidden = true; return;
    }
    stateEl.hidden = true; list.hidden = false;
    list.innerHTML = documents.map(documentCard).join("");
    $$("[data-document-id]", list).forEach(function (card) {
      components.bindLongPress(card, function () { openDocumentMenu(card.dataset.documentId, card); });
    });
  }

  function selectedDocument() {
    return state().workspace.documents.find(function (documentItem) { return documentItem.id === state().ui.selectedDocumentId; }) || null;
  }

  function renderDocumentDetail() {
    const container = $("#documentDetail");
    const documentItem = selectedDocument();
    if (!documentItem) {
      container.innerHTML = emptyState("No document selected", state().workspace.documents.length ? "Choose a document from the list." : "Add a document to begin.", state().workspace.documents.length ? "" : "Add document", "new-document");
      return;
    }
    container.innerHTML = '<header class="panel-header detail-header"><button type="button" class="mobile-back-button" data-mobile-back aria-label="Back to documents">← Documents</button><div><span class="eyebrow">Document</span><strong>' + u.escapeHtml(documentItem.title) + '</strong></div><div class="panel-header-actions"><button class="button icon-button" type="button" data-document-menu="' + u.escapeHtml(documentItem.id) + '" aria-label="Document actions" aria-haspopup="menu" aria-expanded="false">•••</button></div></header>' +
      '<div class="document-editor-shell" data-document-shell="' + u.escapeHtml(documentItem.id) + '"><label class="field document-title-field"><span class="visually-hidden">Document title</span><input data-document-title maxlength="140" value="' + u.escapeHtml(documentItem.title) + '"></label>' +
      '<div class="editor-toolbar" role="toolbar" aria-label="Document formatting"><button type="button" data-editor-command="bold" aria-label="Bold" title="Bold"><strong>B</strong></button><button type="button" data-editor-command="italic" aria-label="Italic" title="Italic"><em>I</em></button><button type="button" data-editor-command="underline" aria-label="Underline" title="Underline"><u>U</u></button><button type="button" data-editor-block="h2" aria-label="Heading" title="Heading">H2</button><button type="button" data-editor-command="insertUnorderedList" aria-label="Bulleted list" title="Bulleted list">• List</button><button type="button" data-editor-block="blockquote" aria-label="Block quote" title="Block quote">“ ”</button><button type="button" data-editor-link aria-label="Add link" title="Add link">↗ Link</button></div>' +
      '<div id="documentEditor" class="document-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Document content" data-document-editor="' + u.escapeHtml(documentItem.id) + '">' + documentItem.html + '</div>' +
      '<footer class="document-footer"><span>Updated ' + u.relativeTime(documentItem.updatedAt) + '</span><div><button type="button" class="button" data-move-document="-1">Move up</button><button type="button" class="button" data-move-document="1">Move down</button><button type="button" class="button danger-text" data-delete-document="' + u.escapeHtml(documentItem.id) + '">Delete</button></div></footer></div>';
  }

  function renderDocuments() {
    renderDocumentList();
    renderDocumentDetail();
  }

  function selectDocument(documentId) {
    if (!state().workspace.documents.some(function (documentItem) { return documentItem.id === documentId; })) return;
    storage.mutate(function (next) { next.ui.selectedDocumentId = documentId; next.ui.navigation.mobileScreen = "detail"; }, { reason: "select-document" });
    renderDocuments(); renderPanels();
  }

  function addDocument(title) {
    const now = u.isoNow();
    const documentItem = { id: u.uid("document"), title: u.cleanLine(title, 140) || "Untitled document", html: "<p></p>", order: state().workspace.documents.length, createdAt: now, updatedAt: now };
    storage.mutate(function (next) { next.workspace.documents.push(documentItem); next.ui.selectedDocumentId = documentItem.id; next.ui.navigation.mobileScreen = "detail"; }, { reason: "add-document" });
    renderDocuments(); renderPanels(); renderGlobalSearchResults();
    requestAnimationFrame(function () { $("#documentEditor")?.focus(); });
    components.toast("“" + documentItem.title + "” was added.", { title: "Document created", kind: "success" });
  }

  function updateDocument(documentId, changes, renderList) {
    storage.mutate(function (next) {
      const documentItem = next.workspace.documents.find(function (item) { return item.id === documentId; });
      if (!documentItem) return;
      if (Object.prototype.hasOwnProperty.call(changes, "title")) documentItem.title = u.cleanLine(changes.title, 140) || "Untitled document";
      if (Object.prototype.hasOwnProperty.call(changes, "html")) documentItem.html = u.sanitizeRichHtml(changes.html);
      documentItem.updatedAt = u.isoNow();
    }, { reason: "edit-document" });
    if (renderList !== false) renderDocumentList();
  }

  function saveDocumentEditor(options) {
    const editor = $("#documentEditor");
    if (!editor) return;
    const documentId = editor.dataset.documentEditor;
    const sanitized = u.sanitizeRichHtml(editor.innerHTML);
    updateDocument(documentId, { html: sanitized }, options && options.renderList === false ? false : true);
    if (options && options.normalizeEditor && editor.innerHTML !== sanitized) editor.innerHTML = sanitized;
  }

  function openDocumentMenu(documentId, anchor) {
    const documentItem = state().workspace.documents.find(function (item) { return item.id === documentId; });
    if (!documentItem) return;
    components.openMenu(anchor, [
      { icon: "↑", label: "Move up", action: function () { reorderDocument(documentId, -1); } },
      { icon: "↓", label: "Move down", action: function () { reorderDocument(documentId, 1); } },
      { separator: true },
      { icon: "×", label: "Delete document", danger: true, action: function () { requestDeleteDocument(documentId); } }
    ], { focus: true });
  }

  function reorderDocument(documentId, delta, targetId) {
    storage.mutate(function (next) {
      const items = next.workspace.documents.slice().sort(function (a, b) { return a.order - b.order; });
      const from = items.findIndex(function (item) { return item.id === documentId; });
      const to = targetId ? items.findIndex(function (item) { return item.id === targetId; }) : from + delta;
      if (from < 0 || to < 0 || to >= items.length || from === to) return;
      const moved = items.splice(from, 1)[0];
      items.splice(to, 0, moved);
      items.forEach(function (item, index) { item.order = index; });
      next.workspace.documents = items;
    }, { reason: "reorder-document" });
    renderDocumentList();
    $("[data-document-id='" + u.cssEscape(documentId) + "']")?.focus({ preventScroll: true });
  }

  async function requestDeleteDocument(documentId) {
    const documentItem = state().workspace.documents.find(function (item) { return item.id === documentId; });
    if (!documentItem) return;
    const accepted = await components.confirm({ title: "Delete “" + documentItem.title + "”?", message: "This document and its rich-text content will be removed. A deletion marker will be kept for safe sync merging.", confirmLabel: "Delete document", danger: true });
    if (!accepted) return;
    storage.mutate(function (next) {
      const index = next.workspace.documents.findIndex(function (item) { return item.id === documentId; });
      if (index < 0) return;
      next.workspace.documents.splice(index, 1);
      next.meta.tombstones.documents = next.meta.tombstones.documents.filter(function (item) { return item.id !== documentId; }).concat({ id: documentId, deletedAt: u.isoNow() });
      next.workspace.documents.forEach(function (item, order) { item.order = order; });
      next.ui.selectedDocumentId = next.workspace.documents[Math.min(index, next.workspace.documents.length - 1)]?.id || "";
      next.ui.navigation.mobileScreen = "list";
    }, { reason: "delete-document" });
    renderDocuments(); renderPanels(); renderGlobalSearchResults();
    components.toast("The document was deleted.", { title: "Document removed", kind: "info" });
  }

  function filteredRoadmap(overrides) {
    const moduleState = state().modules.roadmap;
    const filters = Object.assign({ search: moduleState.search, state: moduleState.state, sortBy: moduleState.sortBy, sortDirection: moduleState.sortDirection }, overrides || {});
    const query = String(filters.search || "").trim().toLowerCase();
    const direction = filters.sortDirection === "desc" ? -1 : 1;
    const priority = function (item) { return Number(item.priority) || 99; };
    return config.roadmap.filter(function (item) {
      return (filters.state === "all" || item.state === filters.state) && (!query || (item.title + " " + item.description + " " + item.target).toLowerCase().includes(query));
    }).slice().sort(function (a, b) {
      let compared = 0;
      if (filters.sortBy === "priority") compared = priority(a) - priority(b);
      else if (filters.sortBy === "effort") compared = a.effort - b.effort;
      else if (filters.sortBy === "age") compared = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      else if (filters.sortBy === "target") compared = String(a.target).localeCompare(String(b.target), undefined, { numeric: true });
      else compared = a.title.localeCompare(b.title);
      return compared * direction || a.title.localeCompare(b.title);
    });
  }

  function roadmapCard(item) {
    return '<article class="roadmap-card" data-roadmap-state="' + item.state + '"><header><span class="roadmap-state">' + u.escapeHtml(item.state) + '</span><span class="priority-chip">P' + item.priority + '</span></header><h3>' + u.escapeHtml(item.title) + '</h3><p>' + u.escapeHtml(item.description) + '</p><footer><span>Target ' + u.escapeHtml(item.target) + '</span><span>Effort ' + item.effort + '/4</span><span>Added ' + u.dateLabel(item.createdAt) + "</span></footer></article>";
  }

  function renderRoadmap() {
    setInputValue($("#roadmapSearch"), state().modules.roadmap.search);
    $("#roadmapState").value = state().modules.roadmap.state;
    $("#roadmapSort").value = state().modules.roadmap.sortBy;
    const items = filteredRoadmap();
    $("#roadmapCount").textContent = items.length + " item" + (items.length === 1 ? "" : "s");
    $("#roadmapList").innerHTML = items.length ? items.map(roadmapCard).join("") : emptyState("No roadmap matches", "Try another search or view.", "Clear roadmap filters", "clear-roadmap-filters");
  }

  function globalSearchMatches(query) {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const results = [];
    state().workspace.records.forEach(function (record) {
      if ((record.title + " " + record.summary + " " + record.tags.join(" ")).toLowerCase().includes(needle)) results.push({ type: "record", id: record.id, title: record.title, meta: "Record · " + record.category });
    });
    if (config.features.documents) state().workspace.documents.forEach(function (documentItem) {
      if ((documentItem.title + " " + u.stripHtml(documentItem.html)).toLowerCase().includes(needle)) results.push({ type: "document", id: documentItem.id, title: documentItem.title, meta: "Document" });
    });
    config.help.forEach(function (topic) {
      if ((topic.title + " " + topic.keywords + " " + u.stripHtml(topic.html)).toLowerCase().includes(needle)) results.push({ type: "help", id: topic.id, title: topic.title, meta: "Help · " + topic.section });
    });
    if (config.features.roadmap) config.roadmap.forEach(function (item) {
      if ((item.title + " " + item.description).toLowerCase().includes(needle)) results.push({ type: "roadmap", id: item.id, title: item.title, meta: "Roadmap · " + item.state });
    });
    return results.slice(0, 10);
  }

  function renderGlobalSearchResults() {
    const container = $("#globalSearchResults");
    const query = state().ui.search;
    if (!query || document.activeElement !== $("#globalSearch")) { container.hidden = true; return; }
    const results = globalSearchMatches(query);
    container.hidden = false;
    container.innerHTML = results.length ? results.map(function (result, index) {
      return '<button type="button" role="option" id="global-result-' + index + '" data-search-type="' + result.type + '" data-search-id="' + u.escapeHtml(result.id) + '"><span><strong>' + u.escapeHtml(result.title) + '</strong><small>' + u.escapeHtml(result.meta) + "</small></span><span aria-hidden=\"true\">→</span></button>";
    }).join("") : '<div class="search-empty">No matches across records, documents, help, or roadmap.</div>';
  }

  function activateGlobalSearchResult(type, id) {
    if (type === "record") { switchModule("records"); selectRecord(id); }
    else if (type === "document") { switchModule("documents"); selectDocument(id); }
    else if (type === "help") { openSupport("help"); setInputValue($("#helpSearch"), config.help.find(function (topic) { return topic.id === id; })?.title || ""); renderHelp(); }
    else if (type === "roadmap") { switchModule("roadmap"); storage.mutate(function (next) { next.modules.roadmap.search = config.roadmap.find(function (item) { return item.id === id; })?.title || ""; }, { reason: "roadmap-search" }); renderRoadmap(); }
    $("#globalSearchResults").hidden = true;
  }

  function switchModule(moduleId) {
    if (!activeModuleEnabled(moduleId)) return;
    saveDocumentEditor({ renderList: false, normalizeEditor: true });
    storage.mutate(function (next) {
      next.ui.activeModule = moduleId;
      next.ui.navigation.mobileScreen = "list";
    }, { reason: "switch-module" });
    renderNavigation(); renderPanels();
    if (moduleId === "records") renderRecords();
    else if (moduleId === "documents") renderDocuments();
    else renderRoadmap();
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#" + moduleId);
    requestAnimationFrame(function () {
      const list = moduleId === "documents" ? $("#documentList") : $("#recordList");
      if (list) list.scrollTop = moduleId === "documents" ? state().ui.navigation.documentsScrollTop : state().ui.navigation.recordsScrollTop;
    });
  }

  function openSupport(tab, trigger) {
    const chosen = tab || state().ui.supportTab || "settings";
    switchSupportTab(chosen);
    components.openDialog("#supportDialog", { trigger: trigger, focus: "[data-support-tab='" + chosen + "']" });
    renderSupport();
  }

  function switchSupportTab(tab) {
    if (tab === "developer" && !state().preferences.controls.developerMode) tab = "settings";
    storage.mutate(function (next) { next.ui.supportTab = tab; }, { touch: false, reason: "support-tab" });
    $$('[data-support-tab]').forEach(function (button) {
      const selected = button.dataset.supportTab === tab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $$('[data-support-panel]').forEach(function (panel) { panel.hidden = panel.dataset.supportPanel !== tab; });
    if (tab === "help") renderHelp();
    else if (tab === "releases") renderReleases();
    else if (tab === "shortcuts") renderShortcuts();
    else if (tab === "roadmap") renderSupportRoadmap();
    else if (tab === "developer") renderDeveloper();
    else renderSettings();
    $(".support-panels")?.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderSettings() {
    const preferences = state().preferences;
    const appearance = preferences.appearance;
    $$('[data-theme-mode]').forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.themeMode === appearance.mode)); });
    $("#themePresets").innerHTML = config.themes.map(function (theme) {
      const selected = appearance.preset === theme.id;
      return '<button type="button" class="theme-preset" data-theme-preset="' + theme.id + '" aria-pressed="' + selected + '"><span class="theme-swatches" aria-hidden="true"><i style="--swatch:' + theme.accent + '"></i><i style="--swatch:' + theme.accent2 + '"></i><i style="--swatch:' + theme.success + '"></i><i style="--swatch:' + theme.warning + '"></i></span><strong>' + u.escapeHtml(theme.label) + "</strong></button>";
    }).join("");
    ["accent", "accent2", "success", "warning", "danger"].forEach(function (key) {
      setInputValue($("[data-color-setting='" + key + "']"), appearance[key]);
      setInputValue($("[data-color-text='" + key + "']"), appearance[key]);
    });
    setInputValue($("#appTextScale"), Math.round(appearance.textScale * 100));
    $("#appTextScaleValue").textContent = Math.round(appearance.textScale * 100) + "%";
    setInputValue($("#readingTextScale"), Math.round(appearance.readingScale * 100));
    $("#readingTextScaleValue").textContent = Math.round(appearance.readingScale * 100) + "%";
    $$('[data-button-style]').forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.buttonStyle === preferences.controls.buttonStyle)); });
    $("#motionPreference").value = appearance.reducedMotion;
    $("#hintsToggle").setAttribute("aria-pressed", String(preferences.hints.enabled));
    $("#hintsToggle").textContent = preferences.hints.enabled ? "On" : "Off";
    renderPanels();
    renderSyncSettings();
  }

  function renderSyncSettings() {
    if (!config.features.cloudSync) { $("#cloudSyncSettings").hidden = true; return; }
    const cloud = state().modules.cloudSync;
    const info = sync.getInfo();
    $("#cloudSyncSettings").hidden = false;
    $("#syncSettingsState").textContent = info.title;
    $("#syncSettingsState").dataset.kind = info.kind;
    $("#syncSettingsSummary").innerHTML = '<span aria-hidden="true">' + u.escapeHtml(info.icon) + '</span><span><strong>' + u.escapeHtml(info.title) + '</strong><small>' + u.escapeHtml(info.message) + (info.checkedAt ? " Checked " + u.relativeTime(info.checkedAt) + "." : "") + "</small></span>";
    setInputValue($("#syncOwner"), cloud.owner);
    setInputValue($("#syncRepo"), cloud.repo);
    setInputValue($("#syncBranch"), cloud.branch);
    setInputValue($("#syncPath"), cloud.path);
    $("#syncRememberToken").checked = cloud.rememberToken;
    $("#storedTokenLabel").textContent = storage.hasSecret() ? "A token is stored; enter a value only to replace it." : "Required";
    $("#syncToken").value = "";
    $("#syncAdvancedFields").open = cloud.advancedOpen || !sync.configured();
    $("#syncNowSettingsButton").disabled = info.busy || info.state === "offline";
    $("#syncNowSettingsButton").textContent = info.action;
    $("#forgetSyncButton").disabled = !sync.configured() && !cloud.owner;
  }

  function renderHelp() {
    const query = String($("#helpSearch")?.value || "").trim().toLowerCase();
    const topics = config.help.filter(function (topic) {
      return !query || (topic.title + " " + topic.section + " " + topic.keywords + " " + u.stripHtml(topic.html)).toLowerCase().includes(query);
    });
    $("#helpResultCount").textContent = topics.length + " topic" + (topics.length === 1 ? "" : "s");
    const groups = {};
    topics.forEach(function (topic) { (groups[topic.section] = groups[topic.section] || []).push(topic); });
    $("#helpContent").innerHTML = topics.length ? Object.keys(groups).map(function (section) {
      return '<section class="help-section"><h3>' + u.escapeHtml(section) + '</h3>' + groups[section].map(function (topic) { return '<article id="help-' + topic.id + '"><h4>' + u.escapeHtml(topic.title) + "</h4>" + topic.html + "</article>"; }).join("") + "</section>";
    }).join("") + renderSupportLinks() : emptyState("No help matches", "Try a shorter or broader search.", "Clear help search", "clear-help-search");
  }

  function renderSupportLinks() {
    const links = [config.identity.repository].concat(config.identity.support || []).filter(function (item) { return u.safeUrl(item.url); });
    if (!links.length) return "";
    return '<section class="help-section"><h3>Support links</h3><div class="support-links">' + links.map(function (item) { return '<button type="button" class="safe-link-button" data-open-url="' + u.escapeHtml(u.safeUrl(item.url)) + '">' + u.escapeHtml(item.label) + ' <span aria-hidden="true">↗</span></button>'; }).join("") + "</div></section>";
  }

  function releaseCard(release) {
    const section = function (title, values) {
      return values && values.length ? '<div class="release-section"><h5>' + title + "</h5><ul>" + values.map(function (value) { return "<li>" + u.escapeHtml(value) + "</li>"; }).join("") + "</ul></div>" : "";
    };
    return '<article class="release-card"><header><div><span class="version-pill">v' + u.escapeHtml(release.version) + '</span><h4>' + u.escapeHtml(release.title) + '</h4></div><time datetime="' + u.escapeHtml(release.date) + '">' + u.dateLabel(release.date) + '</time></header><p>' + u.escapeHtml(release.summary) + '</p><div class="release-sections">' + section("Features", release.features) + section("Improvements", release.improvements) + section("Fixes", release.fixes) + section("Known issues", release.knownIssues) + "</div></article>";
  }

  function renderReleases() {
    $$('[data-version-view]').forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.versionView === versionView)); });
    if (versionView === "released") $("#releaseContent").innerHTML = config.releases.map(releaseCard).join("");
    else {
      const items = config.roadmap.filter(function (item) { return item.state === versionView; });
      $("#releaseContent").innerHTML = items.length ? items.map(roadmapCard).join("") : emptyState("Nothing here", "This demonstration view has no matching entries.");
    }
  }

  function renderShortcuts() {
    const groups = {};
    SHORTCUTS.forEach(function (shortcut) { (groups[shortcut.group] = groups[shortcut.group] || []).push(shortcut); });
    $("#shortcutContent").innerHTML = Object.keys(groups).map(function (group) {
      return '<section><h3>' + group + "</h3>" + groups[group].map(function (shortcut) { return '<div class="shortcut-row"><kbd>' + u.escapeHtml(shortcut.keys) + '</kbd><span>' + u.escapeHtml(shortcut.label) + "</span></div>"; }).join("") + "</section>";
    }).join("");
  }

  function renderSupportRoadmap() {
    const search = $("#supportRoadmapSearch").value;
    const roadmapState = $("#supportRoadmapState").value || "all";
    const items = filteredRoadmap({ search: search, state: roadmapState });
    $("#supportRoadmapList").innerHTML = items.length ? items.map(roadmapCard).join("") : emptyState("No roadmap matches", "Try another search or view.");
  }

  async function renderDeveloper() {
    if (!state().preferences.controls.developerMode) return;
    const usage = await storage.usage();
    const info = sync.getInfo();
    const device = pwa.detectDevice();
    const breakpoint = window.innerWidth < 700 ? "Mobile" : window.innerWidth < 960 ? "Tablet" : "Desktop";
    const recovery = storage.recoveryInfo();
    const diagnostics = [
      ["State model", "v" + state().schemaVersion],
      ["Application", "v" + config.identity.version + " · build " + config.identity.buildId],
      ["Device", device.label],
      ["Layout", breakpoint + " · " + window.innerWidth + "×" + window.innerHeight],
      ["State size", u.formatBytes(usage.stateBytes)],
      ["Browser storage", usage.quota ? u.formatBytes(usage.usage) + " of " + u.formatBytes(usage.quota) : (usage.persistentStorageAvailable ? "Available" : "Unavailable")],
      ["Modules", Object.keys(config.features).filter(function (key) { return config.features[key]; }).join(", ")],
      ["Theme", document.documentElement.dataset.theme + " · " + state().preferences.appearance.preset],
      ["Sync", info.title + (info.checkedAt ? " · checked " + u.relativeTime(info.checkedAt) : "")],
      ["Recovery", recovery ? u.dateLabel(recovery.createdAt) + " · " + recovery.reason : "None"]
    ];
    $("#developerDiagnostics").innerHTML = diagnostics.map(function (row) { return '<div><dt>' + u.escapeHtml(row[0]) + '</dt><dd>' + u.escapeHtml(row[1]) + "</dd></div>"; }).join("");
    $("#developerState").textContent = JSON.stringify(model.exportEnvelope(state()), null, 2);
    $("#restoreRecoveryButton").disabled = !recovery;
  }

  function renderSupport() {
    $("#developerTab").hidden = !state().preferences.controls.developerMode || !config.features.developerTools;
    switchSupportTab(state().ui.supportTab);
  }

  function openNewForActive(trigger) {
    if (state().ui.activeModule === "documents") openDocumentDialog(trigger);
    else if (state().ui.activeModule === "records") openRecordDialog(trigger);
  }

  function openRecordDialog(trigger) {
    if (state().workspace.records.length >= config.controls.maxRecords) {
      components.message("Record limit reached", "Export a backup and remove records before adding more.", { trigger: trigger });
      return;
    }
    $("#recordCreateForm").reset();
    $("#newRecordCategory").value = "General";
    $("#newRecordStatus").innerHTML = config.statuses.map(function (status) { return '<option value="' + status.id + '">' + u.escapeHtml(status.label) + "</option>"; }).join("");
    components.openDialog("#recordDialog", { trigger: trigger, focus: "#newRecordTitle" });
  }

  function openDocumentDialog(trigger) {
    if (state().workspace.documents.length >= config.controls.maxDocuments) {
      components.message("Document limit reached", "Export a backup and remove documents before adding more.", { trigger: trigger });
      return;
    }
    $("#documentCreateForm").reset();
    components.openDialog("#documentDialog", { trigger: trigger, focus: "#newDocumentTitle" });
  }

  function togglePanel(key) {
    storage.mutate(function (next) {
      const other = key === "listVisible" ? "detailVisible" : "listVisible";
      next.ui.panels[key] = !next.ui.panels[key];
      if (!next.ui.panels[key] && !next.ui.panels[other]) next.ui.panels[other] = true;
    }, { reason: "panel-visibility" });
    renderPanels(); renderSettings();
  }

  function mobileBack() {
    storage.mutate(function (next) { next.ui.navigation.mobileScreen = "list"; }, { touch: false, reason: "mobile-back" });
    renderPanels();
    requestAnimationFrame(function () {
      const id = state().ui.activeModule === "documents" ? state().ui.selectedDocumentId : state().ui.selectedRecordId;
      const selector = state().ui.activeModule === "documents" ? "[data-document-id='" : "[data-record-id='";
      $(selector + u.cssEscape(id) + "']")?.focus({ preventScroll: true });
    });
  }

  function clearRecordFilters() {
    storage.mutate(function (next) {
      next.ui.search = "";
      next.ui.records.statusFilter = "all";
      next.ui.records.categoryFilter = "all";
      next.ui.records.favoritesOnly = false;
    }, { reason: "clear-record-filters" });
    renderHeader(); renderRecords(); renderGlobalSearchResults();
  }

  function clearRoadmapFilters() {
    storage.mutate(function (next) { next.modules.roadmap.search = ""; next.modules.roadmap.state = "all"; next.modules.roadmap.sortBy = "priority"; }, { reason: "clear-roadmap-filters" });
    renderRoadmap();
  }

  async function resetPreferences() {
    const accepted = await components.confirm({ title: "Reset preferences?", message: "Appearance, filters, panel layout, view state, and dismissed hints will return to defaults. Records and documents will be preserved.", confirmLabel: "Reset preferences", danger: true });
    if (!accepted) return;
    storage.replace(model.resetPreferences(state()), { recoveryReason: "Before resetting preferences", reason: "reset-preferences", touch: false });
    renderAll();
    components.toast("Preferences were reset; records and documents were preserved.", { title: "Preferences reset", kind: "success" });
  }

  async function eraseAllData() {
    const accepted = await components.confirm({ title: "Erase all application data?", message: "This permanently removes records, documents, preferences, sync settings, the stored token, and recovery data from this browser. Export a backup first if anything should be kept.", confirmLabel: "Erase everything", cancelLabel: "Keep my data", danger: true });
    if (!accepted) return;
    storage.clearAll();
    renderAll();
    components.closeDialog("#supportDialog", "erased");
    $("#assertiveStatus").textContent = "All application data was erased.";
    components.toast("All application data was erased from this browser.", { title: "Data erased", kind: "info", duration: 5000 });
  }

  async function forgetSync() {
    const accepted = await components.confirm({ title: "Forget GitHub on this device?", message: "Repository settings, sync history, and the stored token will be removed. Local records and documents will stay here.", confirmLabel: "Forget GitHub", danger: true });
    if (!accepted) return;
    await sync.forget();
    renderSyncSettings(); renderSyncStatus();
    components.toast("GitHub settings and token were removed from this device.", { title: "Sync disconnected", kind: "success" });
  }

  function syncFormValues() {
    return {
      owner: $("#syncOwner").value,
      repo: $("#syncRepo").value,
      branch: $("#syncBranch").value,
      path: $("#syncPath").value,
      token: $("#syncToken").value,
      rememberToken: $("#syncRememberToken").checked
    };
  }

  async function saveSyncSettings() {
    try {
      sync.saveConfiguration(syncFormValues());
      $("#syncToken").value = "";
      state().modules.cloudSync.advancedOpen = false;
      renderSyncSettings(); renderSyncStatus();
      components.toast("The GitHub connection settings were saved.", { title: "Sync configured", kind: "success" });
      sync.check(true);
    } catch (error) {
      components.message("Settings not saved", error.message || "Check the GitHub settings and try again.", { trigger: $("#saveSyncButton") });
    }
  }

  async function testSyncSettings() {
    try {
      components.setLoading(true, "Testing GitHub…");
      const result = await sync.testConnection(syncFormValues());
      if (result) components.message("Connection succeeded", result.message, { trigger: $("#testSyncButton") });
    } catch (error) {
      components.message("Connection failed", error.message || "GitHub could not be reached with these settings.", { trigger: $("#testSyncButton") });
    } finally {
      components.setLoading(false);
      renderSyncSettings(); renderSyncStatus();
    }
  }

  async function restoreRecovery() {
    const info = storage.recoveryInfo();
    if (!info) return;
    const accepted = await components.confirm({ title: "Restore recovery copy?", message: "Restore the copy saved " + u.relativeTime(info.createdAt) + " (“" + info.reason + "”). Current data will be replaced.", confirmLabel: "Restore recovery", danger: true });
    if (!accepted) return;
    storage.restoreRecovery(); renderAll();
    components.toast("The recovery copy was restored.", { title: "Recovery complete", kind: "success" });
  }

  async function restoreDemoData() {
    const accepted = await components.confirm({ title: "Reset demonstration data?", message: "Records and documents will be replaced with the small neutral demonstration set. Preferences and GitHub configuration will stay unchanged.", confirmLabel: "Reset demo data", danger: true });
    if (!accepted) return;
    const demo = model.createDefaultState({ demo: true });
    storage.saveRecovery("Before resetting demonstration data");
    storage.mutate(function (next) {
      next.workspace.records = demo.workspace.records;
      next.workspace.documents = demo.workspace.documents;
      next.meta.tombstones = { records: [], documents: [] };
      next.ui.selectedRecordId = demo.ui.selectedRecordId;
      next.ui.selectedDocumentId = demo.ui.selectedDocumentId;
      next.ui.activeModule = "records";
      next.ui.navigation.mobileScreen = "list";
    }, { reason: "restore-demo" });
    renderAll();
  }

  function runMigrationFixtures() {
    const v1 = {
      stateVersion: 1,
      title: "Legacy Workspace",
      items: [{ id: "legacy-item", name: "Legacy item", description: "Preserved", type: "Old category", done: true }],
      notes: ["A legacy plain-text note"],
      theme: "dark"
    };
    const v2 = {
      schemaVersion: 2,
      workspace: { title: "Version Two", records: [{ id: "v2-item", title: "Version two record", status: "active" }], documents: [] },
      preferences: { theme: "light", accent: "#315f73" },
      layout: { splitRatio: 0.45 }, filters: {}, selection: {}, modules: {}
    };
    try {
      const first = model.prepare(v1);
      const second = model.prepare(v2);
      const ok = first.state.workspace.records[0].title === "Legacy item" && first.state.workspace.documents.length === 1 && second.state.ui.panels.listRatio === 0.45;
      components.message(ok ? "Migration fixtures passed" : "Migration fixtures failed", ok ? "v1→v2→v3 and v2→v3 preserved the expected sample content and layout values." : "A fixture did not produce the expected normalized result.", { trigger: $("#migrationTestButton") });
    } catch (error) {
      components.message("Migration fixtures failed", error.message || "A migration threw an unexpected error.", { trigger: $("#migrationTestButton") });
    }
  }

  function toggleDeveloperMode(force) {
    if (!config.features.developerTools) return;
    storage.mutate(function (next) { next.preferences.controls.developerMode = typeof force === "boolean" ? force : !next.preferences.controls.developerMode; }, { reason: "developer-mode" });
    $("#developerTab").hidden = !state().preferences.controls.developerMode;
    if (state().preferences.controls.developerMode) {
      components.toast("Developer Mode is available in Settings & Help.", { title: "Developer Mode on", kind: "info" });
      openSupport("developer");
    } else {
      if (state().ui.supportTab === "developer") switchSupportTab("settings");
      components.toast("Developer tools are hidden.", { title: "Developer Mode off", kind: "info" });
    }
  }

  function applyEditorCommand(command, value) {
    const editor = $("#documentEditor");
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value || null);
    saveDocumentEditor({ renderList: true });
  }

  function saveCurrentSelection() {
    const selection = window.getSelection();
    savedDocumentSelection = selection && selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  }

  function restoreCurrentSelection() {
    if (!savedDocumentSelection) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedDocumentSelection);
  }

  function handleAction(action, trigger) {
    if (action === "new") openNewForActive(trigger);
    else if (action === "new-record") openRecordDialog(trigger);
    else if (action === "new-document") openDocumentDialog(trigger);
    else if (action === "clear-record-filters") clearRecordFilters();
    else if (action === "clear-document-search") { storage.mutate(function (next) { next.ui.documents.search = ""; }, { reason: "document-search" }); renderDocuments(); }
    else if (action === "clear-roadmap-filters") clearRoadmapFilters();
    else if (action === "clear-help-search") { $("#helpSearch").value = ""; renderHelp(); }
  }

  function bindDivider(divider) {
    let active = false;
    function setFromClientX(clientX, final) {
      const grid = divider.closest("[data-workspace-grid]");
      const rect = grid.getBoundingClientRect();
      const ratio = u.clamp((clientX - rect.left) / rect.width, 0.25, 0.7, state().ui.panels.listRatio);
      storage.mutate(function (next) { next.ui.panels.listRatio = ratio; }, { touch: final, save: final, reason: "panel-resize" });
      renderPanels();
    }
    divider.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      active = true;
      divider.setPointerCapture?.(event.pointerId);
      document.documentElement.classList.add("resizing-panels");
      event.preventDefault();
    });
    divider.addEventListener("pointermove", function (event) { if (active) setFromClientX(event.clientX, false); });
    ["pointerup", "pointercancel"].forEach(function (name) {
      divider.addEventListener(name, function (event) {
        if (!active) return;
        active = false;
        document.documentElement.classList.remove("resizing-panels");
        setFromClientX(event.clientX, true);
      });
    });
    divider.addEventListener("keydown", function (event) {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const value = event.key === "Home" ? 0.25 : event.key === "End" ? 0.7 : state().ui.panels.listRatio + (event.key === "ArrowRight" ? 0.02 : -0.02);
      storage.mutate(function (next) { next.ui.panels.listRatio = u.clamp(value, 0.25, 0.7, 0.38); }, { reason: "panel-resize" });
      renderPanels();
    });
  }

  function bindRecordList() {
    const list = $("#recordList");
    list.addEventListener("click", function (event) {
      const menu = event.target.closest("[data-record-menu]");
      if (menu) { openRecordMenu(menu.dataset.recordMenu, menu); return; }
      const card = event.target.closest("[data-record-id]");
      if (!card) return;
      if (state().ui.selectedRecordId === card.dataset.recordId) toggleRecordExpanded(card.dataset.recordId);
      else selectRecord(card.dataset.recordId);
    });
    list.addEventListener("contextmenu", function (event) {
      const card = event.target.closest("[data-record-id]");
      if (!card) return;
      event.preventDefault(); openRecordMenu(card.dataset.recordId, card.querySelector("[data-record-menu]") || card);
    });
    list.addEventListener("keydown", function (event) {
      const card = event.target.closest("[data-record-id]");
      if (!card) return;
      if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); reorderRecord(card.dataset.recordId, event.key === "ArrowUp" ? -1 : 1); return; }
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (state().ui.selectedRecordId === card.dataset.recordId) toggleRecordExpanded(card.dataset.recordId); else selectRecord(card.dataset.recordId); return; }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const cards = $$("[data-record-id]", list);
        const index = cards.indexOf(card);
        cards[(index + (event.key === "ArrowDown" ? 1 : -1) + cards.length) % cards.length]?.focus();
      }
    });
    list.addEventListener("dragstart", function (event) {
      const card = event.target.closest("[data-record-id]");
      if (!card) return;
      draggedRecordId = card.dataset.recordId;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedRecordId);
    });
    list.addEventListener("dragover", function (event) { if (event.target.closest("[data-record-id]")) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } });
    list.addEventListener("drop", function (event) {
      const target = event.target.closest("[data-record-id]");
      if (!target || !draggedRecordId) return;
      event.preventDefault(); reorderRecord(draggedRecordId, 0, target.dataset.recordId);
    });
    list.addEventListener("dragend", function () { draggedRecordId = ""; $$(".dragging", list).forEach(function (node) { node.classList.remove("dragging"); }); });
  }

  function bindDocumentList() {
    const list = $("#documentList");
    list.addEventListener("click", function (event) {
      const menu = event.target.closest("[data-document-menu]");
      if (menu) { openDocumentMenu(menu.dataset.documentMenu, menu); return; }
      const card = event.target.closest("[data-document-id]");
      if (card) selectDocument(card.dataset.documentId);
    });
    list.addEventListener("contextmenu", function (event) {
      const card = event.target.closest("[data-document-id]");
      if (!card) return;
      event.preventDefault(); openDocumentMenu(card.dataset.documentId, card.querySelector("[data-document-menu]") || card);
    });
    list.addEventListener("keydown", function (event) {
      const card = event.target.closest("[data-document-id]");
      if (!card) return;
      if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); reorderDocument(card.dataset.documentId, event.key === "ArrowUp" ? -1 : 1); return; }
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectDocument(card.dataset.documentId); return; }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const cards = $$("[data-document-id]", list);
        const index = cards.indexOf(card);
        cards[(index + (event.key === "ArrowDown" ? 1 : -1) + cards.length) % cards.length]?.focus();
      }
    });
    list.addEventListener("dragstart", function (event) {
      const card = event.target.closest("[data-document-id]");
      if (!card) return;
      draggedDocumentId = card.dataset.documentId;
      card.classList.add("dragging");
      event.dataTransfer.setData("text/plain", draggedDocumentId);
    });
    list.addEventListener("dragover", function (event) { if (event.target.closest("[data-document-id]")) event.preventDefault(); });
    list.addEventListener("drop", function (event) {
      const target = event.target.closest("[data-document-id]");
      if (!target || !draggedDocumentId) return;
      event.preventDefault(); reorderDocument(draggedDocumentId, 0, target.dataset.documentId);
    });
    list.addEventListener("dragend", function () { draggedDocumentId = ""; $$(".dragging", list).forEach(function (node) { node.classList.remove("dragging"); }); });
  }

  function bindSupportEvents() {
    const dialog = $("#supportDialog");
    dialog.addEventListener("click", function (event) {
      const tab = event.target.closest("[data-support-tab]");
      if (tab) { switchSupportTab(tab.dataset.supportTab); return; }
      const mode = event.target.closest("[data-theme-mode]");
      if (mode) {
        storage.mutate(function (next) { next.preferences.appearance.mode = mode.dataset.themeMode; }, { reason: "appearance" }); applyAppearance(); renderSettings(); return;
      }
      const presetButton = event.target.closest("[data-theme-preset]");
      if (presetButton) {
        const theme = config.themes.find(function (item) { return item.id === presetButton.dataset.themePreset; });
        if (theme) storage.mutate(function (next) { Object.assign(next.preferences.appearance, { preset: theme.id, accent: theme.accent, accent2: theme.accent2, success: theme.success, warning: theme.warning, danger: theme.danger }); }, { reason: "appearance" });
        applyAppearance(); renderSettings(); return;
      }
      const style = event.target.closest("[data-button-style]");
      if (style) { storage.mutate(function (next) { next.preferences.controls.buttonStyle = style.dataset.buttonStyle; }, { reason: "button-style" }); applyAppearance(); renderSettings(); return; }
      const versionButton = event.target.closest("[data-version-view]");
      if (versionButton) { versionView = versionButton.dataset.versionView; renderReleases(); return; }
    });
    dialog.addEventListener("keydown", function (event) {
      const tab = event.target.closest("[role='tab']");
      if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const tabs = $$('[data-support-tab]:not([hidden])');
      const index = tabs.indexOf(tab);
      const target = event.key === "Home" ? tabs[0] : event.key === "End" ? tabs[tabs.length - 1] : tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      target.focus(); switchSupportTab(target.dataset.supportTab);
    });
    dialog.addEventListener("change", function (event) {
      if (event.target.matches("[data-color-setting]")) {
        const key = event.target.dataset.colorSetting;
        storage.mutate(function (next) { next.preferences.appearance[key] = u.normalizeColor(event.target.value, next.preferences.appearance[key]); }, { reason: "appearance" }); applyAppearance(); renderSettings();
      }
    });
    dialog.addEventListener("blur", function (event) {
      if (!event.target.matches("[data-color-text]")) return;
      const key = event.target.dataset.colorText;
      const previous = state().preferences.appearance[key];
      const normalized = u.normalizeColor(event.target.value, "");
      if (!normalized) { event.target.value = previous; components.toast("Use a six-digit hex value such as #315f73.", { title: "Color not changed", kind: "warning" }); return; }
      storage.mutate(function (next) { next.preferences.appearance[key] = normalized; }, { reason: "appearance" }); applyAppearance(); renderSettings();
    }, true);
    $("#appTextScale").addEventListener("input", function (event) { storage.mutate(function (next) { next.preferences.appearance.textScale = Number(event.target.value) / 100; }, { reason: "appearance" }); applyAppearance(); $("#appTextScaleValue").textContent = event.target.value + "%"; });
    $("#readingTextScale").addEventListener("input", function (event) { storage.mutate(function (next) { next.preferences.appearance.readingScale = Number(event.target.value) / 100; }, { reason: "appearance" }); applyAppearance(); $("#readingTextScaleValue").textContent = event.target.value + "%"; });
    $("#motionPreference").addEventListener("change", function (event) { storage.mutate(function (next) { next.preferences.appearance.reducedMotion = event.target.value; }, { reason: "appearance" }); applyAppearance(); });
    $("#settingsListPanel").addEventListener("click", function () { togglePanel("listVisible"); });
    $("#settingsDetailPanel").addEventListener("click", function () { togglePanel("detailVisible"); });
    $("#hintsToggle").addEventListener("click", function () { storage.mutate(function (next) { next.preferences.hints.enabled = !next.preferences.hints.enabled; }, { reason: "hints" }); renderHeader(); renderSettings(); });
    $("#restoreHintsButton").addEventListener("click", function () { storage.mutate(function (next) { next.preferences.hints.dismissed = []; next.ui.dismissedHints = []; }, { reason: "hints" }); renderHeader(); renderSettings(); components.toast("All contextual hints are available again.", { title: "Hints restored", kind: "success" }); });
    $("#syncAdvancedFields").addEventListener("toggle", function () { storage.mutate(function (next) { next.modules.cloudSync.advancedOpen = $("#syncAdvancedFields").open; }, { touch: false, reason: "sync-settings-view" }); });
    $("#saveSyncButton").addEventListener("click", saveSyncSettings);
    $("#testSyncButton").addEventListener("click", testSyncSettings);
    $("#forgetSyncButton").addEventListener("click", forgetSync);
    $("#syncNowSettingsButton").addEventListener("click", function (event) { sync.syncNow(event.currentTarget); });
    $("#exportButton").addEventListener("click", portability.exportJson);
    $("#importButton").addEventListener("click", function () { $("#importFileInput").click(); });
    $("#resetPreferencesButton").addEventListener("click", resetPreferences);
    $("#eraseAllButton").addEventListener("click", eraseAllData);
    $("#helpSearch").addEventListener("input", renderHelp);
    $("#supportRoadmapSearch").addEventListener("input", renderSupportRoadmap);
    $("#supportRoadmapState").addEventListener("change", renderSupportRoadmap);
    $("#restoreRecoveryButton").addEventListener("click", restoreRecovery);
    $("#restoreDemoButton").addEventListener("click", restoreDemoData);
    $("#migrationTestButton").addEventListener("click", runMigrationFixtures);
    $("#disableDeveloperButton").addEventListener("click", function () { toggleDeveloperMode(false); });
  }

  function modifierHeld(event) {
    const modifier = state().preferences.controls.shortcutHintModifier;
    return modifier === "Alt" ? event.altKey : modifier === "Shift" ? event.shiftKey : event.ctrlKey;
  }

  function updateShortcutHints(event, forceOff) {
    const active = !forceOff && state().preferences.controls.shortcutHints && modifierHeld(event);
    if (active === hintModifierActive) return;
    hintModifierActive = active;
    document.documentElement.classList.toggle("shortcut-hints-visible", active);
  }

  function handleGlobalKeydown(event) {
    updateShortcutHints(event, false);
    if (event.ctrlKey && event.altKey && event.shiftKey && event.code === "KeyD") { event.preventDefault(); toggleDeveloperMode(); return; }
    if (event.key === "Escape") {
      $("#globalSearchResults").hidden = true;
      if (!$$("dialog").some(function (dialog) { return dialog.open; }) && state().ui.navigation.mobileScreen === "detail" && window.innerWidth < 700) mobileBack();
      return;
    }
    if (u.isEditableTarget(event.target)) return;
    if (!event.ctrlKey && !event.metaKey && !event.altKey && (event.key === "?" || (event.key === "/" && event.shiftKey))) {
      event.preventDefault(); openSupport("help", event.target); return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && event.key === "/") {
      event.preventDefault(); $("#globalSearch").focus(); $("#globalSearch").select(); return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "1") { event.preventDefault(); switchModule("records"); }
    else if (key === "2" && activeModuleEnabled("documents")) { event.preventDefault(); switchModule("documents"); }
    else if (key === "3" && activeModuleEnabled("roadmap")) { event.preventDefault(); switchModule("roadmap"); }
    else if (key === "n") { event.preventDefault(); openNewForActive(event.target); }
    else if (key === "s") { event.preventDefault(); sync.syncNow(event.target); }
    else if (key === "e") { event.preventDefault(); portability.exportJson(); }
  }

  function bindGeneralEvents() {
    $("#appIconButton").addEventListener("click", function (event) { pwa.openInstall(event.currentTarget); });
    $("#workspaceTitleButton").addEventListener("click", function (event) { $("#renameInput").value = state().workspace.title; components.openDialog("#renameDialog", { trigger: event.currentTarget, focus: "#renameInput" }); });
    $("#versionButton").addEventListener("click", function (event) { openSupport("releases", event.currentTarget); });
    $("#supportButton").addEventListener("click", function (event) { openSupport(state().ui.supportTab, event.currentTarget); });
    $("#newItemButton").addEventListener("click", function (event) { openNewForActive(event.currentTarget); });
    $("#floatingAddButton").addEventListener("click", function (event) { openNewForActive(event.currentTarget); });
    $("#syncToolbarButton").addEventListener("click", function (event) { sync.syncNow(event.currentTarget); });
    $("#floatingStatusButton").addEventListener("click", function (event) { if (sync.configured()) sync.syncNow(event.currentTarget); else openSupport("settings", event.currentTarget); });
    $("#toggleListPanelButton").addEventListener("click", function () { togglePanel("listVisible"); });
    $("#toggleDetailPanelButton").addEventListener("click", function () { togglePanel("detailVisible"); });
    $("#moduleNav").addEventListener("click", function (event) { const button = event.target.closest("[data-module]"); if (button) switchModule(button.dataset.module); });
    document.addEventListener("click", function (event) {
      const action = event.target.closest("[data-action]");
      if (action) handleAction(action.dataset.action, action);
      const dismissHint = event.target.closest("[data-dismiss-hint]");
      if (dismissHint) { storage.mutate(function (next) { next.preferences.hints.dismissed = Array.from(new Set(next.preferences.hints.dismissed.concat(dismissHint.dataset.dismissHint))); }, { reason: "dismiss-hint" }); renderHeader(); }
      if (event.target.closest("[data-dismiss-release]")) { storage.mutate(function (next) { next.ui.seenReleaseVersion = config.releases[0].version; }, { reason: "release-seen" }); renderHeader(); }
      if (event.target.closest("[data-open-releases]")) openSupport("releases", event.target.closest("[data-open-releases]"));
      const safeLink = event.target.closest("[data-open-url]");
      if (safeLink && !u.safeExternalOpen(safeLink.dataset.openUrl)) components.toast("That external address is not allowed.", { title: "Link unavailable", kind: "warning" });
      if (event.target.closest("[data-mobile-back]")) mobileBack();
    });
    $("#globalSearch").addEventListener("input", function (event) {
      storage.mutate(function (next) { next.ui.search = u.cleanLine(event.target.value, 200); }, { reason: "global-search" });
      if (state().ui.activeModule === "records") renderRecordList();
      else if (state().ui.activeModule === "documents") renderDocumentList();
      renderGlobalSearchResults();
    });
    $("#globalSearch").addEventListener("focus", renderGlobalSearchResults);
    $("#globalSearch").addEventListener("keydown", function (event) {
      const results = $$("button[role='option']", $("#globalSearchResults"));
      if (event.key === "ArrowDown" && results.length) { event.preventDefault(); results[0].focus(); }
      if (event.key === "Escape") { $("#globalSearchResults").hidden = true; event.target.select(); }
    });
    $("#globalSearchResults").addEventListener("click", function (event) { const result = event.target.closest("[data-search-type]"); if (result) activateGlobalSearchResult(result.dataset.searchType, result.dataset.searchId); });
    $("#globalSearchResults").addEventListener("keydown", function (event) {
      const button = event.target.closest("[data-search-type]"); if (!button) return;
      const buttons = $$("[data-search-type]", event.currentTarget); const index = buttons.indexOf(button);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
      else if (event.key === "Escape") { event.preventDefault(); $("#globalSearch").focus(); $("#globalSearchResults").hidden = true; }
    });
    document.addEventListener("focusin", function (event) { if (!event.target.closest(".global-search-wrap")) $("#globalSearchResults").hidden = true; });

    $("#recordStatusFilter").addEventListener("change", function (event) { storage.mutate(function (next) { next.ui.records.statusFilter = event.target.value; }, { reason: "record-filter" }); renderRecordList(); });
    $("#recordCategoryFilter").addEventListener("change", function (event) { storage.mutate(function (next) { next.ui.records.categoryFilter = event.target.value; }, { reason: "record-filter" }); renderRecordList(); });
    $("#recordSort").addEventListener("change", function (event) { storage.mutate(function (next) { next.ui.records.sortBy = event.target.value; }, { reason: "record-sort" }); renderRecordList(); });
    $("#recordSortDirection").addEventListener("click", function () { storage.mutate(function (next) { next.ui.records.sortDirection = next.ui.records.sortDirection === "asc" ? "desc" : "asc"; }, { reason: "record-sort" }); renderRecordList(); });
    $("#favoritesFilter").addEventListener("click", function () { storage.mutate(function (next) { next.ui.records.favoritesOnly = !next.ui.records.favoritesOnly; }, { reason: "record-filter" }); renderRecordList(); });
    $("#recordViewModeButton").addEventListener("click", function () { storage.mutate(function (next) { next.ui.records.viewMode = next.ui.records.viewMode === "compact" ? "comfortable" : "compact"; }, { reason: "record-view" }); renderRecordList(); });
    $("#recordDetail").addEventListener("input", function (event) { const field = event.target.dataset.recordField; const form = event.target.closest("[data-record-form]"); if (field && form) updateRecordField(form.dataset.recordForm, field, event.target.value); });
    $("#recordDetail").addEventListener("change", function (event) { const field = event.target.dataset.recordField; const form = event.target.closest("[data-record-form]"); if (field && form) { updateRecordField(form.dataset.recordForm, field, event.target.value); renderRecordDetail(); } });
    $("#recordDetail").addEventListener("click", function (event) {
      const menu = event.target.closest("[data-record-menu]"); if (menu) { openRecordMenu(menu.dataset.recordMenu, menu); return; }
      const favorite = event.target.closest("[data-toggle-favorite]"); if (favorite) { toggleFavorite(favorite.dataset.toggleFavorite); return; }
      const move = event.target.closest("[data-move-record]"); if (move) { reorderRecord(state().ui.selectedRecordId, Number(move.dataset.moveRecord)); return; }
      const remove = event.target.closest("[data-delete-record]"); if (remove) requestDeleteRecord(remove.dataset.deleteRecord);
    });
    $("#recordCreateForm").addEventListener("submit", function (event) {
      event.preventDefault();
      addRecord({ title: $("#newRecordTitle").value, category: $("#newRecordCategory").value, status: $("#newRecordStatus").value, summary: $("#newRecordSummary").value, tags: $("#newRecordTags").value, url: $("#newRecordUrl").value });
      components.closeDialog("#recordDialog", "created");
    });
    $("#renameForm").addEventListener("submit", function (event) { event.preventDefault(); storage.mutate(function (next) { next.workspace.title = u.cleanLine($("#renameInput").value, 100) || "My Workspace"; }, { reason: "rename-workspace" }); components.closeDialog("#renameDialog", "saved"); renderHeader(); });

    $("#documentSearch").addEventListener("input", function (event) { storage.mutate(function (next) { next.ui.documents.search = u.cleanLine(event.target.value, 200); }, { reason: "document-search" }); renderDocumentList(); });
    $("#documentSort").addEventListener("change", function (event) { storage.mutate(function (next) { next.ui.documents.sortBy = event.target.value; }, { reason: "document-sort" }); renderDocumentList(); });
    const rememberRecordScroll = u.debounce(function () { storage.mutate(function (next) { next.ui.navigation.recordsScrollTop = $("#recordList").scrollTop; }, { touch: false, reason: "record-scroll" }); }, 180);
    const rememberDocumentScroll = u.debounce(function () { storage.mutate(function (next) { next.ui.navigation.documentsScrollTop = $("#documentList").scrollTop; }, { touch: false, reason: "document-scroll" }); }, 180);
    $("#recordList").addEventListener("scroll", rememberRecordScroll, { passive: true });
    $("#documentList").addEventListener("scroll", rememberDocumentScroll, { passive: true });
    $("#documentCreateForm").addEventListener("submit", function (event) { event.preventDefault(); addDocument($("#newDocumentTitle").value); components.closeDialog("#documentDialog", "created"); });
    $("#documentDetail").addEventListener("input", function (event) {
      if (event.target.matches("[data-document-title]")) updateDocument(state().ui.selectedDocumentId, { title: event.target.value }, true);
      else if (event.target.matches("[data-document-editor]")) saveDocumentEditor({ renderList: false });
    });
    $("#documentDetail").addEventListener("focusout", function (event) { if (event.target.matches("[data-document-editor]")) { saveDocumentEditor({ renderList: true, normalizeEditor: true }); renderDocumentList(); } });
    $("#documentDetail").addEventListener("click", function (event) {
      const menu = event.target.closest("[data-document-menu]"); if (menu) { openDocumentMenu(menu.dataset.documentMenu, menu); return; }
      const command = event.target.closest("[data-editor-command]"); if (command) { applyEditorCommand(command.dataset.editorCommand); return; }
      const block = event.target.closest("[data-editor-block]"); if (block) { applyEditorCommand("formatBlock", block.dataset.editorBlock); return; }
      if (event.target.closest("[data-editor-link]")) { saveCurrentSelection(); $("#documentLinkInput").value = ""; components.openDialog("#linkDialog", { trigger: event.target.closest("[data-editor-link]"), focus: "#documentLinkInput" }); return; }
      const move = event.target.closest("[data-move-document]"); if (move) { reorderDocument(state().ui.selectedDocumentId, Number(move.dataset.moveDocument)); return; }
      const remove = event.target.closest("[data-delete-document]"); if (remove) requestDeleteDocument(remove.dataset.deleteDocument);
    });
    $("#linkForm").addEventListener("submit", function (event) {
      event.preventDefault(); const url = u.safeUrl($("#documentLinkInput").value);
      if (!url) { components.toast("Enter an http or https address.", { title: "Link not added", kind: "warning" }); return; }
      components.closeDialog("#linkDialog", "added");
      requestAnimationFrame(function () { restoreCurrentSelection(); applyEditorCommand("createLink", url); savedDocumentSelection = null; });
    });

    $("#roadmapSearch").addEventListener("input", function (event) { storage.mutate(function (next) { next.modules.roadmap.search = u.cleanLine(event.target.value, 200); }, { reason: "roadmap-filter" }); renderRoadmap(); });
    $("#roadmapState").addEventListener("change", function (event) { storage.mutate(function (next) { next.modules.roadmap.state = event.target.value; }, { reason: "roadmap-filter" }); renderRoadmap(); });
    $("#roadmapSort").addEventListener("change", function (event) { storage.mutate(function (next) { next.modules.roadmap.sortBy = event.target.value; }, { reason: "roadmap-sort" }); renderRoadmap(); });
    $("#installDialog")?.addEventListener("close", function () { savedDocumentSelection = null; });

    bindRecordList(); bindDocumentList(); bindSupportEvents();
    bindDivider($("#recordsDivider")); bindDivider($("#documentsDivider"));
    document.addEventListener("keydown", handleGlobalKeydown);
    document.addEventListener("keyup", function (event) { updateShortcutHints(event, false); });
    window.addEventListener("blur", function () { updateShortcutHints({ altKey: false, shiftKey: false, ctrlKey: false }, true); });
  }

  function renderAll() {
    applyAppearance();
    renderHeader();
    renderNavigation();
    renderPanels();
    renderRecords();
    if (config.features.documents) renderDocuments();
    if (config.features.roadmap) renderRoadmap();
    renderGlobalSearchResults();
    if ($("#supportDialog").open) renderSupport();
  }

  function bindRuntimeEvents() {
    window.addEventListener("app:syncchange", function () {
      renderSyncStatus();
      if ($("#supportDialog").open && state().ui.supportTab === "settings") renderSyncSettings();
      if ($("#supportDialog").open && state().ui.supportTab === "developer") renderDeveloper();
    });
    window.addEventListener("app:opensyncsettings", function (event) {
      openSupport("settings", event.detail && event.detail.trigger);
      $("#syncAdvancedFields").open = true;
      requestAnimationFrame(function () { $("#cloudSyncSettings").scrollIntoView({ block: "start" }); $("#syncOwner").focus(); });
    });
    window.addEventListener("app:storageerror", function (event) {
      components.toast(event.detail.message, { title: event.detail.title, kind: "danger", duration: 0, actionLabel: "Export", onAction: portability.exportJson });
      renderSyncStatus();
    });
    window.addEventListener("app:statesaved", function () { renderSyncStatus(); });
    window.addEventListener("app:networkchange", function () { document.documentElement.classList.toggle("offline", navigator.onLine === false); renderSyncStatus(); });
    window.addEventListener("app:pwaerror", function (event) { components.toast(event.detail.message, { title: "Offline support unavailable", kind: "warning", duration: 5000 }); });
    window.addEventListener("app:statechange", function (event) {
      const reasons = new Set(["import", "sync-download", "sync-merge", "recovery", "erase-all", "reset-preferences", "restore-demo"]);
      if (reasons.has(event.detail.reason)) renderAll();
    });
    window.addEventListener("resize", function () { renderPanels(); if ($("#developerPanel") && !$("#developerPanel").hidden) renderDeveloper(); });
    ["(prefers-color-scheme: dark)", "(prefers-reduced-motion: reduce)"].forEach(function (query) {
      const media = window.matchMedia(query);
      if (typeof media.addEventListener === "function") media.addEventListener("change", applyAppearance);
      else if (typeof media.addListener === "function") media.addListener(applyAppearance);
    });
    window.addEventListener("hashchange", function () {
      const requested = location.hash.slice(1);
      if (activeModuleEnabled(requested) && requested !== state().ui.activeModule) switchModule(requested);
    });
  }

  function showLoadReport() {
    const report = storage.getLoadReport();
    if (report.recovered) {
      components.toast("The saved state was unusable, so the last valid recovery copy was loaded.", { title: "Recovery copy restored", kind: "warning", duration: 6000 });
    } else if (report.error && report.source === "default") {
      components.toast("Saved data could not be read. A fresh default workspace was created without overwriting any imported file.", { title: "Fresh workspace loaded", kind: "warning", duration: 6000 });
    } else if (report.migrations.length) {
      components.toast("Saved data was upgraded through " + report.migrations.join(", ") + ".", { title: "State upgraded", kind: "success" });
    }
  }

  function init() {
    storage.load();
    const requestedModule = location.hash.slice(1);
    if (activeModuleEnabled(requestedModule) && requestedModule !== state().ui.activeModule) {
      storage.mutate(function (next) { next.ui.activeModule = requestedModule; next.ui.navigation.mobileScreen = "list"; }, { touch: false, reason: "startup-route" });
    }
    applyIdentity();
    components.init();
    portability.init();
    bindGeneralEvents();
    bindRuntimeEvents();
    pwa.init();
    sync.init();
    renderAll();
    document.documentElement.classList.toggle("offline", navigator.onLine === false);
    requestAnimationFrame(function () {
      document.documentElement.classList.add("app-ready");
      const activeList = state().ui.activeModule === "documents" ? $("#documentList") : $("#recordList");
      if (activeList) activeList.scrollTop = state().ui.activeModule === "documents" ? state().ui.navigation.documentsScrollTop : state().ui.navigation.recordsScrollTop;
    });
    showLoadReport();
  }

  App.application = {
    render: renderAll,
    switchModule: switchModule,
    openSupport: openSupport,
    addRecord: addRecord,
    addDocument: addDocument,
    shortcuts: SHORTCUTS
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
