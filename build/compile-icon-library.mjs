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
const SKIP_DIRECTORIES = new Set([".git", "node_modules"]);
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
  return name.split("_").filter(Boolean).map(function (part) {
    if (/^\d+x\d+$/.test(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

const ICON_CATEGORIES = [
  { id: "actions", label: "Actions", terms: ["add", "plus", "minus", "copy", "duplicate", "delete", "trash", "download", "upload", "share", "export", "import", "refresh", "reload", "undo", "redo", "save", "print", "scan"] },
  { id: "arrows", label: "Arrows", terms: ["arrow", "chevron", "caret", "direction", "forward", "backward"] },
  { id: "communication", label: "Communication", terms: ["message", "chat", "bubble", "mail", "envelope", "phone", "call", "megaphone", "bell", "notification", "mention"] },
  { id: "commerce", label: "Commerce", terms: ["cart", "bag", "basket", "credit", "currency", "dollar", "bank", "wallet", "gift", "receipt", "tag"] },
  { id: "devices", label: "Devices", terms: ["desktop", "laptop", "computer", "tablet", "iphone", "ipad", "mobile", "watch", "keyboard", "mouse", "printer", "display", "monitor", "television", "tv"] },
  { id: "cloud-server", label: "Cloud/Server", terms: ["cloud", "icloud", "server", "drive", "externaldrive", "internaldrive", "opticaldiscdrive", "storage", "database", "network"] },
  { id: "documents", label: "Documents", terms: ["document", "doc", "file", "folder", "page", "paper", "note", "clipboard", "book", "text", "list", "archive"] },
  { id: "editing", label: "Editing", terms: ["pencil", "pen", "highlighter", "crop", "scissors", "ruler", "paint", "eyedropper", "slider", "textformat"] },
  { id: "food-drink", label: "Food & Drink", terms: ["cocktail", "drink", "glass", "wine", "beer", "cup", "mug", "fork", "knife", "spoon", "food", "restaurant", "bottle", "coffee"] },
  { id: "health", label: "Health", terms: ["heart", "medical", "medicine", "pill", "bandage", "stethoscope", "health", "hospital", "fitness", "dumbbell"] },
  { id: "interface", label: "Interface", terms: ["menu", "sidebar", "toolbar", "window", "panel", "grid", "ellipsis", "gear", "settings", "magnifyingglass", "search", "filter", "sort"] },
  { id: "maps-travel", label: "Maps & Travel", terms: ["map", "location", "pin", "globe", "compass", "car", "bus", "train", "tram", "plane", "airplane", "boat", "ferry", "bicycle", "travel"] },
  { id: "media", label: "Media", terms: ["play", "pause", "stop", "video", "camera", "photo", "image", "music", "speaker", "volume", "microphone", "waveform", "record"] },
  { id: "nature", label: "Nature", terms: ["leaf", "tree", "flower", "plant", "mountain", "water", "animal", "dog", "cat", "bird", "fish"] },
  { id: "people", label: "People", terms: ["person", "people", "user", "figure", "face", "hand", "body", "accessibility"] },
  { id: "security", label: "Security", terms: ["lock", "key", "shield", "privacy", "secure", "password", "faceid", "touchid"] },
  { id: "shapes", label: "Shapes", terms: ["circle", "square", "rectangle", "triangle", "diamond", "hexagon", "shape"] },
  { id: "badged", label: "Badged", terms: ["badge", "trianglebadge"] },
  { id: "badged-plus", label: "Plus", parent: "badged", terms: ["plus"] },
  { id: "badged-minus", label: "Minus", parent: "badged", terms: ["minus"] },
  { id: "badged-checkmark", label: "Checkmark", parent: "badged", terms: ["checkmark", "check"] },
  { id: "badged-xmark", label: "Xmark", parent: "badged", terms: ["xmark"] },
  { id: "squared", label: "Squared", terms: ["square"] },
  { id: "circled", label: "Circled", terms: ["circle"] },
  { id: "slashed", label: "Slashed", terms: ["slash", "slashed"] },
  { id: "sparkled", label: "Sparkled", terms: ["sparkle", "sparkles"] },
  { id: "status", label: "Status", terms: ["check", "checkmark", "xmark", "close", "exclamation", "warning", "info", "question", "error", "success", "badge"] },
  { id: "time", label: "Time", terms: ["clock", "calendar", "timer", "hourglass", "alarm", "date"] },
  { id: "weather", label: "Weather", terms: ["sun", "cloud", "rain", "snow", "wind", "temperature", "moon", "bolt", "lightning"] }
];

function loadIconOverrides() {
  if (!fs.existsSync(overrideFile)) return [];
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(overrideFile, "utf8"));
  } catch (error) {
    throw new Error("Could not parse " + path.relative(projectRoot, overrideFile) + ": " + error.message);
  }
  if (!parsed || parsed.format !== "app-template-icon-library-overrides" || parsed.formatVersion !== 1 || !Array.isArray(parsed.overrides)) {
    throw new Error("The icon override file has an unsupported format.");
  }
  const categoryIds = new Set(ICON_CATEGORIES.map(function (category) { return category.id; }).concat(["other"]));
  const seen = new Set();
  return parsed.overrides.map(function (item, index) {
    const source = item && typeof item === "object" && !Array.isArray(item) ? item : {};
    const iconId = String(source.iconId || "").trim().slice(0, 160);
    const label = String(source.label || "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (!iconId || !label || !Array.isArray(source.categories)) throw new Error("Invalid icon override at position " + (index + 1) + ".");
    if (seen.has(iconId)) throw new Error("Duplicate icon override for " + iconId + ".");
    seen.add(iconId);
    return {
      iconId: iconId,
      label: label,
      categories: Array.from(new Set(source.categories.map(function (categoryId) {
        return String(categoryId || "").trim();
      }).filter(function (categoryId) { return categoryIds.has(categoryId); })))
    };
  });
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

function deriveMetadata(record) {
  const keys = metadataKeys([record.name].concat(Array.from(record.aliases), record.sources.map(function (item) { return item.symbol; })));
  const categories = ICON_CATEGORIES.filter(function (category) {
    if (category.id === "shapes") return category.terms.some(function (term) {
      const normalized = normalizedName(term);
      return record.name === normalized || record.name.startsWith(normalized + "_");
    });
    const matches = category.terms.some(function (term) { return keys.has(normalizedName(term)); });
    if (!matches || !category.parent) return matches;
    const parent = ICON_CATEGORIES.find(function (item) { return item.id === category.parent; });
    return parent && parent.terms.some(function (term) { return keys.has(normalizedName(term)); });
  }).map(function (category) { return category.id; });
  const isCloudServerSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/server:drive\//i.test(source.file);
  });
  if (isCloudServerSource && !categories.includes("cloud-server")) categories.push("cloud-server");
  const isShapesSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/shapes\//i.test(source.file);
  });
  if (isShapesSource && !categories.includes("shapes")) categories.push("shapes");
  const isSparklesSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/sparkles\//i.test(source.file);
  });
  if (isSparklesSource && !categories.includes("sparkled")) categories.push("sparkled");
  const isWeatherSource = record.sources.some(function (source) {
    return source.repo === "svg-converter" && /^app-input\/weather\//i.test(source.file);
  });
  if (isWeatherSource && !categories.includes("weather")) categories.push("weather");
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
  return { categories: categories, tags: Array.from(tags).filter(Boolean).sort().slice(0, 120) };
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
    if (source.name === "svg-converter" && /^(?:output|output-circle:square)\//i.test(relative)) {
      stats.skippedGenerated += 1;
      continue;
    }
    const extension = path.extname(absolute).toLowerCase();
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

