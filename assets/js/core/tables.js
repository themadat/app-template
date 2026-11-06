(function () {
  "use strict";
  let sequence = 0;
  function cellValue(row, column) { return column.value ? column.value(row) : row[column.id]; }
  function selectRows(rows, columns, query, sort) {
    const filtered = rows.filter(function (row) {
      return !query || window.LocalApp.search.matches(columns.map(function (column) { return cellValue(row, column); }).join(" "), query);
    });
    const column = columns.find(function (item) { return sort && item.id === sort.id; });
    if (column) filtered.sort(function (a, b) {
      const left = cellValue(a, column), right = cellValue(b, column);
      const missing = function (value) { return value == null || value === ""; };
      if (missing(left) || missing(right)) return Number(missing(left)) - Number(missing(right));
      const compared = column.type === "number" ? Number(left) - Number(right) : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
      return compared * (sort.direction === "desc" ? -1 : 1);
    });
    return filtered;
  }
  function mount(container, options) {
    const columns = options.columns, prefix = "shared-table-" + (++sequence);
    let rows = options.rows || [], query = "", sort = null;
    const preferences = options.preferences || {};
    const widths = {}, initialWidths = {};
    columns.forEach(function (column) { initialWidths[column.id] = Math.min(600, Math.max(100, Number(column.width) || 180)); widths[column.id] = Math.min(600, Math.max(100, Number(preferences.widths?.[column.id]) || initialWidths[column.id])); });
    const element = function (tag, className, text) {
      const node = document.createElement(tag); if (className) node.className = className;
      if (text != null) node.textContent = String(text); return node;
    };
    const root = element("div", "shared-table");
    root.classList.toggle("compact", preferences.compact === true);
    const toolbar = element("div", "shared-table-toolbar");
    const searchLabel = element("label", "shared-table-search", "Filter rows");
    const search = element("input"); search.type = "search"; search.placeholder = "Filter rows"; searchLabel.append(search);
    const density = element("button", "button", "Compact rows"); density.type = "button";
    density.setAttribute("aria-pressed", String(root.classList.contains("compact")));
    const details = element("details", "shared-table-columns"); details.append(element("summary", "button", "Columns"));
    const controls = element("div", "shared-table-widths"); details.append(controls);
    const reset = element("button", "button", "Reset view"); reset.type = "button";
    const count = element("span", "setting-note"); count.setAttribute("role", "status"); count.setAttribute("aria-live", "polite");
    toolbar.append(searchLabel, density, details, reset, count);
    const scroller = element("div", "shared-table-scroll"); scroller.tabIndex = 0;
    scroller.setAttribute("role", "region"); scroller.setAttribute("aria-label", options.caption || "Data table");
    const table = element("table"); table.append(element("caption", "visually-hidden", options.caption || "Data table"));
    const colgroup = element("colgroup"), header = element("thead"), headerRow = element("tr"), body = element("tbody");
    const headers = new Map(), inputs = new Map(), cols = new Map();
    function changed() {
      if (options.onPreferencesChange) options.onPreferencesChange({ widths: Object.assign({}, widths), compact: root.classList.contains("compact") });
    }
    function render() {
      const selected = selectRows(rows, columns, query, sort); body.replaceChildren();
      selected.forEach(function (row) {
        const tr = element("tr");
        columns.forEach(function (column) { tr.append(element("td", "", cellValue(row, column) ?? "—")); }); body.append(tr);
      });
      if (!selected.length) { const tr = element("tr"), td = element("td", "", "No matching rows."); td.colSpan = columns.length; tr.append(td); body.append(tr); }
      count.textContent = selected.length + " of " + rows.length + " rows";
      headers.forEach(function (th, id) { th.setAttribute("aria-sort", sort?.id === id ? (sort.direction === "asc" ? "ascending" : "descending") : "none"); });
    }
    columns.forEach(function (column, index) {
      const col = element("col"); col.style.width = widths[column.id] + "px"; cols.set(column.id, col); colgroup.append(col);
      const th = element("th"); th.scope = "col"; headers.set(column.id, th);
      if (column.sortable === false) th.textContent = column.label;
      else {
        const button = element("button", "shared-table-sort", column.label); button.type = "button"; button.setAttribute("aria-label", "Sort by " + column.label);
        button.addEventListener("click", function () { sort = { id: column.id, direction: sort?.id === column.id && sort.direction === "asc" ? "desc" : "asc" }; render(); }); th.append(button);
      }
      headerRow.append(th);
      const label = element("label", "", column.label + " width");
      const input = element("input"); input.id = prefix + "-width-" + index; input.type = "range"; input.min = "100"; input.max = "600"; input.step = "10"; input.value = widths[column.id];
      input.setAttribute("aria-valuetext", widths[column.id] + " pixels"); label.htmlFor = input.id; label.append(input); controls.append(label); inputs.set(column.id, input);
      input.addEventListener("input", function () { widths[column.id] = Number(input.value); col.style.width = input.value + "px"; input.setAttribute("aria-valuetext", input.value + " pixels"); changed(); });
    });
    search.addEventListener("input", function () { query = search.value; render(); });
    density.addEventListener("click", function () { root.classList.toggle("compact"); density.setAttribute("aria-pressed", String(root.classList.contains("compact"))); changed(); });
    reset.addEventListener("click", function () {
      query = ""; sort = null; search.value = ""; root.classList.remove("compact"); density.setAttribute("aria-pressed", "false");
      columns.forEach(function (column) { const width = initialWidths[column.id]; widths[column.id] = width; cols.get(column.id).style.width = width + "px"; inputs.get(column.id).value = width; inputs.get(column.id).setAttribute("aria-valuetext", width + " pixels"); }); render(); changed();
    });
    header.append(headerRow); table.append(colgroup, header, body); scroller.append(table); root.append(toolbar, scroller); container.replaceChildren(root); render();
    return { setRows: function (next) { rows = next; render(); }, destroy: function () { root.remove(); } };
  }
  window.LocalApp.tables = { mount: mount, selectRows: selectRows };
})();
