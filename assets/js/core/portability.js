(function () {
  "use strict";

  const App = window.LocalApp;
  const config = App.config;
  const u = App.utils;
  const model = App.stateModel;
  const storage = App.storage;
  let importTrigger = null;

  function summaryFor(state, migrations) {
    const categories = new Set(state.workspace.records.map(function (record) { return record.category; }));
    return {
      workspaceTitle: state.workspace.title,
      records: state.workspace.records.length,
      documents: state.workspace.documents.length,
      categories: categories.size,
      schemaVersion: state.schemaVersion,
      appVersion: state.meta.appVersion,
      updatedAt: state.meta.updatedAt,
      migrations: migrations || []
    };
  }

  function exportJson() {
    storage.saveNow();
    const envelope = model.exportEnvelope(storage.getState());
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const slug = config.identity.shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
    link.href = url;
    link.download = slug + "-backup-" + new Date().toISOString().slice(0, 10) + "-v" + config.identity.version + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    App.components.toast("A complete JSON backup was created.", { title: "Backup exported", kind: "success" });
  }

  function readFile(file) {
    if (!file) return Promise.reject(new Error("No file was selected."));
    if (file.size > config.controls.maxImportBytes) return Promise.reject(new Error("That backup is larger than the " + u.formatBytes(config.controls.maxImportBytes) + " import limit."));
    return file.text ? file.text() : new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(new Error("The selected file could not be read.")); };
      reader.readAsText(file);
    });
  }

  function renderPreview(candidate, fileName) {
    const summary = summaryFor(candidate.state, candidate.migrations);
    const current = summaryFor(storage.getState(), []);
    document.querySelector("[data-import-file]").textContent = fileName || "Selected backup";
    document.querySelector("[data-import-workspace]").textContent = summary.workspaceTitle;
    document.querySelector("[data-import-documents]").textContent = summary.documents + " (current: " + current.documents + ")";
    document.querySelector("[data-import-version]").textContent = "State v" + summary.schemaVersion + " · app v" + (summary.appVersion || "unknown");
    document.querySelector("[data-import-updated]").textContent = u.dateLabel(summary.updatedAt);
    const migrationRow = document.querySelector("[data-import-migrations-row]");
    migrationRow.hidden = summary.migrations.length === 0;
    document.querySelector("[data-import-migrations]").textContent = summary.migrations.length ? summary.migrations.join(", ") : "None";
    const warning = document.querySelector("[data-import-warning]");
    warning.hidden = candidate.validation.warnings.length === 0;
    warning.textContent = candidate.validation.warnings.join(" ");
    const before = storage.getState(), after = candidate.state;
    const notesLength = function (value) { return value.workspace.documents.reduce(function (total, item) { return total + u.richTextToPlainText(item.html || "", config.controls.maxDocumentHtmlLength).length; }, 0); };
    App.tables.mount(document.querySelector("[data-import-comparison]"), {
      caption: "Backup replacement: current and imported values",
      columns: [{ id: "item", label: "Content", width: 200 }, { id: "current", label: "Current", width: 180 }, { id: "imported", label: "In backup", width: 180 }],
      rows: [
        { item: "Workspace", current: current.workspaceTitle, imported: summary.workspaceTitle },
        { item: "Notes", current: current.documents, imported: summary.documents },
        { item: "Notes characters", current: notesLength(before), imported: notesLength(after) },
        { item: "Edited icons", current: before.modules.iconLibrary.overrides.length, imported: after.modules.iconLibrary.overrides.length },
        { item: "Theme", current: before.preferences.appearance.mode, imported: after.preferences.appearance.mode },
        { item: "Text size", current: Math.round(before.preferences.appearance.textScale * 100) + "%", imported: Math.round(after.preferences.appearance.textScale * 100) + "%" }
      ]
    });
  }

  const review = App.importReview.create({
    prepare: async function (file) {
      const text = await readFile(file);
      let parsed;
      try { parsed = JSON.parse(text); }
      catch (error) { throw new Error("The selected file is not valid JSON."); }
      return model.prepare(parsed);
    },
    onPreview: function (candidate, file) {
      renderPreview(candidate, file.name);
      App.components.openDialog("#importPreviewDialog", { trigger: importTrigger, focus: "[data-import-confirm]" });
    },
    confirm: function () { return App.components.confirm({
      title: "Replace current data?",
      message: "The validated backup will replace notes, preferences, and module settings. A recoverable copy of the current data will be saved first.",
      confirmLabel: "Replace data",
      cancelLabel: "Keep current data",
      danger: true,
      trigger: document.querySelector("[data-import-confirm]")
    }); },
    apply: function (candidate) {
      const summary = summaryFor(candidate.state, candidate.migrations);
      if (!storage.saveRecovery("Before importing " + summary.workspaceTitle)) throw new Error("The current data could not be saved for recovery. Free browser storage or export a backup before trying again.");
      storage.replace(candidate.state, { saveRecovery: false, reason: "import" });
    },
    onApplied: function (candidate) {
      App.components.closeDialog("#importPreviewDialog", "imported");
      App.components.toast("Imported " + summaryFor(candidate.state).documents + " notes.", { title: "Backup restored", kind: "success" });
    },
    onError: function (error) {
      App.components.message("Import unavailable", error.message || "That backup could not be used.", { trigger: importTrigger });
    },
    onBusy: function (busy) {
      const button = document.querySelector("[data-import-confirm]");
      if (button) button.disabled = busy;
      App.components.setLoading(busy && review.getPhase() === "preparing", "Checking backup…");
    }
  });

  function previewFile(file, trigger) {
    if (!file) return Promise.resolve(false);
    if (["confirming", "applying"].includes(review.getPhase())) return Promise.resolve(false);
    importTrigger = trigger;
    return review.preview(file);
  }

  function init() {
    const input = document.querySelector("#importFileInput");
    if (input) input.addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      previewFile(file, document.activeElement);
      event.target.value = "";
    });
    document.querySelector("[data-import-confirm]")?.addEventListener("click", review.commit);
    document.querySelector("#importPreviewDialog")?.addEventListener("close", function () {
      if (this.returnValue !== "imported") review.cancel();
    });
  }

  App.portability = {
    init: init,
    exportJson: exportJson,
    previewFile: previewFile,
    summaryFor: summaryFor
  };
})();
