(function () {
  "use strict";

  window.LocalApp = window.LocalApp || {};

  const CONFIG = {
    identity: {
      name: "App Template",
      shortName: "Template",
      description: "A searchable local SVG icon library for finding and copying reusable interface symbols.",
      version: "0.0.1.14",
      buildId: "0.0.1.14",
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
      shortcutHintModifier: "ShiftControlOption",
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
        version: "0.0.1.14",
        date: "2026-08-31T18:00:00.000Z",
        title: "Category-first icon finding",
        summary: "The icon catalog now combines quick-select categories with semantic search tags and a denser card layout for faster symbol retrieval.",
        features: ["Persistent quick-select category chips with live counts", "Generated multi-category assignments and semantic aliases for every compiled icon"],
        improvements: ["Search accepts names, aliases, tags, categories, source metadata, and multiple query terms", "Removed the introductory catalog block and moved type/info controls to the bottom corners of each compact card"],
        fixes: ["Category generation ignores incidental source-directory names and keeps generic shape variants from overwhelming the Shapes category"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.13",
        date: "2026-08-31T16:00:00.000Z",
        title: "Compact icon library",
        summary: "The icon library now uses compact name-and-type cards, provides source details on demand, and includes a complete module shortcut set.",
        features: ["Accessible icon-details dialog with identifiers, aliases, repositories, filenames, paths, and source symbols", "Icon-library commands for filters, first result, focused-icon details, clearing search, and loading more"],
        improvements: ["Narrow cards show only the icon, a multiline name, and Custom or Symbol type", "Arrow keys plus Home and End move through the visible icon grid"],
        fixes: ["Enter in global search now closes suggestions, renders the catalog matches below, and focuses the first result"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.12",
        date: "2026-08-29T23:30:00.000Z",
        title: "What’s New banner shortcuts",
        summary: "The main-page What’s New banner now provides keyboard commands for viewing release notes or dismissing the notice.",
        features: ["V to view release notes", "X to dismiss the What’s New banner"],
        improvements: ["Shortcut-hint badges and hover descriptions on both banner actions"],
        fixes: ["The dismiss command is available only while the banner is visible on the active page and only for a plain key or the full Shift–Control–Option chord"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.10",
        date: "2026-08-29T22:00:00.000Z",
        title: "Complete multi-repository icon scan",
        summary: "The icon library now scans every sibling application repository, captures complete SVG template literals wherever they appear, and separates SF Symbols from custom artwork.",
        features: ["Generated catalog of 2,975 deduplicated SVG icons", "SF Symbols versus Custom type filter", "Automatic discovery of sibling application directories"],
        improvements: ["McTree McHome and every other contributing sibling repository now appear in the source filter", "Standalone SVG files are included alongside SVG template literals", "Catalog output reports scan and classification totals"],
        fixes: ["SVG template literals no longer require a named variable assignment to be captured", "Repositories outside the former three-directory allowlist are no longer skipped"],
        knownIssues: ["Two oversized world-map canvases are intentionally excluded from the icon catalog.", "GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.9",
        date: "2026-08-29T21:00:00.000Z",
        title: "Single GitHub Pages deployment",
        summary: "Pushes now use the repository’s existing GitHub Pages branch deployment without also starting a redundant custom publishing workflow.",
        features: [],
        improvements: ["One automatic Pages deployment per main-branch push", "Hosting instructions now document the single deployment path"],
        fixes: ["Removed the duplicate push-triggered GitHub Pages workflow"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.8",
        date: "2026-08-29T20:00:00.000Z",
        title: "Searchable SVG icon library",
        summary: "The main workspace now catalogs reusable SVG symbols from the related apps with fast search, source filtering, sorting, and one-click copying.",
        features: ["Generated catalog of 932 deduplicated SVG icons", "Searchable and filterable icon grid", "One-click complete SVG copying"],
        improvements: ["Global search now prioritizes matching icons", "Large result sets render in responsive batches", "Every catalog entry retains aliases and source metadata"],
        fixes: ["The formerly blank workspace now has a focused reusable purpose"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.7",
        date: "2026-08-29T17:00:00.000Z",
        title: "Safari-gray blueprint favicon",
        summary: "The full-bleed favicon now combines Safari’s neutral system gray with the template’s blue construction grid, diagonals, and concentric circles.",
        features: [],
        improvements: ["Safari-default gray favicon background", "Blueprint geometry tuned for small tab sizes"],
        fixes: ["Restored the requested blueprint identity without reintroducing an inset outline"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.6",
        date: "2026-08-29T16:00:00.000Z",
        title: "Full-bleed Safari favicon",
        summary: "Safari now receives a fully opaque gray favicon canvas with no inset shape, transparent margin, or outline treatment.",
        features: [],
        improvements: ["Gray favicon artwork runs edge to edge"],
        fixes: ["Removed the inset squircle and its visible Safari tab outline"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.5",
        date: "2026-08-29T15:00:00.000Z",
        title: "Filled dark-mode favicon",
        summary: "The favicon squircle now uses an appearance-aware solid fill so it remains filled instead of reading as a white outline in dark browser chrome.",
        features: [],
        improvements: ["Gray filled squircle in light browser chrome", "White filled squircle in dark browser chrome"],
        fixes: ["Dark title bars no longer make the favicon interior disappear against the surrounding gray"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.4",
        date: "2026-08-29T12:00:00.000Z",
        title: "Filled favicon and Developer shortcut",
        summary: "The neutral favicon now renders as a solid gray squircle, and the pipe key can toggle Developer Mode directly or with the shortcut chord.",
        features: ["Pipe-key Developer Mode shortcut"],
        improvements: ["Solid gray squircle favicon", "Theme and Developer Mode commands share the app-icon hint badge"],
        fixes: ["Favicon artwork no longer collapses into an outlined guide at small sizes"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.3",
        date: "2026-08-28T12:00:00.000Z",
        title: "Adaptive icons and command hints",
        summary: "The application now uses the supplied light, dark, and gray artwork and reveals available keyboard commands with the Shift–Control–Option chord.",
        features: ["Shift–Control–Option shortcut overlay", "Hover descriptions for shortcut-enabled controls"],
        improvements: ["New light and dark app, install, touch, and splash artwork", "Gray favicon artwork", "Settings now has its own comma shortcut"],
        fixes: ["Shortcut badges stay scoped to the active dialog", "Search remains available with the full modifier chord"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.2",
        date: "2026-08-03T15:00:00.000Z",
        title: "Blank application workspace",
        summary: "The main app area is empty and ready for a future app while Notes, Roadmap, updates, and shortcuts remain available from the shell.",
        features: ["Theme shortcut on the app icon", "Modifier-tolerant global shortcuts"],
        improvements: ["Unaccented Notes toolbar action", "Icon-only release and force-refresh actions", "Roadmap search, filters, and sorting live in Settings"],
        fixes: ["Fresh and unchanged demonstration Notes start blank", "Notes closes from its standard close control without a redundant Done button"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.1",
        date: "2026-08-03T12:00:00.000Z",
        title: "Pre-launch application foundation",
        summary: "A focused local-first shell with centered search, combined storage and GitHub status, and force-refreshable PWA updates.",
        features: ["Single-modal Notes workspace", "Major.minor.patch.build versioning", "Combined Storage & GitHub settings"],
        improvements: ["Centered app-bar search", "Unified floating save and sync status", "Dedicated Notes SF Symbol", "Bottom new-version toast with force refresh"],
        fixes: ["Installed apps can explicitly activate and reload a waiting application update", "The redundant Roadmap navigation strip is removed"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      }
    ],

    roadmap: [
      { id: "road-1", title: "Optional attachment adapter", description: "Document an extension point for local or remote file attachments.", state: "planned", priority: 2, target: "1.2", effort: 3, createdAt: "2026-07-08T12:00:00.000Z" },
      { id: "road-2", title: "Notes print view", description: "Add a clean print layout for the single Notes workspace.", state: "wishlist", priority: 3, target: "Unscheduled", effort: 2, createdAt: "2026-07-20T12:00:00.000Z" },
      { id: "road-3", title: "Local print layout", description: "Add a clean print view for notes and roadmap entries.", state: "planned", priority: 1, target: "1.1", effort: 1, createdAt: "2026-07-29T12:00:00.000Z" },
      { id: "road-4", title: "Focused template foundation", description: "Ship the shell, Notes, Roadmap, sync, recovery, PWA, and settings modules.", state: "released", priority: 1, target: "1.0", effort: 4, createdAt: "2026-06-12T12:00:00.000Z" }
    ],

    help: [
      { id: "start", title: "Getting started", section: "Basics", keywords: "start icons search tags categories copy svg notes roadmap", html: "<p>Press <kbd>/</kbd> to search the icon catalog by name or meaning, use the category chips for instant narrowing, and select any icon card to copy its complete SVG markup. Notes and the replaceable Roadmap remain available from the application shell.</p>" },
      { id: "icons", title: "Finding and copying icons", section: "Features", keywords: "icons svg symbol search semantic tags categories quick select copy clipboard source filter sort catalog compiler", html: "<p>Search by name, alias, semantic tag, category, Symbol/Custom type, repository, or source metadata; multiple search words must all match. Category chips provide immediate filtering without a menu. Press <kbd>Enter</kbd> to move to the grid, choose a card to copy its sanitized SVG, or use the information button for categories, tags, identifiers, aliases, repositories, filenames, paths, and source symbols. Use <kbd>F</kbd> for categories and filters, <kbd>G</kbd> for the first result, <kbd>I</kbd> for focused-icon details, <kbd>C</kbd> to clear search, and <kbd>L</kbd> to show more. The committed catalog is rebuilt with <code>build/compile-icon-library.mjs</code>.</p>" },
      { id: "notes", title: "Working with Notes", section: "Features", keywords: "notes text edit modal autosave", html: "<p>Open Notes from the top bar or press <kbd>N</kbd>. The single plain-text editor saves locally and is included in backup and synchronization data.</p>" },
      { id: "roadmap", title: "Using Roadmap", section: "Features", keywords: "roadmap planned released wishlist priority target effort", html: "<p>Search Roadmap, filter its state, and sort by priority, target release, effort, age, or title. Replace the demonstration entries in configuration.</p>" },
      { id: "backup", title: "Backup and restore", section: "Data", keywords: "json export import backup restore recovery", html: "<p>Export a JSON backup from Settings. Imports are parsed, migrated, sanitized, summarized, and confirmed before replacement. The current copy is saved as a recovery snapshot first.</p>" },
      { id: "sync", title: "GitHub synchronization", section: "Data", keywords: "github cloud sync token conflict merge", html: "<p>GitHub sync is optional. Configure a private repository, branch, JSON file path, and a fine-grained token with Contents access. Conflicts always ask whether to upload, download, merge, or cancel.</p>" },
      { id: "install", title: "Install the application", section: "Installation", keywords: "install add home screen iphone ipad android mac windows pwa offline", html: "<p>Use your browser’s Install app, Add to Home Screen, or Add to Dock command. There is no in-app installation dialog. Once the application shell has loaded, core local features continue to work offline.</p>" },
      { id: "app-icon", title: "App icon controls", section: "Appearance", keywords: "icon theme dark light beta developer mode hold press shortcut pipe", html: "<p>Click or tap the app icon, or press <kbd>T</kbd>, to switch between light and dark themes. Press and hold the icon, or press <kbd>|</kbd> or <kbd>D</kbd>, to enable or disable Developer Mode. The Beta pill appears automatically on a <code>/beta/</code> URL or when <code>?beta=1</code> is present.</p>" },
      { id: "privacy", title: "Privacy and local data", section: "Data", keywords: "privacy local storage token secret", html: "<p>Notes remain in browser storage unless you export them or explicitly use GitHub Sync. Tokens are stored separately per device and excluded from backups and diagnostics.</p>" },
      { id: "shortcuts", title: "Keyboard access", section: "Accessibility", keywords: "keyboard shortcuts slash escape alt option shift control hints hover version pipe developer", html: "<p>Press <kbd>/</kbd> for global search, <kbd>N</kbd> for Notes, <kbd>V</kbd> for What’s New, <kbd>T</kbd> for the theme, <kbd>|</kbd> or <kbd>D</kbd> for Developer Mode, <kbd>,</kbd> for Settings, and <kbd>H</kbd> or <kbd>?</kbd> for Help. On the main-page What’s New banner, use <kbd>V</kbd> to view release notes and <kbd>X</kbd> to dismiss the notice. In the icon library, use <kbd>F</kbd> for categories and filters plus <kbd>G</kbd>, <kbd>I</kbd>, <kbd>C</kbd>, and <kbd>L</kbd> for the visible module actions. Commands work directly or with Shift–Control–Option held. Hold that chord to reveal available shortcut badges, and hover a shortcut-enabled control for its full command.</p>" }
    ]
  };

  window.LocalApp.config = Object.freeze(CONFIG);
})();
