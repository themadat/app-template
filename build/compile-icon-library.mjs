#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceParent = path.dirname(projectRoot);
const outputFile = path.join(projectRoot, "assets/js/icon-library.js");
const overrideFile = path.join(projectRoot, "build/icon-library-overrides.json");
const requestedRoots = process.argv.slice(2);

function discoverDefaultSources() {
  return fs.readdirSync(sourceParent, { withFileTypes: true }).filter(function (entry) {
    return entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "backups";
  }).map(function (entry) {
    return { name: entry.name, root: path.join(sourceParent, entry.name) };
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });
}

const sources = requestedRoots.length ? requestedRoots.map(function (root) {
  const resolved = path.resolve(root);
  return { name: path.basename(resolved), root: resolved };
}) : discoverDefaultSources();

const TEXT_EXTENSIONS = new Set([".cjs", ".html", ".htm", ".js", ".jsx", ".md", ".mjs", ".ts", ".tsx"]);
const SKIP_DIRECTORIES = new Set([".git", "dist", "node_modules"]);
const MAX_STANDALONE_SVG_BYTES = 256 * 1024;
const FORBIDDEN_SVG = /<(?:script|foreignObject)\b|javascript\s*:|\son[a-z]+\s*=/i;
const FORBIDDEN_REFERENCE = /(?:href|xlink:href)\s*=\s*["'](?!#)|@import\b|url\(\s*["']?(?:https?:|\/\/)/i;
const recordsByHash = new Map();
const sfRecordsByName = new Map();
const iconRecords = new Set();
const stats = { files: 0, extracted: 0, templateLiterals: 0, inlineMarkup: 0, standalone: 0, rejected: 0, skippedOversized: 0, skippedGenerated: 0, mergedBySfName: 0 };

function walk(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".") && entry.isDirectory()) continue;
      if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else files.push(absolute);
    }
  }
  return files.sort();
}

function cleanSvg(svg) {
  let value = String(svg || "").trim();
  const start = value.search(/<svg\b/i);
  const end = value.toLowerCase().lastIndexOf("</svg>");
  if (start >= 0 && end >= start) value = value.slice(start, end + 6);
  value = value.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "");
  if (!/^<svg\b[\s\S]*<\/svg>$/i.test(value) || FORBIDDEN_SVG.test(value) || FORBIDDEN_REFERENCE.test(value) || value.includes("${")) return "";
  value = value.replace(/\s(?:aria-hidden|focusable)=(?:"[^"]*"|'[^']*')/gi, "");
  value = value.replace(/^<svg\b([^>]*)>/i, '<svg$1 aria-hidden="true" focusable="false">');
  return value;
}

