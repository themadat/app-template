(function () {
  "use strict";

  window.LocalApp = window.LocalApp || {};

  const CONFIG = {
    identity: {
      name: "App Template",
      shortName: "Template",
      description: "A focused local-first shell with Notes, Roadmap, support, and optional GitHub Sync.",
      version: "1.0.1.1",
      buildId: "1.0.1.1",
      repository: {
        label: "Project repository",
        url: "https://github.com/OWNER/REPOSITORY"
      },
      support: [
        { label: "Report a problem", url: "https://github.com/OWNER/REPOSITORY/issues/new" },
        { label: "View documentation", url: "https://github.com/OWNER/REPOSITORY#readme" }
      ],
      assets: {
        favicon: "assets/icons/favicon.svg",
        appIconLight: "assets/icons/app-icon-light.svg",
        appIconDark: "assets/icons/app-icon-dark.svg",
        manifestLight: "manifest.webmanifest",
        manifestDark: "manifest-dark.webmanifest"
      }
    },

    schemaVersion: 4,
    storage: {
      stateKey: "appTemplate.state.v4",
      legacyKeys: ["appTemplate.state.v3", "localWorkspace.state.v3", "localWorkspace.state.v2", "localWorkspace.state.v1"],
      recoveryKey: "appTemplate.recovery.v1",
      secretKey: "appTemplate.githubToken.v1",
      sessionSecretKey: "appTemplate.githubToken.session.v1"
    },

    features: {
      records: false,
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
        version: "1.0.1.1",
        date: "2026-08-03T12:00:00.000Z",
        title: "Reliable versioned shell",
        summary: "Notes now uses one focused modal, refreshes load a consistent build, and updates use a four-part app version.",
        features: ["Single-modal Notes workspace", "Major.minor.patch.build versioning"],
        improvements: ["Build-stamped application assets", "Version-first commit handoffs", "Dedicated Notes SF Symbol"],
        fixes: ["Escape closes Notes and restores focus", "Legacy caches no longer mix old and new application files"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "1.0.0.0",
        date: "2026-08-01T12:00:00.000Z",
        title: "Focused application foundation",
        summary: "A reusable shell with Notes, Roadmap, support tools, and optional GitHub Sync.",
        features: ["Single local Notes workspace", "Searchable Roadmap and Help", "Complete opt-in GitHub synchronization", "Offline-ready application shell"],
        improvements: ["Responsive Notes modal", "Accessible dialogs, notifications, and keyboard shortcuts"],
        fixes: [],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.3.0.0",
        date: "2026-07-18T12:00:00.000Z",
        title: "Template preview",
        summary: "The reusable state and recovery foundations were established.",
        features: ["Versioned local state and migration fixtures"],
        improvements: ["Centralized identity and appearance configuration"],
        fixes: ["Legacy backup wrappers now migrate predictably"],
        knownIssues: []
      }
    ],

    roadmap: [
      { id: "road-1", title: "Optional attachment adapter", description: "Document an extension point for local or remote file attachments.", state: "planned", priority: 2, target: "1.2", effort: 3, createdAt: "2026-07-08T12:00:00.000Z" },
      { id: "road-2", title: "Notes print view", description: "Add a clean print layout for the single Notes workspace.", state: "wishlist", priority: 3, target: "Unscheduled", effort: 2, createdAt: "2026-07-20T12:00:00.000Z" },
      { id: "road-3", title: "Local print layout", description: "Add a clean print view for notes and roadmap entries.", state: "planned", priority: 1, target: "1.1", effort: 1, createdAt: "2026-07-29T12:00:00.000Z" },
      { id: "road-4", title: "Focused template foundation", description: "Ship the shell, Notes, Roadmap, sync, recovery, PWA, and support modules.", state: "released", priority: 1, target: "1.0", effort: 4, createdAt: "2026-06-12T12:00:00.000Z" }
    ],

    help: [
      { id: "start", title: "Getting started", section: "Basics", keywords: "start notes roadmap", html: "<p>Open <strong>Notes</strong> for a single plain-text scratchpad and use <strong>Roadmap</strong> for released, planned, and wishlist items. Local changes save automatically.</p>" },
      { id: "notes", title: "Working with Notes", section: "Features", keywords: "notes text edit modal autosave", html: "<p>Open Notes from the top bar or press <kbd>N</kbd>. The single plain-text editor saves locally and is included in backup and synchronization data.</p>" },
      { id: "roadmap", title: "Using Roadmap", section: "Features", keywords: "roadmap planned released wishlist priority target effort", html: "<p>Search Roadmap, filter its state, and sort by priority, target release, effort, age, or title. Replace the demonstration entries in configuration.</p>" },
      { id: "backup", title: "Backup and restore", section: "Data", keywords: "json export import backup restore recovery", html: "<p>Export a JSON backup from Settings. Imports are parsed, migrated, sanitized, summarized, and confirmed before replacement. The current copy is saved as a recovery snapshot first.</p>" },
      { id: "sync", title: "GitHub synchronization", section: "Data", keywords: "github cloud sync token conflict merge", html: "<p>GitHub sync is optional. Configure a private repository, branch, JSON file path, and a fine-grained token with Contents access. Conflicts always ask whether to upload, download, merge, or cancel.</p>" },
      { id: "install", title: "Install the application", section: "Installation", keywords: "install add home screen iphone ipad android mac windows pwa offline", html: "<p>Use your browser’s Install app, Add to Home Screen, or Add to Dock command. There is no in-app installation dialog. Once the application shell has loaded, core local features continue to work offline.</p>" },
      { id: "app-icon", title: "App icon controls", section: "Appearance", keywords: "icon theme dark light beta developer mode hold press", html: "<p>Click or tap the app icon to switch between light and dark themes. Press and hold it to enable or disable Developer Mode. The Beta pill appears automatically on a <code>/beta/</code> URL or when <code>?beta=1</code> is present.</p>" },
      { id: "privacy", title: "Privacy and local data", section: "Data", keywords: "privacy local storage token secret", html: "<p>Notes remain in browser storage unless you export them or explicitly use GitHub Sync. Tokens are stored separately per device and excluded from backups and diagnostics.</p>" },
      { id: "shortcuts", title: "Keyboard access", section: "Accessibility", keywords: "keyboard shortcuts slash escape alt hints version", html: "<p>Press <kbd>/</kbd> for global search, <kbd>N</kbd> for Notes, <kbd>V</kbd> for What’s New, and <kbd>?</kbd> for Help. Hold <kbd>Alt</kbd> to reveal shortcut hints. The Shortcuts tab lists every command.</p>" }
    ]
  };

  window.LocalApp.config = Object.freeze(CONFIG);
})();
