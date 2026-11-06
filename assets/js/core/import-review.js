(function () {
  "use strict";
  // Parsing/validation and data contracts belong to the app; this owns review lifecycle.
  function create(options) {
    let candidate = null, generation = 0, phase = "idle";
    const busy = function (value) { if (options.onBusy) options.onBusy(value); };
    const report = function (error) { if (options.onError) options.onError(error); };
    async function preview(input) {
      if (phase === "confirming" || phase === "applying") return false;
      const request = ++generation;
      candidate = null; phase = "preparing"; busy(true);
      try {
        const prepared = await options.prepare(input);
        if (request !== generation) return false;
        candidate = prepared; phase = "reviewing";
        await options.onPreview(prepared, input);
        return true;
      } catch (error) {
        if (request === generation) { candidate = null; phase = "idle"; report(error); }
        return false;
      } finally { if (request === generation) busy(false); }
    }
    async function commit() {
      if (phase !== "reviewing" || !candidate) return false;
      const request = generation, reviewed = candidate;
      phase = "confirming"; busy(true);
      try {
        const accepted = options.confirm ? await options.confirm(reviewed) : true;
        if (request !== generation) return false;
        if (!accepted) { phase = "reviewing"; return false; }
        phase = "applying";
        await options.apply(reviewed);
        candidate = null; phase = "idle";
        if (options.onApplied) options.onApplied(reviewed);
        return true;
      } catch (error) {
        if (request === generation) { phase = "reviewing"; report(error); }
        return false;
      } finally { if (request === generation) busy(false); }
    }
    function cancel() {
      if (phase === "applying") return false;
      generation += 1; candidate = null; phase = "idle"; busy(false); return true;
    }
    return { preview: preview, commit: commit, cancel: cancel, getPhase: function () { return phase; } };
  }
  window.LocalApp.importReview = { create: create };
})();