function normalizeSfSymbolPaint(svg) {
  return svg.replace(/\sfill=(["'])(?:white|black|#fff(?:fff)?|#000(?:000)?)\1/gi, ' fill="currentColor"');
}

function canonicalSvg(svg) {
  return svg
    .replace(/\sclass=(?:"sf-symbol"|'sf-symbol')/gi, "")
    .replace(/\s(?:aria-hidden|focusable)=(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedName(rawName) {
  let name = String(rawName || "").replace(/^_+/, "");
  if (name.includes("__")) name = name.split("__").filter(Boolean).pop();
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "unnamed_icon";
}

function labelFor(name) {
  const label = name.split("_").filter(Boolean).map(function (part) {
    if (/^\d+x\d+$/.test(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
  return cleanIconLabel(label) || "Icon";
}

function cleanIconLabel(value) {
  return String(value || "")
    .replace(/\bsvg\s*repo\s*com\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ICON_CATEGORIES = [
  { id: "actions", label: "Actions", terms: ["add", "plus", "minus", "copy", "duplicate", "delete", "trash", "download", "upload", "share", "export", "import", "refresh", "reload", "undo", "redo", "save", "print", "scan", "bake", "dismiss", "hide", "manage", "wrench"] },
  { id: "accessibility", label: "Accessibility", terms: ["accessibility", "assistive", "braille", "ear", "figure", "voiceover", "wheelchair"] },
  { id: "arrows", label: "Arrows", terms: ["arrow", "arrowshape", "arrowtriangle", "chevron", "caret", "direction", "forward", "backward"] },
  { id: "branding", label: "Apps & Branding", terms: ["favicon", "logo", "splash", "safari"] },
  { id: "communication", label: "Communication", terms: ["message", "chat", "bubble", "mail", "envelope", "paperplane", "phone", "call", "megaphone", "bell", "notification", "mention"] },
  { id: "commerce", label: "Commerce", terms: ["cart", "bag", "basket", "credit", "currency", "dollar", "bank", "wallet", "gift", "receipt", "tag"] },
  { id: "devices", label: "Devices & Connectivity", terms: ["desktop", "laptop", "computer", "tablet", "iphone", "ipad", "mobile", "watch", "keyboard", "mouse", "printer", "display", "monitor", "television", "tv", "antenna", "bonjour", "cellularbars", "hotspot", "personalhotspot", "radiowaves", "wifi"] },
  { id: "cloud-server", label: "Cloud & Drive", terms: ["cloud", "icloud", "server", "drive", "externaldrive", "internaldrive", "opticaldiscdrive", "storage", "database", "network"] },
  { id: "documents", label: "Documents", terms: ["document", "doc", "file", "folder", "page", "paper", "note", "clipboard", "book", "text", "list", "archive", "archivebox", "bookmark", "data", "json"] },
  { id: "editing", label: "Editing", terms: ["pencil", "pen", "highlight", "highlighter", "crop", "scissors", "ruler", "paint", "eyedropper", "slider", "textformat", "editor", "legend"] },
  { id: "text-formatting", label: "Text Formatting", parent: "editing", terms: ["abc", "a z", "bold", "italic", "underline", "strikethrough", "paragraphsign", "quotelevel", "indent", "kashida", "fleuron", "textbox", "uppercase", "lowercase", "phonetic"] },
  { id: "food-drink", label: "Food & Drink", terms: ["bar", "cocktail", "drink", "glass", "wine", "wineglass", "beer", "cup", "mug", "fork", "knife", "spoon", "food", "restaurant", "bottle", "coffee"] },
  { id: "games", label: "Games", terms: ["game", "meeple", "dice", "castle", "abbey", "wizard", "witch", "mage", "fairy", "elf", "dragon", "sheep", "wolf", "robber", "princess", "knight", "spartan", "crown", "medieval", "ringmaster", "pigsty", "baazar", "vineyard"] },
  { id: "health", label: "Health", terms: ["heart", "medical", "medicine", "pill", "bandage", "stethoscope", "health", "hospital", "fitness", "dumbbell"] },
  { id: "interface", label: "Interface", terms: ["menu", "sidebar", "toolbar", "window", "panel", "grid", "ellipsis", "gear", "gearshape", "settings", "magnifyingglass", "search", "filter", "sort", "terminal", "curlybraces", "widget", "dock", "menubar", "inset", "gauge", "target", "swatchpalette", "chart", "table", "fit", "mode", "lightbulb", "line", "link", "pip", "view"] },
  { id: "keyboard", label: "Keyboard", terms: ["keyboard", "command", "control", "option", "shift", "capslock", "escape", "return", "delete", "fn"] },
  { id: "locations", label: "Locations", terms: ["map", "location", "mappin", "pin", "globe", "compass", "signpost", "scope", "country", "continent", "earth", "landmark", "monument", "building", "cathedral", "church", "lighthouse", "stadium", "university", "campus", "bridge", "tower", "road", "park", "backpack", "obelisk", "wall"] },
  { id: "math", label: "Math", terms: ["123", "function", "sum", "number", "percent", "divide", "multiply", "equal", "greaterthan", "lessthan", "plusminus", "radical"] },
  { id: "media", label: "Media", terms: ["play", "pause", "stop", "video", "camera", "photo", "image", "music", "speaker", "volume", "microphone", "waveform", "record"] },
  { id: "nature", label: "Nature", terms: ["leaf", "tree", "flower", "plant", "mountain", "water", "animal", "dog", "cat", "bird", "fish", "dinosaur", "raptor", "velociraptor", "volcano"] },
  { id: "rays-sparkles", label: "Rays & Sparkles", section: "appearance", terms: ["ray", "rays", "laser", "burst", "sparkle", "sparkles"] },
  { id: "people", label: "People", terms: ["person", "people", "user", "figure", "face", "hand", "body", "accessibility"] },
  { id: "security", label: "Privacy & Security", terms: ["lock", "key", "shield", "privacy", "secure", "password", "faceid", "touchid", "eye off"] },
  { id: "shapes", label: "Shapes", section: "appearance", terms: ["circle", "square", "rectangle", "triangle", "diamond", "hexagon", "shape", "ring"] },
  { id: "badged", label: "Badged", section: "appearance", terms: ["badge", "trianglebadge", "circlebadge"] },
  { id: "badged-badge", label: "Badge", parent: "badged", terms: ["badge"] },
  { id: "badged-airplane", label: "Airplane", parent: "badged", terms: ["airplane"] },
  { id: "badged-arrow", label: "Arrow", parent: "badged", terms: ["arrow"] },
  { id: "badged-automatic", label: "Automatic", parent: "badged", terms: ["automatic"] },
  { id: "badged-bolt", label: "Bolt", parent: "badged", terms: ["bolt"] },
  { id: "badged-camera", label: "Camera", parent: "badged", terms: ["camera"] },
  { id: "badged-checkmark", label: "Checkmark", parent: "badged", terms: ["checkmark"] },
  { id: "badged-chevron", label: "Chevron", parent: "badged", terms: ["chevron"] },
  { id: "badged-clock", label: "Clock", parent: "badged", terms: ["clock"] },
  { id: "badged-creditcard", label: "Credit Card", parent: "badged", terms: ["creditcard"] },
  { id: "badged-ellipsis", label: "Ellipsis", parent: "badged", terms: ["ellipsis"] },
  { id: "badged-exclamationmark", label: "Exclamation Mark", parent: "badged", terms: ["exclamationmark"] },
  { id: "badged-exclamationmark-circle", label: "Circle", parent: "badged-exclamationmark", terms: ["circle"] },
  { id: "badged-exclamationmark-triangle", label: "Triangle", parent: "badged-exclamationmark", terms: ["triangle"] },
  { id: "badged-eye", label: "Eye", parent: "badged", terms: ["eye"] },
  { id: "badged-gauge", label: "Gauge", parent: "badged", terms: ["gauge"] },
  { id: "badged-gearshape", label: "Gear", parent: "badged", terms: ["gearshape"] },
  { id: "badged-icloud", label: "iCloud", parent: "badged", terms: ["icloud"] },
  { id: "badged-key", label: "Key", parent: "badged", terms: ["key"] },
  { id: "badged-location", label: "Location", parent: "badged", terms: ["location"] },
  { id: "badged-lock", label: "Lock", parent: "badged", terms: ["lock"] },
  { id: "badged-magnifyingglass", label: "Magnifying Glass", parent: "badged", terms: ["magnifyingglass"] },
  { id: "badged-microphone", label: "Microphone", parent: "badged", terms: ["microphone"] },
  { id: "badged-minus", label: "Minus", parent: "badged", terms: ["minus"] },
  { id: "badged-moon", label: "Moon", parent: "badged", terms: ["moon"] },
  { id: "badged-pause", label: "Pause", parent: "badged", terms: ["pause"] },
  { id: "badged-person", label: "Person", parent: "badged", terms: ["person"] },
  { id: "badged-play", label: "Play", parent: "badged", terms: ["play"] },
  { id: "badged-plus", label: "Plus", parent: "badged", terms: ["plus"] },
  { id: "badged-questionmark", label: "Question Mark", parent: "badged", terms: ["questionmark"] },
  { id: "badged-record", label: "Record", parent: "badged", terms: ["record"] },
  { id: "badged-shapes", label: "Shapes", parent: "badged", terms: [] },
  { id: "badged-shapes-shield", label: "Shield", parent: "badged-shapes", terms: ["shield"] },
  { id: "badged-shapes-triangle", label: "Triangle", parent: "badged-shapes", terms: ["triangle"] },
  { id: "badged-snowflake", label: "Snowflake", parent: "badged", terms: ["snowflake"] },
  { id: "badged-sparkles", label: "Sparkles", parent: "badged", terms: ["sparkles"] },
  { id: "badged-star", label: "Star", parent: "badged", terms: ["star"] },
  { id: "badged-steeringwheel", label: "Steering Wheel", parent: "badged", terms: ["steeringwheel"] },
  { id: "badged-timemachine", label: "Time Machine", parent: "badged", terms: ["timemachine"] },
  { id: "badged-video", label: "Video", parent: "badged", terms: ["video"] },
  { id: "badged-waveform", label: "Waveform", parent: "badged", terms: ["waveform"] },
  { id: "badged-wifi", label: "Wi-Fi", parent: "badged", terms: ["wifi"] },
  { id: "badged-xmark", label: "Xmark", parent: "badged", terms: ["xmark"] },
  { id: "squared", label: "Squared", section: "appearance", terms: ["square"] },
  { id: "circled", label: "Circled", section: "appearance", terms: ["circle"] },
  { id: "slashed", label: "Slashed", section: "appearance", terms: ["slash", "slashed"] },
  { id: "status", label: "Status", terms: ["check", "checkmark", "xmark", "close", "exclamation", "warning", "info", "question", "error", "success", "badge", "medal"] },
  { id: "time", label: "Time", terms: ["clock", "calendar", "timer", "hourglass", "alarm", "date"] },
  { id: "transportation", label: "Transportation", terms: ["car", "bus", "train", "tram", "plane", "airplane", "boat", "ferry", "bicycle", "scooter", "vehicle", "transportation"] },
  { id: "weather", label: "Weather", terms: ["sun", "cloud", "rain", "snow", "wind", "temperature", "moon", "bolt", "lightning"] }
];

const ICON_CATEGORY_ALIASES = new Map([
  ["maps-travel", "locations"],
  ["maps", "locations"],
  ["rays", "rays-sparkles"],
  ["sparkled", "rays-sparkles"],
  ["badged-shield", "badged-shapes-shield"]
]);
const ICON_CATEGORY_BY_ID = new Map(ICON_CATEGORIES.map(function (category) { return [category.id, category]; }));

function normalizeCategoryIds(values) {
  const selected = new Set((Array.isArray(values) ? values : []).map(function (categoryId) {
    const value = String(categoryId || "").trim();
    return ICON_CATEGORY_ALIASES.get(value) || value;
  }).filter(function (categoryId) { return categoryId === "other" || ICON_CATEGORY_BY_ID.has(categoryId); }));
  Array.from(selected).forEach(function (categoryId) {
    let parent = ICON_CATEGORY_BY_ID.get(categoryId)?.parent || "";
    while (parent) {
      selected.add(parent);
      parent = ICON_CATEGORY_BY_ID.get(parent)?.parent || "";
    }
  });
  return ICON_CATEGORIES.map(function (category) { return category.id; }).concat(["other"]).filter(function (categoryId) { return selected.has(categoryId); });
}

function loadIconOverrides() {
  if (!fs.existsSync(overrideFile)) return { overrides: [], excludedIconIds: [] };
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(overrideFile, "utf8"));
  } catch (error) {
    throw new Error("Could not parse " + path.relative(projectRoot, overrideFile) + ": " + error.message);
  }
  const overrideItems = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.overrides) ? parsed.overrides : null;
  const wrappedFormatIsValid = !parsed || Array.isArray(parsed) || ((!parsed.format || parsed.format === "app-template-icon-library-overrides") && (!parsed.formatVersion || parsed.formatVersion === 1));
  if (!overrideItems || !wrappedFormatIsValid) {
    throw new Error("The icon override file has an unsupported format.");
  }
  const excludedIconIds = Array.isArray(parsed) ? [] : Array.from(new Set((Array.isArray(parsed.excludedIconIds) ? parsed.excludedIconIds : []).map(function (iconId) {
    return String(iconId || "").trim().slice(0, 160);
  }).filter(Boolean)));
  const sourceIds = new Set(sources.map(function (source) { return source.name; }));
  const seen = new Set();
  const overrides = overrideItems.map(function (item, index) {
    const source = item && typeof item === "object" && !Array.isArray(item) ? item : {};
    const iconId = String(source.iconId || "").trim().slice(0, 160);
    const label = cleanIconLabel(source.label).slice(0, 120);
    if (!iconId || !label || !Array.isArray(source.categories)) throw new Error("Invalid icon override at position " + (index + 1) + ".");
    if (seen.has(iconId)) throw new Error("Duplicate icon override for " + iconId + ".");
    seen.add(iconId);
    return {
      iconId: iconId,
      label: label,
      kind: ["sf-symbol", "custom"].includes(String(source.kind || "").trim()) ? String(source.kind || "").trim() : "",
      categories: normalizeCategoryIds(source.categories),
      source: sourceIds.has(String(source.source || "").trim()) ? String(source.source || "").trim() : ""
    };
  });
  return { overrides: overrides, excludedIconIds: excludedIconIds };
}

const TAG_GROUPS = [
  ["plus", "add", "create", "new"],
  ["minus", "remove", "subtract"],
  ["trash", "delete", "remove", "discard"],
  ["xmark", "close", "dismiss", "cancel"],
  ["checkmark", "check", "done", "confirm", "success"],
  ["pencil", "edit", "write", "compose"],
  ["gear", "settings", "preferences", "configuration", "options"],
  ["magnifyingglass", "search", "find", "lookup", "discover"],
  ["arrow", "navigate", "direction", "forward", "back"],
  ["square_and_arrow_up", "share", "export", "send"],
  ["square_and_arrow_down", "import", "download", "receive"],
  ["document", "file", "page", "paper", "text", "notes"],
  ["folder", "directory", "files", "collection"],
  ["person", "user", "account", "profile", "people"],
  ["lock", "secure", "security", "private", "privacy"],
  ["eye", "view", "show", "visible", "visibility"],
  ["eye_slash", "hide", "hidden", "invisible"],
  ["info", "information", "details", "about"],
  ["exclamation", "warning", "alert", "caution"],
  ["question", "help", "support", "faq"],
  ["heart", "favorite", "love", "health"],
  ["star", "favorite", "rating", "featured"],
  ["house", "home", "start"],
  ["map", "location", "place", "geography", "travel"],
  ["pin", "location", "marker", "place"],
  ["car", "vehicle", "drive", "transport", "travel"],
  ["airplane", "plane", "flight", "transport", "travel"],
  ["message", "chat", "conversation", "communication"],
  ["envelope", "mail", "email", "message"],
  ["bell", "notification", "alert", "reminder"],
  ["camera", "photo", "picture", "image"],
  ["play", "media", "start", "video", "audio"],
  ["speaker", "volume", "sound", "audio"],
  ["microphone", "mic", "voice", "audio", "record"],
  ["calendar", "date", "schedule", "event"],
  ["clock", "time", "recent", "history"],
  ["cart", "shopping", "store", "commerce", "purchase"],
  ["credit_card", "payment", "commerce", "purchase"],
  ["cocktail", "drink", "beverage", "bar"],
  ["fork", "food", "restaurant", "dining"],
  ["cloud", "weather", "online", "sync"],
  ["bolt", "lightning", "power", "energy", "weather"]
];

function metadataKeys(values) {
  const keys = new Set();
  values.forEach(function (value) {
    const normalized = normalizedName(value);
    if (!normalized || normalized === "unnamed_icon") return;
    keys.add(normalized);
    keys.add(normalized.replace(/_/g, " "));
    normalized.split("_").filter(function (part) { return part.length > 1; }).forEach(function (part) { keys.add(part); });
  });
  return keys;
}

function badgeMetadata(record) {
  const subtypes = new Set();
  const shapes = new Set();
  const exclamationShapes = new Set();
  const values = [record.name].concat(Array.from(record.aliases), record.sources.flatMap(function (source) {
    return [source.symbol, path.basename(source.file, path.extname(source.file))];
  }));
  values.forEach(function (value) {
    const tokens = normalizedName(value).split("_");
    let badgeIndex = -1;
    tokens.forEach(function (token, index) {
      if (token === "badge" || token.endsWith("badge")) badgeIndex = index;
    });
    if (badgeIndex < 0) return;
    const badgeToken = tokens[badgeIndex];
    const trailing = tokens.slice(badgeIndex + 1).filter(function (token) { return token !== "fill" && token !== "filled"; });
    const subtype = trailing[0] || "badge";
    subtypes.add(subtype);
    if (badgeToken.includes("trianglebadge")) {
      shapes.add("triangle");
      if (subtype === "exclamationmark") exclamationShapes.add("triangle");
    } else if (subtype === "exclamationmark" && tokens.slice(0, badgeIndex).includes("circle")) {
      exclamationShapes.add("circle");
    }
    if (subtype === "shield") shapes.add("shield");
  });
  return { subtypes: subtypes, shapes: shapes, exclamationShapes: exclamationShapes };
}

function deriveMetadata(record) {
  const keys = metadataKeys([record.name].concat(Array.from(record.aliases), record.sources.map(function (item) { return item.symbol; })));
  const badge = badgeMetadata(record);
  const categories = ICON_CATEGORIES.filter(function (category) {
    if (category.id === "shapes") return category.terms.some(function (term) {
      const normalized = normalizedName(term);
      return record.name === normalized || record.name.startsWith(normalized + "_");
    });
    if (category.id === "badged-shapes") return badge.shapes.size > 0;
    if (category.parent === "badged-shapes") return category.terms.some(function (term) { return badge.shapes.has(normalizedName(term)); });
    if (category.parent === "badged-exclamationmark") return badge.subtypes.has("exclamationmark") && category.terms.some(function (term) { return badge.exclamationShapes.has(normalizedName(term)); });
    if (category.parent === "badged") return category.terms.some(function (term) { return badge.subtypes.has(normalizedName(term)); });
    return category.terms.some(function (term) { return keys.has(normalizedName(term)); });
  }).map(function (category) { return category.id; });
  const isBadgeSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/(?:!Badge|Badge)\//i.test(source.file);
  });
  if (isBadgeSource && !categories.includes("badged")) categories.push("badged");
  const isCloudServerSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/(?:server:drive|Cloud:Drive)\//i.test(source.file);
  });
  if (isCloudServerSource && !categories.includes("cloud-server")) categories.push("cloud-server");
  const isShapesSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/shapes\//i.test(source.file);
  });
  if (isShapesSource && !categories.includes("shapes")) categories.push("shapes");
  const isSparklesSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/(?:sparkles|Sparkles:Rays)\//i.test(source.file);
  });
  if (isSparklesSource && !categories.includes("rays-sparkles")) categories.push("rays-sparkles");
  const isWeatherSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/weather\//i.test(source.file);
  });
  if (isWeatherSource && !categories.includes("weather")) categories.push("weather");
  const isTimeSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/(?:!Time|Time)\//i.test(source.file);
  });
  if (isTimeSource && !categories.includes("time")) categories.push("time");
  const isHealthSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/(?:!Health|Health)\//i.test(source.file);
  });
  if (isHealthSource && !categories.includes("health")) categories.push("health");
  const isNatureSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/(?:!Nature|Nature)\//i.test(source.file);
  });
  if (isNatureSource && !categories.includes("nature")) categories.push("nature");
  const isRaysSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/(?:!Rays|Rays)\//i.test(source.file);
  });
  if (isRaysSource && !categories.includes("rays-sparkles")) categories.push("rays-sparkles");
  const isLocationSource = record.sources.some(function (source) {
    return source.repo === "visit-tracker" && /^assets\/svgs\/!(?:countries|continents|earth)\//i.test(source.file);
  });
  if (isLocationSource && !categories.includes("locations")) categories.push("locations");
  const isTextFormattingSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/Text Formatting\//i.test(source.file);
  });
  if (isTextFormattingSource && !categories.includes("text-formatting")) categories.push("text-formatting");
  const isConnectivitySource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/Connectivity\//i.test(source.file);
  });
  if (isConnectivitySource && !categories.includes("devices")) categories.push("devices");
  const isGameSource = record.sources.some(function (source) {
    return source.repo === "carcassone-cheatsheet" && /^assets\/(?:unused\/)?[^/]+\.svg$/i.test(source.file);
  });
  if (isGameSource && !categories.includes("games")) categories.push("games");
  const isBrandingSource = record.sources.some(function (source) {
    return /(?:^|\/)(?:app[ -]?icon|apple[ -]?touch[ -]?icon|favicon|splash)[^/]*\.svg$/i.test(source.file);
  });
  if (isBrandingSource && !categories.includes("branding")) categories.push("branding");
  [
    { id: "accessibility", folder: "Accessibility" },
    { id: "editing", folder: "Editing" },
    { id: "keyboard", folder: "Keyboard" },
    { id: "locations", folder: "Maps" },
    { id: "math", folder: "Math" },
    { id: "media", folder: "Media" },
    { id: "security", folder: "Privacy & Security" },
    { id: "transportation", folder: "Transportation" }
  ].forEach(function (rule) {
    const escapedFolder = rule.folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp("^app-input/(?:!" + escapedFolder + "|" + escapedFolder + ")/", "i");
    const isRequestedSource = record.sources.some(function (source) {
      return source.repo === "svg-converter" && pattern.test(source.file);
    });
    if (isRequestedSource && !categories.includes(rule.id)) categories.push(rule.id);
  });
  if (!categories.length) categories.push("other");
  const tags = new Set(Array.from(keys));
  TAG_GROUPS.forEach(function (group) {
    if (!group.some(function (term) { return keys.has(normalizedName(term)); })) return;
    group.forEach(function (term) { tags.add(normalizedName(term).replace(/_/g, " ")); });
  });
  categories.forEach(function (categoryId) {
    const category = ICON_CATEGORIES.find(function (item) { return item.id === categoryId; });
    tags.add(category ? category.label.toLowerCase() : "other");
  });
  return { categories: normalizeCategoryIds(categories), tags: Array.from(tags).filter(Boolean).sort().slice(0, 120) };
}

