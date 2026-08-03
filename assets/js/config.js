(function () {
  "use strict";

  window.LocalApp = window.LocalApp || {};

  window.LocalApp.config = Object.freeze({
    identity: {
      name: "App Template",
      shortName: "Template",
      description: "A minimal static application shell.",
      version: "1.0.0",
      buildId: "2026.08.02.3",
      repositoryUrl: "git@github.com:OWNER/REPOSITORY.git",
      assets: {
        favicon: "assets/icons/favicon.svg",
        appIconLight: "assets/icons/app-icon-light.svg",
        appIconDark: "assets/icons/app-icon-dark.svg",
        appleTouchIconLight: "assets/icons/apple-touch-icon.png",
        appleTouchIconDark: "assets/icons/apple-touch-icon-dark.png",
        manifestLight: "manifest.webmanifest",
        manifestDark: "manifest-dark.webmanifest"
      }
    },
    shell: {
      preferenceKey: "appTemplate.shell.v1",
      holdDelayMs: 700,
      lightThemeColor: "#f5f5f7",
      darkThemeColor: "#000000"
    }
  });
})();
