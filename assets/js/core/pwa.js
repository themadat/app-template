(function () {
  "use strict";

  const App = window.LocalApp;
  const config = App.config;
  const storage = App.storage;
  let deferredInstallPrompt = null;
  let registration = null;
  let refreshing = false;

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

  const instructions = {
    iphone: ["Open this page in Safari.", "Tap Share in the Safari toolbar.", "Choose Add to Home Screen, then tap Add."],
    ipad: ["Open this page in Safari.", "Tap Share in the Safari toolbar.", "Choose Add to Home Screen, then confirm Add."],
    "android-phone": ["Open this page in Chrome.", "Open the browser menu.", "Choose Install app or Add to Home screen, then confirm."],
    "android-tablet": ["Open this page in Chrome.", "Open the browser menu.", "Choose Install app or Add to Home screen, then confirm."],
    mac: ["In Safari, choose File → Add to Dock. In Chrome or Edge, use the install icon in the address bar.", "Confirm the application name and icon.", "Open it from the Dock or Applications."],
    windows: ["Open this page in Edge or Chrome.", "Choose Apps → Install this site as an app, or use the install icon in the address bar.", "Confirm Install."],
    other: ["Open this site in a browser that supports installable web apps.", "Look for Install app or Add to home screen in the browser menu.", "Confirm the application name and icon."]
  };

  function effectiveDark() {
    const mode = storage.getState().preferences.appearance.mode;
    return mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function appearanceVariant() {
    const choice = storage.getState().preferences.installation.iconVariant;
    return choice === "auto" ? (effectiveDark() ? "dark" : "light") : choice;
  }

  function applyAppearanceAssets() {
    const dark = effectiveDark();
    const variant = appearanceVariant();
    const manifest = document.querySelector("link[rel='manifest']");
    if (manifest) manifest.href = dark ? config.identity.assets.manifestDark : config.identity.assets.manifestLight;
    const apple = document.querySelector("link[rel='apple-touch-icon']");
    if (apple) apple.href = variant === "dark" ? "assets/icons/apple-touch-icon-dark.png" : "assets/icons/apple-touch-icon.png";
    const theme = document.querySelector("meta[name='theme-color']:not([media])");
    if (theme) theme.content = dark ? "#121616" : "#f5f3ed";
    document.documentElement.dataset.installIcon = variant;
  }

  function renderInstallDialog() {
    const device = detectDevice();
    const list = document.querySelector("[data-install-steps]");
    document.querySelector("[data-install-device]").textContent = device.label;
    list.innerHTML = (instructions[device.id] || instructions.other).map(function (step) {
      const item = document.createElement("li");
      item.textContent = step;
      return item.outerHTML;
    }).join("");
    const promptButton = document.querySelector("[data-install-prompt]");
    promptButton.hidden = !deferredInstallPrompt || installed();
    document.querySelector("[data-install-state]").textContent = installed()
      ? "This application is already running as an installed app."
      : deferredInstallPrompt
        ? "This browser can show its native installation prompt."
        : "Follow the steps for this device.";
    const variant = storage.getState().preferences.installation.iconVariant;
    document.querySelectorAll("[data-icon-variant]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.iconVariant === variant));
    });
  }

  function openInstall(trigger) {
    renderInstallDialog();
    App.components.openDialog("#installDialog", { trigger: trigger, focus: deferredInstallPrompt ? "[data-install-prompt]" : "[data-icon-variant='auto']" });
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    renderInstallDialog();
    if (result && result.outcome === "accepted") App.components.toast("The browser accepted the installation request.", { title: "Installation started", kind: "success" });
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
      registration = await navigator.serviceWorker.register("sw.js");
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
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      window.dispatchEvent(new CustomEvent("app:installchange"));
    });
    window.addEventListener("appinstalled", function () {
      deferredInstallPrompt = null;
      App.components.toast("The application was added to this device.", { title: "Installed", kind: "success" });
      window.dispatchEvent(new CustomEvent("app:installchange"));
    });
    ["online", "offline"].forEach(function (name) {
      window.addEventListener(name, function () { window.dispatchEvent(new CustomEvent("app:networkchange", { detail: networkStatus() })); });
    });
    const appearanceQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof appearanceQuery.addEventListener === "function") appearanceQuery.addEventListener("change", applyAppearanceAssets);
    else if (typeof appearanceQuery.addListener === "function") appearanceQuery.addListener(applyAppearanceAssets);
    window.addEventListener("app:statechange", applyAppearanceAssets);
    document.querySelector("[data-install-prompt]")?.addEventListener("click", promptInstall);
    document.querySelectorAll("[data-icon-variant]").forEach(function (button) {
      button.addEventListener("click", function () {
        storage.mutate(function (state) { state.preferences.installation.iconVariant = button.dataset.iconVariant; }, { reason: "install-icon" });
        applyAppearanceAssets();
        renderInstallDialog();
      });
    });
  }

  App.pwa = {
    init: init,
    openInstall: openInstall,
    detectDevice: detectDevice,
    installed: installed,
    networkStatus: networkStatus,
    applyAppearanceAssets: applyAppearanceAssets,
    getRegistration: function () { return registration; }
  };
})();
