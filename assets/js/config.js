(function () {
  "use strict";

  window.LocalApp = window.LocalApp || {};

  const CONFIG = {
    identity: {
      name: "Local Workspace",
      shortName: "Workspace",
      description: "A reusable, local-first workspace for records and documents.",
      version: "1.0.0",
      buildId: "2026.08.02.1",
      repository: {
        label: "Project repository",
        url: "https://github.com/example/local-workspace"
      },
      support: [
        { label: "Report a problem", url: "https://github.com/example/local-workspace/issues/new" },
        { label: "View documentation", url: "https://github.com/example/local-workspace#readme" }
      ],
      assets: {
        favicon: "assets/icons/favicon.svg",
        appIconLight: "assets/icons/app-icon-light.svg",
        appIconDark: "assets/icons/app-icon-dark.svg",
        manifestLight: "manifest.webmanifest",
        manifestDark: "manifest-dark.webmanifest"
      }
    },

    schemaVersion: 3,
    storage: {
      stateKey: "localWorkspace.state.v3",
      legacyKeys: ["localWorkspace.state.v1", "localWorkspace.state.v2"],
      recoveryKey: "localWorkspace.recovery.v1",
      secretKey: "localWorkspace.githubToken.v1",
      sessionSecretKey: "localWorkspace.githubToken.session.v1"
    },

    features: {
      records: true,
      documents: true,
      cloudSync: true,
      roadmap: true,
      developerTools: true,
      hints: true,
      demoData: true
    },

    controls: {
      shortcutHintModifier: "Alt",
      autosaveDelayMs: 180,
      syncCheckIntervalMs: 5 * 60 * 1000,
      maxImportBytes: 5 * 1024 * 1024,
      maxRecords: 5000,
      maxDocuments: 500,
      maxTextLength: 20000,
      maxDocumentHtmlLength: 250000
    },

    statuses: [
      { id: "active", label: "Active", icon: "●", color: "#2f7d68" },
      { id: "paused", label: "Paused", icon: "Ⅱ", color: "#a86a1f" },
      { id: "complete", label: "Complete", icon: "✓", color: "#4f6f52" },
      { id: "idea", label: "Idea", icon: "◇", color: "#7058a3" }
    ],

    themes: [
      { id: "harbor", label: "Harbor", accent: "#315f73", accent2: "#b86b4b", success: "#4f745f", warning: "#9b6a24", danger: "#a74747" },
      { id: "forest", label: "Forest", accent: "#356859", accent2: "#a76f3f", success: "#4d744e", warning: "#9a7028", danger: "#a04c48" },
      { id: "plum", label: "Plum", accent: "#6a4c79", accent2: "#b76b65", success: "#547158", warning: "#9c6c25", danger: "#a74650" },
      { id: "slate", label: "Slate", accent: "#49627c", accent2: "#9b664b", success: "#52715c", warning: "#916c2e", danger: "#9e4850" }
    ],

    releases: [
      {
        version: "1.0.0",
        date: "2026-08-01",
        title: "A clean foundation",
        summary: "The first reusable local-first workspace foundation.",
        features: ["Versioned local state with migrations", "Records and document workspaces", "Offline-ready application shell"],
        improvements: ["Responsive list/detail layouts", "Accessible dialogs and keyboard shortcuts"],
        fixes: [],
        knownIssues: ["GitHub sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.3.0",
        date: "2026-07-18",
        title: "Template preview",
        summary: "Internal structure and migration fixtures were established.",
        features: ["Demonstration schema and neutral sample content"],
        improvements: ["Centralized identity and theme configuration"],
        fixes: ["Legacy backup wrappers now migrate predictably"],
        knownIssues: []
      }
    ],

    roadmap: [
      { id: "road-1", title: "Optional attachment adapter", description: "Document an extension point for local or remote file attachments.", state: "planned", priority: 2, target: "1.2", effort: 3, createdAt: "2026-07-08T12:00:00.000Z" },
      { id: "road-2", title: "Saved search presets", description: "Let users name and restore common record filters.", state: "wishlist", priority: 3, target: "Unscheduled", effort: 2, createdAt: "2026-07-20T12:00:00.000Z" },
      { id: "road-3", title: "Local print layout", description: "Add a clean print view for records and documents.", state: "planned", priority: 1, target: "1.1", effort: 1, createdAt: "2026-07-29T12:00:00.000Z" },
      { id: "road-4", title: "Initial template foundation", description: "Ship the reusable shell, state, portability, PWA, and support modules.", state: "released", priority: 1, target: "1.0", effort: 4, createdAt: "2026-06-12T12:00:00.000Z" }
    ],

    help: [
      { id: "start", title: "Getting started", section: "Basics", keywords: "start records documents workspace", html: "<p>Use <strong>Records</strong> for structured items and <strong>Documents</strong> for longer notes. Everything saves automatically in this browser.</p>" },
      { id: "records", title: "Working with records", section: "Features", keywords: "record filter sort search reorder favorite status", html: "<p>Add a record, then edit its title, category, status, tags, summary, or optional link. Use search, filters, sorting, favorites, drag, or <kbd>Alt</kbd> + arrow keys to organize it.</p>" },
      { id: "documents", title: "Working with documents", section: "Features", keywords: "document notes rich text editor", html: "<p>Documents support a small safe formatting set: headings, bold, italic, lists, quotes, and links. Imported markup is sanitized before display.</p>" },
      { id: "backup", title: "Backup and restore", section: "Data", keywords: "json export import backup restore recovery", html: "<p>Export a JSON backup from Settings. Imports are parsed, migrated, sanitized, summarized, and confirmed before they replace current data. The current copy is saved locally as a recovery snapshot first.</p>" },
      { id: "sync", title: "GitHub synchronization", section: "Data", keywords: "github cloud sync token conflict merge", html: "<p>GitHub sync is optional. Configure a private repository, branch, JSON file path, and a fine-grained token with Contents access. Conflicts always ask whether to upload, download, merge, or cancel.</p>" },
      { id: "install", title: "Install the application", section: "Installation", keywords: "install add home screen iphone ipad android mac windows pwa offline", html: "<p>Use your browser’s Install app, Add to Home Screen, or Add to Dock command. There is no in-app installation dialog. Once the application shell has loaded, core local features continue to work offline.</p>" },
      { id: "app-icon", title: "App icon controls", section: "Appearance", keywords: "icon theme dark light beta developer mode hold press", html: "<p>Click or tap the app icon to switch between light and dark themes. Press and hold it to enable or disable Developer Mode. The Beta pill appears automatically on a <code>/beta/</code> URL or when <code>?beta=1</code> is present.</p>" },
      { id: "privacy", title: "Privacy and local data", section: "Data", keywords: "privacy local storage token secret", html: "<p>Content remains in browser storage unless you export it or explicitly use GitHub sync. Tokens are stored separately per device and are excluded from backups and diagnostics.</p>" },
      { id: "shortcuts", title: "Keyboard access", section: "Accessibility", keywords: "keyboard shortcuts slash escape alt hints", html: "<p>Press <kbd>/</kbd> for global search and <kbd>?</kbd> for Help. Hold <kbd>Alt</kbd> to reveal shortcut hints. Every pointer-only convenience has a keyboard or visible-button alternative.</p>" }
    ]
  };

  window.LocalApp.config = Object.freeze(CONFIG);
})();