const records = Array.from(iconRecords).map(function (record) {
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
    label: labelFor(preferred),
    kind: record.kinds.has("sf-symbol") ? "sf-symbol" : "custom",
    aliases: aliases,
    categories: metadata.categories,
    tags: metadata.tags,
    repositories: Array.from(new Set(sourcesForIcon.map(function (source) { return source.repo; }))).sort(),
    sources: sourcesForIcon,
    svg: record.svg
  };
});

const hardcodedOverrides = loadIconOverrides();
const recordById = new Map(records.map(function (record) { return [record.id, record]; }));
let overridesApplied = 0;
hardcodedOverrides.forEach(function (override) {
  const record = recordById.get(override.iconId);
  if (!record) return;
  record.label = override.label;
  record.categories = override.categories;
  overridesApplied += 1;
});
records.sort(function (a, b) { return a.label.localeCompare(b.label, undefined, { numeric: true }) || a.id.localeCompare(b.id); });

const contributingSources = Array.from(new Set(records.flatMap(function (record) { return record.repositories; }))).sort();
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
  lines.push("      sources: " + JSON.stringify(record.sources) + ",");
  lines.push("      svg: " + templateLiteral(record.svg));
  lines.push("    },");
});

lines.push("  ];");
const exportedCategories = ICON_CATEGORIES.concat([{ id: "other", label: "Other", terms: [] }]).filter(function (category) {
  return records.some(function (record) { return record.categories.includes(category.id); });
}).map(function (category) {
  return Object.assign({ id: category.id, label: category.label }, category.parent ? { parent: category.parent } : {});
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