function templateLiteral(value) {
  return "`" + String(value).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
}

function isSfSymbol(input) {
  const original = String(input.svg || "");
  const file = String(input.file || "");
  return /\bclass=["'][^"']*\bsf-symbol\b/i.test(original)
    || /Generator:\s*Apple Native CoreSVG/i.test(original)
    || input.repo === "svg-converter" && /(?:^|\/)(?:bulk-convert-format|bulk-convert-circle|output|output-circle)/i.test(file)
    || /(?:^|\/)build\/icon-sources\/source-material\//i.test(file);
}

function consolidateRecords(target, duplicate) {
  duplicate.aliases.forEach(function (alias) { target.aliases.add(alias); });
  target.sources.push.apply(target.sources, duplicate.sources);
  duplicate.kinds.forEach(function (kind) { target.kinds.add(kind); });
  recordsByHash.forEach(function (record, hash) { if (record === duplicate) recordsByHash.set(hash, target); });
  sfRecordsByName.forEach(function (record, name) { if (record === duplicate) sfRecordsByName.set(name, target); });
  iconRecords.delete(duplicate);
  return target;
}

function addIcon(input) {
  const kind = isSfSymbol(input) ? "sf-symbol" : "custom";
  let svg = cleanSvg(input.svg);
  if (!svg) { stats.rejected += 1; return; }
  if (kind === "sf-symbol") svg = normalizeSfSymbolPaint(svg);
  const hash = crypto.createHash("sha256").update(canonicalSvg(svg)).digest("hex").slice(0, 12);
  const name = normalizedName(input.symbol);
  const source = { repo: input.repo, file: input.file, symbol: input.symbol };
  const matchingArtwork = recordsByHash.get(hash);
  const matchingSfName = kind === "sf-symbol" ? sfRecordsByName.get(name) : null;
  let existing = matchingArtwork || matchingSfName;
  if (matchingArtwork && matchingSfName && matchingArtwork !== matchingSfName) {
    existing = consolidateRecords(matchingSfName, matchingArtwork);
    stats.mergedBySfName += 1;
  }
  stats.extracted += 1;
  if (existing) {
    if (!matchingArtwork && matchingSfName) stats.mergedBySfName += 1;
    existing.aliases.add(name);
    existing.sources.push(source);
    existing.kinds.add(kind);
    recordsByHash.set(hash, existing);
    if (kind === "sf-symbol") sfRecordsByName.set(name, existing);
    if (!input.inline && name.length < existing.name.length) existing.name = name;
    return;
  }
  const record = { hash: hash, name: name, aliases: new Set([name]), sources: [source], kinds: new Set([kind]), svg: svg };
  recordsByHash.set(hash, record);
  if (kind === "sf-symbol") sfRecordsByName.set(name, record);
  iconRecords.add(record);
}

function templateSymbol(text, matchIndex, svg, source, ordinal) {
  const prefix = text.slice(Math.max(0, matchIndex - 500), matchIndex);
  const assignment = prefix.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*$/);
  if (assignment) return assignment[1];
  const property = prefix.match(/(?:^|[,;{]\s*)\b([A-Za-z_$][\w$]*)\s*:\s*$/);
  if (property) return property[1];
  const title = svg.match(/<title\b[^>]*>([^<]+)<\/title>/i);
  const ariaLabel = svg.match(/\baria-label=["']([^"']+)["']/i);
  const id = svg.match(/\bid=["']([^"']+)["']/i);
  return title && title[1] || ariaLabel && ariaLabel[1] || id && id[1] || path.basename(source.file, path.extname(source.file)) + "-svg-" + ordinal;
}

function extractTemplateSvgs(text, source) {
  const tick = String.fromCharCode(96);
  const expression = new RegExp(tick + "\\s*(<svg\\b[\\s\\S]*?<\\/svg>)\\s*" + tick, "g");
  const ranges = [];
  let match;
  let ordinal = 0;
  while ((match = expression.exec(text))) {
    ordinal += 1;
    ranges.push([match.index, expression.lastIndex]);
    stats.templateLiterals += 1;
    addIcon({ repo: source.repo, file: source.file, symbol: templateSymbol(text, match.index, match[1], source, ordinal), svg: match[1] });
  }
  return ranges;
}

function extractInlineSvgs(text, source, excludedRanges) {
  const expression = /<svg\b[^>]*class=["'][^"']*\bsf-symbol\b[^"']*["'][^>]*>[\s\S]*?<\/svg>/gi;
  let match;
  let unnamed = 0;
  while ((match = expression.exec(text))) {
    if (excludedRanges.some(function (range) { return match.index >= range[0] && match.index < range[1]; })) continue;
    const buttonStart = text.lastIndexOf("<button", match.index);
    const buttonEnd = text.lastIndexOf("</button", match.index);
    let symbol = "inline-icon-" + (++unnamed);
    if (buttonStart > buttonEnd) {
      const tagEnd = text.indexOf(">", buttonStart);
      const buttonTag = tagEnd > buttonStart && tagEnd < match.index ? text.slice(buttonStart, tagEnd + 1) : "";
      const title = buttonTag.match(/\btitle=["']([^"']+)["']/i);
      const ariaLabel = buttonTag.match(/\baria-label=["']([^"']+)["']/i);
      const id = buttonTag.match(/\bid=["']([^"']+)["']/i);
      symbol = title && title[1] || ariaLabel && ariaLabel[1] || id && id[1] || symbol;
    }
    stats.inlineMarkup += 1;
    addIcon({ repo: source.repo, file: source.file, symbol: symbol, svg: match[0], inline: true });
  }
}

for (const source of sources) {
  if (!fs.existsSync(source.root)) {
    process.stderr.write("Skipping missing icon source: " + source.root + "\n");
    continue;
  }
  for (const absolute of walk(source.root)) {
    const relative = path.relative(source.root, absolute).split(path.sep).join("/");
    if (path.resolve(absolute) === path.resolve(outputFile)) continue;
    if (source.name === "svg-converter" && /^(?:output|output-circle:square|app-input\/!All)\//i.test(relative)) {
      stats.skippedGenerated += 1;
      continue;
    }
    const extension = path.extname(absolute).toLowerCase();
    if (source.name === "svg-converter" && extension === ".svg" && / \d+\.svg$/i.test(relative)) {
      const unsuffixed = absolute.replace(/ \d+(\.svg)$/i, "$1");
      if (fs.existsSync(unsuffixed)) {
        stats.skippedGenerated += 1;
        continue;
      }
    }
    if (TEXT_EXTENSIONS.has(extension)) {
      stats.files += 1;
      const text = fs.readFileSync(absolute, "utf8");
      const ranges = extractTemplateSvgs(text, { repo: source.name, file: relative });
      if (extension === ".html" || extension === ".htm") extractInlineSvgs(text, { repo: source.name, file: relative }, ranges);
    } else if (extension === ".svg") {
      stats.files += 1;
      if (fs.statSync(absolute).size > MAX_STANDALONE_SVG_BYTES) { stats.skippedOversized += 1; continue; }
      stats.standalone += 1;
      addIcon({ repo: source.name, file: relative, symbol: path.basename(relative, extension), svg: fs.readFileSync(absolute, "utf8") });
    }
  }
}

const compiledRecords = Array.from(iconRecords).map(function (record) {
  const aliases = Array.from(record.aliases).sort();
  const sourcesForIcon = Array.from(new Map(record.sources.map(function (source) {
    return [[source.repo, source.file, source.symbol].join("\u0000"), source];
  })).values()).sort(function (a, b) {
    return (a.repo + a.file + a.symbol).localeCompare(b.repo + b.file + b.symbol);
  });
  const preferred = record.name;
  const metadata = deriveMetadata(record);
  return {
    id: preferred.replace(/_/g, "-") + "-" + record.hash.slice(0, 6),
    name: preferred,
    label: cleanIconLabel(labelFor(preferred)) || "Icon",
    kind: record.kinds.has("sf-symbol") ? "sf-symbol" : "custom",
    aliases: aliases,
    categories: metadata.categories,
    tags: metadata.tags,
    repositories: Array.from(new Set(sourcesForIcon.map(function (source) { return source.repo; }))).sort(),
    source: "",
    sources: sourcesForIcon,
    svg: record.svg
  };
});

const hardcodedMetadata = loadIconOverrides();
const hardcodedOverrides = hardcodedMetadata.overrides;
const excludedIconIds = new Set(hardcodedMetadata.excludedIconIds);
const records = compiledRecords.filter(function (record) { return !excludedIconIds.has(record.id); });
const recordById = new Map(records.map(function (record) { return [record.id, record]; }));
let overridesApplied = 0;
hardcodedOverrides.forEach(function (override) {
  const record = recordById.get(override.iconId);
  if (!record) return;
  record.label = cleanIconLabel(override.label) || record.label;
  record.kind = override.kind || record.kind;
  const overrideCategories = override.categories.filter(function (categoryId) { return categoryId !== "other"; });
  record.categories = overrideCategories.length ? normalizeCategoryIds(overrideCategories) : record.categories;
  record.source = override.source;
  overridesApplied += 1;
});
records.sort(function (a, b) { return a.label.localeCompare(b.label, undefined, { numeric: true }) || a.id.localeCompare(b.id); });

const contributingSources = Array.from(new Set(records.flatMap(function (record) { return record.repositories.concat(record.source || []); }))).sort();
const lines = [
  "/* Generated by build/compile-icon-library.mjs. Edit source icons, then run the compiler again. */",
  "(function () {",
  '  "use strict";',
  "",
  "  window.LocalApp = window.LocalApp || {};",
  "  const ICON_LIBRARY = ["
];

records.forEach(function (record) {
  lines.push("    {");
  lines.push("      id: " + JSON.stringify(record.id) + ",");
  lines.push("      name: " + JSON.stringify(record.name) + ",");
  lines.push("      label: " + JSON.stringify(record.label) + ",");
  lines.push("      kind: " + JSON.stringify(record.kind) + ",");
  lines.push("      aliases: " + JSON.stringify(record.aliases) + ",");
  lines.push("      categories: " + JSON.stringify(record.categories) + ",");
  lines.push("      tags: " + JSON.stringify(record.tags) + ",");
  lines.push("      repositories: " + JSON.stringify(record.repositories) + ",");
  if (record.source) lines.push("      source: " + JSON.stringify(record.source) + ",");
  lines.push("      sources: " + JSON.stringify(record.sources) + ",");
  lines.push("      svg: " + templateLiteral(record.svg));
  lines.push("    },");
});

lines.push("  ];");
const exportedCategories = ICON_CATEGORIES.concat([{ id: "other", label: "Other", section: "meaning", terms: [] }]).filter(function (category) {
  return records.some(function (record) { return record.categories.includes(category.id); });
}).map(function (category) {
  return Object.assign({ id: category.id, label: category.label }, category.parent ? { parent: category.parent } : { section: category.section || "meaning" });
});

lines.push("  window.LocalApp.iconLibrary = Object.freeze({");
lines.push("    categories: Object.freeze(" + JSON.stringify(exportedCategories) + ".map(Object.freeze)),");
lines.push("    sourceRepositories: Object.freeze(" + JSON.stringify(contributingSources) + "),");
lines.push("    icons: Object.freeze(ICON_LIBRARY.map(Object.freeze))");
lines.push("  });");
lines.push("})();");
lines.push("");

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, lines.join("\n"));
process.stdout.write(JSON.stringify({
  output: path.relative(projectRoot, outputFile),
  scannedFiles: stats.files,
  extracted: stats.extracted,
  templateLiterals: stats.templateLiterals,
  inlineMarkup: stats.inlineMarkup,
  standalone: stats.standalone,
  uniqueIcons: records.length,
  excludedIcons: compiledRecords.length - records.length,
  sfSymbols: records.filter(function (record) { return record.kind === "sf-symbol"; }).length,
  customIcons: records.filter(function (record) { return record.kind === "custom"; }).length,
  rejected: stats.rejected,
  skippedOversized: stats.skippedOversized,
  skippedGenerated: stats.skippedGenerated,
  mergedBySfName: stats.mergedBySfName,
  overridesApplied: overridesApplied,
  overridesMissing: hardcodedOverrides.length - overridesApplied,
  scannedSources: sources.filter(function (source) { return fs.existsSync(source.root); }).map(function (source) { return source.name; }),
  contributingSources: contributingSources
}, null, 2) + "\n");
