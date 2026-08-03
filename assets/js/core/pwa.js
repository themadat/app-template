(function () {
  "use strict";

  const App = window.LocalApp;
  const config = App.config;
  const storage = App.storage;
  let registration = null;
  let refreshing = false;

  function versionedAsset(path) {
    return path + "?v=" + encodeURIComponent(config.identity.buildId);
  }

  function installed() {
    return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  }

  function detectDevice() {
    const ua = navigator.userAgent || "";
    const touchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (/iPhone|iPod/i.test(ua)) return { id: "iphone", label: "iPhone" };
    if (/iPad/i.test(ua) || touchMac) return { id: "ipad", label: "iPad" };
    if (/Android/i.test(ua)) return { id: /Mobile/i.test(ua) ? "android-phone" : "android-tablet", label: /Mobile/i.test(ua) ? "Android phone" : "Android tablet" };
    if (/Macintosh|Mac OS X/i.test(ua)) return { id: "mac", label: "Mac" };
    if (/Windows/i.test(ua)) return { id: "windows", label: "Windows PC" };
    return { id: "other", label: "PC or other device" };
  }

  function effectiveDark() {
    const mode = storage.getState().preferences.appearance.mode;
    return mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function applyAppearanceAssets() {
    const dark = effectiveDark();
    const variant = dark ? "dark" : "light";
    const manifest = document.querySelector("link[rel='manifest']");
    if (manifest) manifest.href = versionedAsset(dark ? config.identity.assets.manifestDark : config.identity.assets.manifestLight);
    const apple = document.querySelector("link[rel='apple-touch-icon']");
    if (apple) apple.href = versionedAsset(variant === "dark" ? "assets/icons/apple-touch-icon-dark.png" : "assets/icons/apple-touch-icon.png");
    const theme = document.querySelector("meta[name='theme-color']:not([media])");
    if (theme) theme.content = dark ? "#121616" : "#f5f3ed";
    document.documentElement.dataset.installIcon = variant;
  }

  function updateAvailable(worker) {
    App.components.toast("A newer application shell is ready.", {
      title: "Update available",
      kind: "info",
      duration: 0,
      actionLabel: "Refresh",
      onAction: function () {
        refreshing = true;
        worker.postMessage({ type: "SKIP_WAITING" });
      }
    });
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    try {
      registration = await navigator.serviceWorker.register(versionedAsset("sw.js"), { updateViaCache: "none" });
      if (registration.waiting && navigator.serviceWorker.controller) updateAvailable(registration.waiting);
      registration.addEventListener("updatefound", function () {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", function () {
          if (worker.state === "installed" && navigator.serviceWorker.controller) updateAvailable(worker);
        });
      });
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (refreshing) location.reload();
      });
    } catch (error) {
      window.dispatchEvent(new CustomEvent("app:pwaerror", { detail: { message: "Offline installation is unavailable in this browser session." } }));
    }
  }

  function networkStatus() {
    return navigator.onLine === false ? { online: false, label: "Offline", message: "Local features remain available." } : { online: true, label: "Online", message: "Optional internet features are available." };
  }

  function init() {
    applyAppearanceAssets();
    registerServiceWorker();
    window.addEventListener("appinstalled", function () {
      App.components.toast("The application was added to this device.", { title: "Installed", kind: "success" });
    });
    ["online", "offline"].forEach(function (name) {
      window.addEventListener(name, function () { window.dispatchEvent(new CustomEvent("app:networkchange", { detail: networkStatus() })); });
    });
    const appearanceQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof appearanceQuery.addEventListener === "function") appearanceQuery.addEventListener("change", applyAppearanceAssets);
    else if (typeof appearanceQuery.addListener === "function") appearanceQuery.addListener(applyAppearanceAssets);
    window.addEventListener("app:statechange", applyAppearanceAssets);
  }

  App.pwa = {
    init: init,
    detectDevice: detectDevice,
    installed: installed,
    networkStatus: networkStatus,
    applyAppearanceAssets: applyAppearanceAssets,
    getRegistration: function () { return registration; }
  };
})();
