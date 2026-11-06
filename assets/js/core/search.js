(function () {
  "use strict";
  const providers = new Map();
  // Quoted phrases match whole words; all terms must match, in any order.
  function matches(text, query) {
    const value = String(text || "").toLowerCase();
    const terms = Array.from(String(query || "").toLowerCase().matchAll(/"([^"]*)"|([^\s"]+)/g));
    return terms.length > 0 && terms.every(function (term) {
      const word = term[1] === undefined ? term[2] : term[1];
      if (!word) return true;
      if (term[1] === undefined) return value.includes(word);
      let start = value.indexOf(word);
      while (start !== -1) {
        if (!/[\p{L}\p{N}]/u.test(value[start - 1] || "") && !/[\p{L}\p{N}]/u.test(value[start + word.length] || "")) return true;
        start = value.indexOf(word, start + 1);
      }
      return false;
    });
  }
  function register(provider) {
    if (!provider.id || typeof provider.search !== "function" || typeof provider.activate !== "function") throw new Error("Search providers need id, search, and activate.");
    if (providers.has(provider.id)) throw new Error("Search provider already registered: " + provider.id);
    providers.set(provider.id, provider);
    return function () { if (providers.get(provider.id) === provider) providers.delete(provider.id); };
  }
  function query(value, options) {
    if (!String(value || "").trim()) return [];
    const settings = options || {};
    const limit = Math.max(1, Math.min(50, Number(settings.limit) || 16));
    const groups = [];
    providers.forEach(function (provider) {
      if (settings.only && provider.id !== settings.only) return;
      if (provider.enabled && !provider.enabled()) return;
      const seen = new Set();
      const results = provider.search(value).filter(function (result) {
        if (!result || result.id == null || !result.title || seen.has(String(result.id))) return false;
        seen.add(String(result.id)); return true;
      }).slice(0, provider.limit || 6).map(function (result) {
        return { type: provider.id, id: String(result.id), title: String(result.title), meta: String(result.meta || "") };
      });
      groups.push(results);
    });
    // Round-robin keeps support/settings discoverable even with many product matches.
    const results = [];
    for (let index = 0; results.length < limit && groups.some(function (group) { return index < group.length; }); index += 1) {
      groups.forEach(function (group) { if (group[index] && results.length < limit) results.push(group[index]); });
    }
    return results;
  }
  function activate(type, id) {
    const provider = providers.get(type);
    if (!provider || (provider.enabled && !provider.enabled())) return false;
    provider.activate(id); return true;
  }
  window.LocalApp.search = { register: register, query: query, matches: matches, activate: activate };
})();
