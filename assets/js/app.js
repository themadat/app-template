(function () {
  "use strict";

  const config = window.LocalApp.config;
  const icons = window.LocalApp.icons;
  const root = document.documentElement;
  const iconButton = document.querySelector("#appIconButton");
  const appIcon = document.querySelector("#appIcon");
  const versionPill = document.querySelector("#versionPill");
  let preferences = loadPreferences();
  let holdTimer = 0;
  let holdHandled = false;

  function loadPreferences() {
    try {
      const stored = JSON.parse(localStorage.getItem(config.shell.preferenceKey) || "null");
      return {
        theme: stored && (stored.theme === "light" || stored.theme === "dark") ? stored.theme : preferredTheme(),
        developerMode: Boolean(stored && stored.developerMode)
      };
    } catch (_error) {
      return { theme: preferredTheme(), developerMode: false };
    }
  }

  function preferredTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function savePreferences() {
    try {
      localStorage.setItem(config.shell.preferenceKey, JSON.stringify(preferences));
    } catch (_error) {
      // The shell remains usable when browser storage is unavailable.
    }
  }

  function isBetaDeploy() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/beta(\/|$)/.test(path)) return true;
    const beta = new URLSearchParams(location.search || "").get("beta");
    return beta === "1" || beta === "true";
  }

  function applyIdentity() {
    const identity = config.identity;
    document.title = identity.name;
    document.querySelector("meta[name='description']").content = identity.description;
    document.querySelector("meta[name='apple-mobile-web-app-title']").content = identity.shortName;
    document.querySelector("#appName").textContent = identity.name;
    document.querySelector("#betaPill").hidden = !isBetaDeploy();
    icons.mount(document);
  }

  function renderShell() {
    const dark = preferences.theme === "dark";
    root.dataset.theme = preferences.theme;
    root.dataset.developer = preferences.developerMode ? "on" : "off";
    versionPill.textContent = "v" + config.identity.version + (preferences.developerMode ? " DEV" : "");
    versionPill.dataset.developer = preferences.developerMode ? "true" : "false";
    appIcon.src = dark ? config.identity.assets.appIconDark : config.identity.assets.appIconLight;
    document.querySelector("#appManifest").href = dark ? config.identity.assets.manifestDark : config.identity.assets.manifestLight;
    document.querySelector("#appleTouchIcon").href = dark ? config.identity.assets.appleTouchIconDark : config.identity.assets.appleTouchIconLight;
    document.querySelector("meta[name='theme-color']").content = dark ? config.shell.darkThemeColor : config.shell.lightThemeColor;
    const nextTheme = dark ? "light" : "dark";
    iconButton.setAttribute("aria-label", "Switch to " + nextTheme + " theme. Press and hold to toggle Developer Mode");
    iconButton.title = "Switch to " + nextTheme + " theme · Press and hold for Developer Mode";
  }

  function toggleTheme() {
    preferences.theme = preferences.theme === "dark" ? "light" : "dark";
    savePreferences();
    renderShell();
  }

  function toggleDeveloperMode() {
    preferences.developerMode = !preferences.developerMode;
    savePreferences();
    renderShell();
  }

  function clearHold() {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
    iconButton.removeAttribute("data-hold-active");
  }

  iconButton.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;
    holdHandled = false;
    iconButton.dataset.holdActive = "true";
    holdTimer = window.setTimeout(function () {
      holdHandled = true;
      toggleDeveloperMode();
      clearHold();
    }, config.shell.holdDelayMs);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach(function (eventName) {
    iconButton.addEventListener(eventName, clearHold);
  });

  iconButton.addEventListener("click", function (event) {
    if (holdHandled) {
      event.preventDefault();
      holdHandled = false;
      return;
    }
    toggleTheme();
  });

  iconButton.addEventListener("contextmenu", function (event) { event.preventDefault(); });

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      toggleDeveloperMode();
    }
  });

  applyIdentity();
  renderShell();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
