(function () {
  "use strict";

  window.LocalApp = window.LocalApp || {};

  const CONFIG = {
    identity: {
      name: "App Template",
      shortName: "Template",
      description: "A searchable local SVG icon library for finding and copying reusable interface symbols.",
      version: "0.0.1.32",
      buildId: "0.0.1.32",
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
      maxDocumentHtmlLength: 250000,
      maxIconOverrides: 5000
    },

    statuses: [
      { id: "active", label: "Active", icon: "●", color: "#2f7d68" },
      { id: "paused", label: "Paused", icon: "Ⅱ", color: "#a86a1f" },
      { id: "complete", label: "Complete", icon: "✓", color: "#4f6f52" },
      { id: "idea", label: "Idea", icon: "◇", color: "#7058a3" }
    ],

    themeDefaults: { accent: "#315f73", accent2: "#b86b4b", success: "#4f745f", warning: "#9b6a24", danger: "#a74747" },

    releases: [
      {
        version: "0.0.1.32",
        date: "2026-09-03T00:04:13.000Z",
        title: "Add focused semantic categories",
        summary: "Five focused categories make home, sports, clothing, celebration, and education symbols faster to find.",
        features: ["Home & Appliances, Sports & Recreation, Clothing & Personal Items, Celebrations & Awards, and Education & Science filters", "Semantic search tags for every icon assigned to the new categories"],
        improvements: ["The new filters preserve useful broader memberships such as Games, People, Commerce, Devices, and Locations", "Eight newly supplied building edits are baked into the 266-entry permanent override set"],
        fixes: [],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.31",
        date: "2026-09-02T23:49:36.000Z",
        title: "Classify objects and tools",
        summary: "Every Objects & Tools icon now participates in the relevant semantic filters, while Building joins the compact appearance section.",
        features: ["A Building appearance filter with 91 matching icons", "All 1,499 Objects & Tools icons assigned to at least one additional semantic category"],
        improvements: ["The latest 70 supplied metadata edits are baked into the 258-entry permanent override set", "Home fixtures, electronics, sports equipment, clothing, media, safety gear, and other objects receive more useful search tags and category placement"],
        fixes: ["Distinct drawings that share a source name retain unique, stable icon IDs", "Both volcano variants now accept their intended baked metadata overrides"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.30",
        date: "2026-09-02T23:25:46.000Z",
        title: "Expand objects and stabilize icon browsing",
        summary: "The catalog adds the complete Objects & Tools collection, keeps Other visible at zero, and fixes Safari’s sticky filter-rail behavior.",
        features: ["All 1,499 deduplicated icons from the requested 1,504-file Objects & Tools source collection", "A persistent Other quick filter directly below All, including its zero count"],
        improvements: ["The compiler explicitly reads Objects & Tools without broadly scanning the !backups:data parent", "Previously compiled icons remain available when their former source folder is no longer part of the active scan", "The catalog now contains 4,042 unique icons"],
        fixes: ["Horizontal overflow containment no longer creates the Safari scroll ancestor that released the sticky category rail", "All Objects & Tools source icons remain in their requested category after permanent metadata overrides"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.29",
        date: "2026-09-02T19:56:27.000Z",
        title: "Fix icon rendering and baked override cleanup",
        summary: "The category rail now stays fixed while browsing, Nature has useful child filters, and baked metadata automatically leaves the pending override set.",
        features: ["Animals & Plants and Weather subcategories nested under Nature", "All 191 supplied icon metadata overrides baked into the catalog"],
        improvements: ["A dedicated sticky wrapper keeps the filter rail in view while its own long contents remain scrollable", "Device-local overrides are automatically removed after their values match the compiled catalog"],
        fixes: ["X Square Fill now uses the actual X artwork on a transparent canvas", "Metadata edits that would leave an icon ungrouped fall back to Interface"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.28",
        date: "2026-09-02T19:13:56.000Z",
        title: "Organize icon categories by meaning and appearance",
        summary: "The sticky filter rail now separates subject categories from visual treatments and gives every retained icon a useful classification.",
        features: ["Distinct What it is and How it looks category sections", "New Locations, Games, Apps & Branding, and nested Text Formatting destinations"],
        improvements: ["Maps and Maps & Travel are consolidated into Locations", "Connectivity is combined with Devices", "The former Other set was audited from 385 icons to zero retained uncategorized icons"],
        fixes: ["Legacy Maps, Maps & Travel, and Other metadata migrate into the new category structure", "Generated dist bundles are ignored so malformed build artifacts do not enter the catalog"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.27",
        date: "2026-09-02T18:13:36.000Z",
        title: "Show Developer Mode divider feedback",
        summary: "Developer Mode now exposes live proportional feedback while resizing the icon filter rail.",
        features: ["Live filter-rail percentage shown only while pointer dragging in Developer Mode"],
        improvements: ["The readout follows the divider and updates against the available catalog width"],
        fixes: ["Normal mode remains uncluttered and keyboard resizing retains its accessible pixel value", "SVG Converter’s aggregate !All folder is skipped so duplicate provenance does not churn the compiled catalog"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.26",
        date: "2026-09-02T04:46:13.000Z",
        title: "Widen icon cards and unify metadata editing",
        summary: "The catalog keeps its normal label size on wider cards, metadata fields are consistent, and Appearance settings are simpler.",
        features: ["All 82 supplied icon metadata overrides baked into the catalog"],
        improvements: ["Every icon card is wider so the long Arrow Trianglehead label fits four lines without shrinking", "Icon details and the complete metadata editor use the same Name and Type field layout", "The Icon details Edit metadata action and icon-name action continue to open the same complete editor"],
        fixes: ["Removed Primary, Secondary, Success, Warning, and Danger color controls from Settings"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.25",
        date: "2026-09-02T04:23:06.000Z",
        title: "Refine icon details and overrides",
        summary: "Icon details now edits names and types directly, while the supplied metadata changes are permanent in the compiled catalog.",
        features: ["Direct Name and Type fields in Icon details", "Portable Custom/Symbol type overrides in local state and exported update files", "All 75 supplied icon metadata overrides baked into the catalog"],
        improvements: ["Very long icon names use a compact four-line presentation", "The advanced icon editor is clearly reserved for groups and filter source"],
        fixes: ["Removed the malformed E Push T Segment Prefix T I To String 16 E Push T E Push extraction at compile time"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.24",
        date: "2026-09-02T04:08:33.000Z",
        title: "Add eight curated icon collections",
        summary: "Eight SVG Converter collections now have complete source-aware quick categories that survive artwork deduplication.",
        features: ["Accessibility with all 122 requested source files", "Editing with all 163 requested source files", "Keyboard with all 104 requested source files", "Maps with all 141 requested source files", "Math with all 101 requested source files", "Media with all 106 requested source files", "Privacy & Security with all 155 requested source files", "Transportation with all 119 requested source files"],
        improvements: ["Source-folder assignments remain attached when matching artwork merges with another repository", "Category names become semantic search tags and quick-filter choices"],
        fixes: ["Privacy & Security replaces the shorter Security label without changing its compatible stored category id"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.23",
        date: "2026-09-01T22:16:37.000Z",
        title: "Streamline icon metadata and categories",
        summary: "Icon names and filter sources are editable, category branches collapse persistently, the Badge taxonomy gains nested shape variants, and Appearance is more compact.",
        features: ["Direct name and group editing from every icon label plus editable filter source from Icon details", "Persistent collapsible category branches with Badged → Shapes and Exclamation Mark variants", "Right-click removal from the selected category with Undo", "Six supplied icon metadata overrides baked into the compiled catalog"],
        improvements: ["The refreshed sibling-source scan adds 750 SF Symbols for a 3,130-icon catalog", "Cloud/Server is now Cloud & Drive, while Rays and Sparkled are combined as Rays & Sparkles", "Wider icon cards fit Counterclockwise on one line at the default size", "One sliding text-size control adjusts application and reading text together", "Button presentation now follows color mode in Appearance"],
        fixes: ["Theme presets and the manual motion override no longer clutter Settings", "Nested group parents are preserved automatically in local and compiled overrides", "Reduced-motion behavior continues to follow the device preference"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.22",
        date: "2026-09-01T21:38:33.000Z",
        title: "Add Health, Nature, and Rays collections",
        summary: "The icon catalog now guarantees complete Health, Nature, and Rays source coverage, with Rays available as its own quick category.",
        features: ["All 133 SVGs from SVG Converter’s !Health collection", "All 159 SVGs from SVG Converter’s !Nature collection", "All 8 SVGs from SVG Converter’s !Rays collection and a dedicated Rays quick category"],
        improvements: ["Source-aware Health and Nature assignments survive deduplication", "Rays search and filtering include semantic ray, laser, and burst terms"],
        fixes: ["Icons from the three requested collections can no longer fall outside their intended quick category after merging with another source"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.21",
        date: "2026-09-01T21:11:36.000Z",
        title: "Accelerate and refine icon browsing",
        summary: "The catalog now shows 500 icons per batch, adds explicit Time-source coverage, simplifies override export, and provides a Developer Mode label-length filter.",
        features: ["All 49 SVGs from SVG Converter’s requested !Time collection—now organized as Time—remain classified under Time", "Developer Mode filtering by minimum label character count", "Compact icon override export as a simple JSON array accepted directly by the compiler"],
        improvements: ["Icon result batches increased from 120 to 500", "Up and Down Arrow keys activate the adjacent category in the vertical filter rail", "Generated and locally edited labels automatically remove the Svgrepo Com suffix"],
        fixes: ["Circle, Multiple, and Slash no longer appear as nested Badge subcategories", "Stored selections for removed icon categories recover to All"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.20",
        date: "2026-09-01T20:33:16.000Z",
        title: "Add complete Badge subcategories",
        summary: "The catalog adds the complete !Badge source collection and 42 suffix-specific nested choices, including a plain Badge subtype.",
        features: ["All 646 SVGs from SVG Converter’s !Badge source folder", "Forty-two nested Badged subcategories derived from the badge artwork suffix", "A plain Badge subtype for symbols whose badge has no additional content"],
        improvements: ["Catalog expanded to 2,296 unique icons while retaining deduplicated source provenance", "The metadata editor lays out the expanded Badged choices in a compact responsive grid", "Source-aware Badged assignment includes circlebadge, trianglebadge, and plain badge variants"],
        fixes: ["Badge subcategories use content after the badge token, so base-icon terms no longer create false subtype matches"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.19",
        date: "2026-09-01T18:34:26.000Z",
        title: "Edit icon metadata and add Weather",
        summary: "Icons can now be renamed and moved among groups locally, exported as compiler-ready updates, and browsed with the complete Weather source collection.",
        features: ["An accessible icon metadata editor for display names and multi-group membership", "A downloadable update JSON that the catalog compiler consumes for permanent changes", "All 173 SVGs from SVG Converter’s weather source folder"],
        improvements: ["Icon edits persist through reload, JSON backup, and GitHub Sync while Reset Preferences preserves them", "Source-aware Weather assignment survives icon deduplication", "The compiler reports applied and missing hardcoded overrides"],
        fixes: ["Same-name SF Symbol merges are counted once in compiler diagnostics"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.18",
        date: "2026-09-01T14:59:12.000Z",
        title: "Refine icon browsing and add Sparkles",
        summary: "The icon catalog adds nested badge categories, a resizable filter rail, denser cards, and the complete Sparkles source collection.",
        features: ["Plus, Minus, Checkmark, and Xmark subcategories nested under Badged", "A draggable filter-rail divider with remembered width and keyboard resizing", "All 26 SVGs from SVG Converter’s sparkles source folder"],
        improvements: ["Shorter icon cards and a smaller information control increase visible catalog density", "Source-aware Sparkled assignment survives icon deduplication", "The filter rail supports pointer, touch, Left and Right Arrow, Home, and End resizing"],
        fixes: ["Badge subcategories require both badge and subtype metadata so unrelated action symbols are excluded"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.17",
        date: "2026-09-01T04:43:05.000Z",
        title: "Expand icon categories and update controls",
        summary: "The icon catalog adds a shape-focused source collection and five quick categories, while the New version available notice gains full shortcut support.",
        features: ["Shapes category containing all 110 SVGs from SVG Converter’s shapes source folder", "Badged, Squared, Circled, Slashed, and Sparkled quick categories", "R to Force Refresh and X to close the New version available notice, directly or with Shift–Control–Option"],
        improvements: ["Shorter desktop category controls fit more quick filters on screen", "Source-aware Shapes assignment survives icon deduplication", "Update buttons participate in shortcut hints and hover descriptions"],
        fixes: ["Update-notice shortcuts remain inactive while a dialog owns keyboard focus", "Dynamic toast shortcuts are cleared before later notifications"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.16",
        date: "2026-08-31T18:56:38.000Z",
        title: "Expand browsing and add Cloud/Server icons",
        summary: "The catalog now uses the full workspace width, adds a dedicated Cloud/Server category, and simplifies its compact filter rail.",
        features: ["Cloud/Server category containing every SVG from SVG Converter’s server:drive source folder", "Source-aware category assignment that survives icon deduplication"],
        improvements: ["Full-width catalog below the application bar", "Shorter desktop category controls fit more quick filters on screen"],
        fixes: ["Removed the unnecessary icon sort preference while retaining predictable alphabetical results"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
      {
        version: "0.0.1.15",
        date: "2026-08-31T20:00:00.000Z",
        title: "Clean icon sources and filter rail",
        summary: "Corrupted SVG Converter exports and repeated SF Symbols are removed, while categories and filters move into a persistent vertical workspace rail.",
        features: ["Sticky vertical category and filter rail on desktop and tablet", "Responsive compact filter surface on mobile"],
        improvements: ["Catalog reduced to 1,327 unique icons while preserving merged source provenance", "Retained SF Symbol paint is normalized to currentColor for dependable previewing and reuse"],
        fixes: ["Excluded SVG Converter output folders whose missing transparent-rectangle opacity produced filled square backgrounds", "Coalesced repeated SF Symbol names even when their source markup differs"],
        knownIssues: ["GitHub Sync requires a user-provided repository and fine-grained token."]
      },
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
      { id: "start", title: "Getting started", section: "Basics", keywords: "start icons search tags categories objects tools other health nature rays cloud server shapes badged plus minus checkmark xmark squared circled slashed sparkled copy svg resize divider rename right click notes roadmap", html: "<p>Press <kbd>/</kbd> to search the icon catalog by name or meaning, use the compact category and filter rail for instant narrowing, select a preview to copy its complete SVG markup, or select its name to edit it directly. On desktop and tablet, the rail stays beside the scrolling results; drag its divider or use the divider’s arrow keys to resize it. Notes and the replaceable Roadmap remain available from the application shell.</p>" },
      { id: "icons", title: "Finding and copying icons", section: "Features", keywords: "icons svg symbol search semantic tags categories accessibility celebrations awards clothing personal editing education science text formatting games sports recreation home appliances locations maps objects tools other health keyboard math media nature animals plants privacy security rays sparkles cloud drive building shapes badged time transportation weather plus minus checkmark xmark squared circled slashed quick select collapse copy clipboard rename right click remove undo source filter resize divider catalog compiler arrows", html: "<p>Search by name, alias, semantic tag, category, Symbol/Custom type, repository, or source metadata; multiple search words must all match. Other stays directly below All so uncategorized icons are immediately visible, even when its count is zero. The desktop rail stays visible while results scroll and separates semantic <strong>What it is</strong> categories—including Celebrations &amp; Awards, Clothing &amp; Personal Items, Education &amp; Science, Home &amp; Appliances, Sports &amp; Recreation, Objects &amp; Tools, and Nature’s Animals &amp; Plants and Weather children—from the smaller <strong>How it looks</strong> set: Badged, Building, Circled, Squared, Slashed, Shapes, and Rays &amp; Sparkles. Every Objects &amp; Tools icon also belongs to at least one relevant semantic category. Category branches can be collapsed and their state is remembered. Use Up and Down Arrow while a category is focused to activate the adjacent category. Drag the divider to change the rail width, or focus it and use Left/Right, Home, or End; the width is remembered. Results stay alphabetical and appear 500 at a time. Press <kbd>Enter</kbd> to move to the grid, choose a preview to copy its sanitized SVG, select its name to edit metadata, right-click it to remove it from the selected category with Undo, or use the information button for tags, original source details, and the editable filter source. Use <kbd>F</kbd> for categories and filters, <kbd>G</kbd> for the first result, <kbd>I</kbd> for focused-icon details, <kbd>C</kbd> to clear search, and <kbd>L</kbd> to show more. The committed catalog is rebuilt with <code>build/compile-icon-library.mjs</code>.</p>" },
      { id: "icon-overrides", title: "Icon overrides", section: "Features", keywords: "icon rename type custom symbol groups source right click remove undo override export json compiler feed back developer baked pending", html: "<p>Open Icon details to edit Name and Type immediately, or select an icon name to edit Name, Type, groups, and the source used by repository filtering while retaining every original file reference. When a category is selected, right-click an icon to remove it from that group and use Undo if needed. Choose <strong>Export overrides</strong> in the editor or Developer Mode to download a compact array containing icon IDs, labels, category IDs, and optional type and source values. Attach that file in a future request to hard-code the changes, or use it directly as <code>build/icon-library-overrides.json</code>; the compiler also accepts the wrapped format, whose optional <code>excludedIconIds</code> list permanently rejects unwanted extractions. Once an update matches the compiled catalog, the app automatically removes it from the local pending override set.</p>" },
      { id: "notes", title: "Working with Notes", section: "Features", keywords: "notes text edit modal autosave", html: "<p>Open Notes from the top bar or press <kbd>N</kbd>. The single plain-text editor saves locally and is included in backup and synchronization data.</p>" },
      { id: "roadmap", title: "Using Roadmap", section: "Features", keywords: "roadmap planned released wishlist priority target effort", html: "<p>Search Roadmap, filter its state, and sort by priority, target release, effort, age, or title. Replace the demonstration entries in configuration.</p>" },
      { id: "backup", title: "Backup and restore", section: "Data", keywords: "json export import backup restore recovery", html: "<p>Export a JSON backup from Settings. Imports are parsed, migrated, sanitized, summarized, and confirmed before replacement. The current copy is saved as a recovery snapshot first.</p>" },
      { id: "sync", title: "GitHub synchronization", section: "Data", keywords: "github cloud sync token conflict merge", html: "<p>GitHub sync is optional. Configure a private repository, branch, JSON file path, and a fine-grained token with Contents access. Conflicts always ask whether to upload, download, merge, or cancel.</p>" },
      { id: "install", title: "Install the application", section: "Installation", keywords: "install add home screen iphone ipad android mac windows pwa offline update refresh shortcut", html: "<p>Use your browser’s Install app, Add to Home Screen, or Add to Dock command. There is no in-app installation dialog. Once the application shell has loaded, core local features continue to work offline. When a new version is ready, press <kbd>R</kbd> to Force Refresh or <kbd>X</kbd> to close its notice.</p>" },
      { id: "app-icon", title: "App icon controls", section: "Appearance", keywords: "icon theme dark light beta developer mode hold press shortcut pipe", html: "<p>Click or tap the app icon, or press <kbd>T</kbd>, to switch between light and dark themes. Press and hold the icon, or press <kbd>|</kbd> or <kbd>D</kbd>, to enable or disable Developer Mode. The Beta pill appears automatically on a <code>/beta/</code> URL or when <code>?beta=1</code> is present.</p>" },
      { id: "privacy", title: "Privacy and local data", section: "Data", keywords: "privacy local storage token secret", html: "<p>Notes remain in browser storage unless you export them or explicitly use GitHub Sync. Tokens are stored separately per device and excluded from backups and diagnostics.</p>" },
      { id: "shortcuts", title: "Keyboard access", section: "Accessibility", keywords: "keyboard shortcuts slash escape alt option shift control hints hover version update refresh pipe developer", html: "<p>Press <kbd>/</kbd> for global search, <kbd>N</kbd> for Notes, <kbd>V</kbd> for What’s New, <kbd>T</kbd> for the theme, <kbd>|</kbd> or <kbd>D</kbd> for Developer Mode, <kbd>,</kbd> for Settings, and <kbd>H</kbd> or <kbd>?</kbd> for Help. On the main-page What’s New banner, use <kbd>V</kbd> to view release notes and <kbd>X</kbd> to dismiss the notice. When New version available is visible, use <kbd>R</kbd> to Force Refresh and <kbd>X</kbd> to close it. In the icon library, use <kbd>F</kbd> for categories and filters plus <kbd>G</kbd>, <kbd>I</kbd>, <kbd>C</kbd>, and <kbd>L</kbd> for the visible module actions. Commands work directly or with Shift–Control–Option held. Hold that chord to reveal available shortcut badges, and hover a shortcut-enabled control for its full command.</p>" }
    ]
  };

  window.LocalApp.config = Object.freeze(CONFIG);
})();
