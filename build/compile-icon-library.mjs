#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceParent = path.dirname(projectRoot);
const outputFile = path.join(projectRoot, "assets/js/icon-library.js");
const overrideFile = path.join(projectRoot, "build/icon-library-overrides.json");
const requestedRoots = process.argv.slice(2);
const seedFile = process.env.APP_TEMPLATE_ICON_SEED || outputFile;

function readExistingCatalog() {
  if (!fs.existsSync(seedFile)) return [];
  try {
    const sandbox = { window: { LocalApp: {} } };
    vm.runInNewContext(fs.readFileSync(seedFile, "utf8"), sandbox, { filename: seedFile });
    return Array.isArray(sandbox.window.LocalApp.iconLibrary?.icons) ? sandbox.window.LocalApp.iconLibrary.icons : [];
  } catch (error) {
    process.stderr.write("Could not retain the existing compiled catalog: " + error.message + "\n");
    return [];
  }
}

const existingCatalog = readExistingCatalog();
const existingIdByName = new Map();
const existingIdByHash = new Map();
existingCatalog.forEach(function (icon) {
  const hash = crypto.createHash("sha256").update(canonicalSvg(String(icon.svg || ""))).digest("hex").slice(0, 12);
  if (hash && !existingIdByHash.has(hash)) existingIdByHash.set(hash, icon.id);
  [icon.name].concat(Array.isArray(icon.aliases) ? icon.aliases : []).filter(Boolean).forEach(function (name) {
    if (!existingIdByName.has(name)) existingIdByName.set(name, icon.id);
  });
});

function discoverDefaultSources() {
  const discovered = fs.readdirSync(sourceParent, { withFileTypes: true }).filter(function (entry) {
    return entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "backups" && entry.name !== "!backups:data";
  }).map(function (entry) {
    return { name: entry.name, root: path.join(sourceParent, entry.name) };
  });
  [
    { name: "objects-tools", folder: "Objects & Tools" },
    { name: "norway-sweden", folder: "norway:sweden" },
    { name: "indices", folder: "indicies" }
  ].forEach(function (source) {
    const root = path.join(sourceParent, "!backups:data", "icons", "app-input", source.folder);
    if (fs.existsSync(root)) discovered.push({ name: source.name, root: root });
  });
  return discovered.sort(function (a, b) { return a.name.localeCompare(b.name); });
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
  { id: "accessibility", label: "Accessibility", terms: ["accessibility", "assistive", "braille", "ear", "figure", "voiceover", "wheelchair"] },
  { id: "arrows", label: "Arrows", section: "appearance", terms: [] },
  { id: "arrows-chevron", label: "Chevron", parent: "arrows", terms: [] },
  { id: "arrows-triangle", label: "Triangle", parent: "arrows", terms: [] },
  { id: "arrows-chevron-arrow", label: "Chevron Arrow", parent: "arrows", terms: [] },
  { id: "arrows-triangle-arrow", label: "Triangle Arrow", parent: "arrows", terms: [] },
  { id: "branding", label: "Apps & Branding", terms: ["favicon", "logo", "splash", "safari"] },
  { id: "celebrations-awards", label: "Celebrations & Awards", terms: ["award", "balloon", "birthday", "cake", "fireworks", "flag", "gift", "medal", "party", "rosette", "trophy"] },
  { id: "communication", label: "Communication", terms: ["message", "chat", "bubble", "mail", "envelope", "paperplane", "phone", "call", "megaphone", "bell", "notification", "mention"] },
  { id: "commerce", label: "Commerce", terms: ["cart", "bag", "basket", "credit", "currency", "dollar", "bank", "wallet", "gift", "receipt", "tag"] },
  { id: "clothing-personal", label: "Clothing & Personal Items", terms: ["backpack", "briefcase", "coat", "comb", "eyeglasses", "handbag", "hanger", "hat", "jacket", "shoe", "suitcase", "sunglasses", "tshirt", "watch"] },
  { id: "devices", label: "Devices & Connectivity", terms: ["desktop", "laptop", "computer", "tablet", "iphone", "ipad", "mobile", "watch", "keyboard", "mouse", "printer", "display", "monitor", "television", "tv", "antenna", "bonjour", "cellularbars", "hotspot", "personalhotspot", "radiowaves", "wifi"] },
  { id: "cloud-server", label: "Cloud & Drive", terms: ["cloud", "icloud", "server", "drive", "externaldrive", "internaldrive", "opticaldiscdrive", "storage", "database", "network"] },
  { id: "documents", label: "Documents", terms: ["document", "doc", "file", "folder", "page", "paper", "note", "clipboard", "book", "text", "list", "archive", "archivebox", "bookmark", "data", "json"] },
  { id: "editing", label: "Editing", terms: ["pencil", "pen", "highlight", "highlighter", "crop", "scissors", "ruler", "paint", "eyedropper", "slider", "textformat", "editor", "legend"] },
  { id: "text-formatting", label: "Text Formatting", parent: "editing", terms: ["abc", "a z", "bold", "italic", "underline", "strikethrough", "paragraphsign", "quotelevel", "indent", "kashida", "fleuron", "textbox", "uppercase", "lowercase", "phonetic"] },
  { id: "education-science", label: "Education & Science", terms: ["atom", "book", "books", "flask", "graduationcap", "gyroscope", "level", "microscope", "scalemass", "school", "science", "studentdesk", "testtube", "university"] },
  { id: "food-drink", label: "Food & Drink", terms: ["bar", "cocktail", "drink", "glass", "wine", "wineglass", "beer", "cup", "mug", "fork", "knife", "spoon", "food", "restaurant", "bottle", "coffee"] },
  { id: "health", label: "Health", terms: ["heart", "medical", "medicine", "pill", "bandage", "stethoscope", "health", "hospital", "fitness", "dumbbell"] },
  { id: "home-appliances", label: "Home & Appliances", terms: ["conditioner", "purifier", "bathtub", "cabinet", "chair", "chandelier", "cooktop", "dehumidifier", "dishwasher", "door", "dryer", "fan", "fireplace", "heater", "house", "humidifier", "lamp", "light", "microwave", "oven", "refrigerator", "shower", "sink", "sofa", "spigot", "sprinkler", "stove", "toilet", "vacuum", "washer"] },
  { id: "indices", label: "Indices", terms: ["index", "indices"] },
  { id: "interface", label: "Interface", terms: ["menu", "sidebar", "toolbar", "window", "panel", "grid", "ellipsis", "gear", "gearshape", "settings", "magnifyingglass", "search", "filter", "sort", "terminal", "curlybraces", "widget", "dock", "menubar", "inset", "gauge", "target", "swatchpalette", "chart", "table", "fit", "mode", "lightbulb", "line", "link", "pip", "view", "dismiss", "hide", "trash", "bin", "wrench"] },
  { id: "keyboard", label: "Keyboard", terms: ["keyboard", "command", "control", "option", "shift", "capslock", "escape", "return", "delete", "fn"] },
  { id: "locations", label: "Locations", terms: [] },
  { id: "locations-countries", label: "Countries", parent: "locations", terms: ["country", "continent"] },
  { id: "locations-mapping", label: "Mapping", parent: "locations", terms: ["map", "location", "mappin", "pin", "globe", "compass", "signpost", "scope", "earth", "world"] },
  { id: "locations-places", label: "Places", parent: "locations", terms: ["landmark", "monument", "building", "cathedral", "church", "lighthouse", "stadium", "university", "campus", "bridge", "tower", "road", "park", "obelisk", "wall", "house", "tent", "shrine", "pavilion", "gate", "mecca"] },
  { id: "math", label: "Math", terms: ["123", "function", "sum", "number", "percent", "divide", "multiply", "equal", "greaterthan", "lessthan", "plusminus", "radical"] },
  { id: "media", label: "Entertainment & Media", terms: ["play", "pause", "stop", "video", "camera", "photo", "image", "music", "speaker", "volume", "microphone", "waveform", "record"] },
  { id: "nature", label: "Nature", terms: ["nature", "mountain", "water", "volcano"] },
  { id: "animals-plants", label: "Animals & Plants", parent: "nature", terms: ["leaf", "tree", "flower", "plant", "animal", "dog", "cat", "bird", "fish", "dinosaur", "raptor", "velociraptor"] },
  { id: "weather", label: "Weather", parent: "nature", terms: ["sun", "cloud", "rain", "snow", "wind", "temperature", "moon", "bolt", "lightning"] },
  { id: "objects-tools", label: "Objects & Tools", terms: ["object", "tool", "hammer", "wrench", "screwdriver", "flashlight", "lamp", "chair", "sofa", "bed", "toilet", "key", "suitcase", "briefcase", "watch", "clock", "shoe", "scissors", "ruler", "paintbrush", "basket", "box", "shippingbox", "mug", "cup"] },
  { id: "rays-sparkles", label: "Rays & Sparkles", section: "appearance", terms: ["ray", "rays", "laser", "burst", "sparkle", "sparkles"] },
  { id: "people", label: "People", terms: [] },
  { id: "recreation", label: "Recreation", terms: [] },
  { id: "recreation-games", label: "Games", parent: "recreation", terms: ["game", "meeple", "die", "dice", "castle", "abbey", "wizard", "witch", "mage", "fairy", "elf", "dragon", "sheep", "wolf", "robber", "princess", "knight", "spartan", "crown", "medieval", "ringmaster", "pigsty", "baazar", "vineyard", "arcade", "gamecontroller", "puzzlepiece", "teddybear"] },
  { id: "recreation-sport", label: "Sport", parent: "recreation", terms: ["baseball", "basketball", "cricket", "football", "hockey", "oar", "rugbyball", "skateboard", "skis", "snowboard", "soccerball", "sport", "surfboard", "tennis", "trophy", "volleyball"] },
  { id: "security", label: "Privacy & Security", terms: ["lock", "key", "shield", "privacy", "secure", "password", "faceid", "touchid", "eye off"] },
  { id: "shapes", label: "Shapes", section: "appearance", terms: ["circle", "square", "rectangle", "triangle", "diamond", "hexagon", "shape", "ring"] },
  { id: "building", label: "Building", section: "appearance", terms: ["building"] },
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
  { id: "transportation", label: "Transportation", terms: ["car", "bus", "train", "tram", "plane", "airplane", "boat", "ferry", "bicycle", "scooter", "vehicle", "transportation"] }
];

const ICON_CATEGORY_ALIASES = new Map([
  ["actions", "interface"],
  ["maps-travel", "locations"],
  ["maps", "locations-mapping"],
  ["games", "recreation-games"],
  ["sports-recreation", "recreation-sport"],
  ["norway-sweden", "commerce"],
  ["rays", "rays-sparkles"],
  ["sparkled", "rays-sparkles"],
  ["badged-shield", "badged-shapes-shield"]
]);
const ICON_CATEGORY_BY_ID = new Map(ICON_CATEGORIES.map(function (category) { return [category.id, category]; }));

const OBJECT_TOOL_CATEGORY_RULES = [
  { id: "accessibility", terms: ["eyeglasses"] },
  { id: "celebrations-awards", terms: ["balloon", "birthday cake", "fireworks", "flag", "party popper", "rosette", "trophy"] },
  { id: "clothing-personal", terms: ["coat", "comb", "eyeglasses", "handbag", "hanger", "hat", "jacket", "shoe", "suitcase", "sunglasses", "tshirt"] },
  { id: "communication", terms: ["faxmachine", "greetingcard", "horn"] },
  { id: "commerce", terms: ["briefcase", "case", "coat", "creditcard", "handbag", "hat", "jacket", "shippingbox", "shoe", "suitcase", "ticket", "tshirt"] },
  { id: "devices", terms: ["air conditioner", "air purifier", "airpods", "amplifier", "battery", "batteryblock", "beats headphones", "cpu", "dehumidifier", "dishwasher", "drone", "dryer", "earbud", "earbuds", "esim", "fan", "faxmachine", "flashlight", "gamecontroller", "gyroscope", "headphones", "headset", "heater", "hifireceiver", "humidifier", "lamp", "laser", "light", "memorychip", "microwave", "opticaldisc", "oven", "powercord", "poweroutlet", "powerplug", "radio", "refrigerator", "robotic vacuum", "scanner", "sdcard", "simcard", "stove", "videoprojector", "washer"] },
  { id: "documents", terms: ["books", "briefcase", "greetingcard", "lanyardcard", "magazine", "menucard", "newspaper", "pad header", "paperclip", "scroll", "shippingbox", "tray"] },
  { id: "editing", terms: ["comb", "hammer", "level", "paintpalette", "scalemass", "screwdriver", "theatermask and paintbrush"] },
  { id: "education-science", terms: ["books", "flask", "graduationcap", "gyroscope", "level", "scalemass", "studentdesk", "testtube"] },
  { id: "food-drink", terms: ["birthday cake", "cooktop", "dishwasher", "frying pan", "menucard", "microwave", "oven", "pizza slice", "popcorn", "refrigerator", "stove", "tray", "waterbottle"] },
  { id: "recreation-games", terms: ["arcade stick", "die face", "gamecontroller", "puzzlepiece", "teddybear", "theatermasks"] },
  { id: "recreation-sport", terms: ["american football", "australian football", "baseball", "basketball", "cricket ball", "hockey puck", "oar", "rugbyball", "skateboard", "skis", "snowboard", "soccerball", "surfboard", "tennis racket", "tennisball", "trophy", "volleyball"] },
  { id: "health", terms: ["air purifier", "comb", "eyeglasses", "fire extinguisher", "flask", "fluid", "inhaler", "lifepreserver", "testtube"] },
  { id: "home-appliances", terms: ["air conditioner", "air purifier", "bathtub", "cabinet", "chair", "chandelier", "cooktop", "dehumidifier", "dishwasher", "door", "dryer", "fan", "fireplace", "heater", "house", "humidifier", "lamp", "light", "microwave", "oven", "refrigerator", "robotic vacuum", "shower", "sink", "sofa", "spigot", "sprinkler", "stove", "toilet", "washer"] },
  { id: "interface", terms: ["cube", "drop keypad", "entry lever keypad", "level", "rosette", "tray"] },
  { id: "locations-places", terms: ["house", "pedestrian gate", "tent"] },
  { id: "math", terms: ["gyroscope", "level", "scalemass"] },
  { id: "media", terms: ["airpods", "amplifier", "beats headphones", "earbud", "earbuds", "film", "guitars", "headphones", "headset", "hifireceiver", "horn", "metronome", "movieclapper", "opticaldisc", "pianokeys", "radio", "suitcase rolling and film", "theatermask", "tuningfork", "videoprojector"] },
  { id: "animals-plants", terms: ["pet carrier"] },
  { id: "security", terms: ["batteryblock stack trianglebadge", "door", "entry lever", "fire extinguisher", "flashlight", "helmet", "latch", "lifepreserver", "pedestrian gate"] },
  { id: "status", terms: ["balloon", "battery", "batteryblock", "fireworks", "flag", "party popper", "rosette", "trophy"] },
  { id: "time", terms: ["metronome"] },
  { id: "transportation", terms: ["drone", "helmet", "lifepreserver", "oar", "oilcan", "skateboard", "skis", "snowboard", "stroller", "suitcase", "surfboard"] },
  { id: "weather", terms: ["air conditioner", "air purifier", "barometer", "beach umbrella", "dehumidifier", "fan", "fireplace", "heater", "humidifier", "sprinkler", "umbrella"] }
];

function recordMatchesTerm(record, term) {
  const needle = normalizedName(term);
  return [record.name].concat(Array.from(record.aliases), record.sources.map(function (source) { return source.symbol; })).some(function (value) {
    const name = normalizedName(value);
    return name === needle || name.startsWith(needle + "_") || name.endsWith("_" + needle) || name.includes("_" + needle + "_");
  });
}

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

function metadataNames(record) {
  return [record.name].concat(Array.from(record.aliases), record.sources.map(function (source) { return source.symbol; })).map(normalizedName);
}

function arrowCategoryIds(record) {
  const names = metadataNames(record);
  const categories = [];
  if (names.some(function (name) { return /(?:^|_)(?:chevron|caret)(?:_|$)/.test(name); })) categories.push("arrows-chevron");
  if (names.some(function (name) { return /^(?:triangle|triangleshape)(?:_|$)/.test(name) || /^(?:forward|backward)(?:_|$)/.test(name); })) categories.push("arrows-triangle");
  if (names.some(function (name) { return /(?:^|_)(?:arrowtriangle|arrow_triangle(?:head)?)(?:_|$)/.test(name); })) categories.push("arrows-triangle-arrow");
  if (names.some(function (name) {
    return /(?:^|_)(?:arrow|arrowshape)(?:_|$)/.test(name) && !/(?:^|_)(?:arrowtriangle|arrow_triangle(?:head)?)(?:_|$)/.test(name);
  })) categories.push("arrows-chevron-arrow");
  return categories;
}

function recordDepictsPeople(record) {
  return metadataNames(record).some(function (name) {
    if (/(?:^|_)(?:person|people|user|figure|body|accessibility)(?:_|$)/.test(name)) return true;
    if (/(?:^|_)(?:ear|eye|eyes|nose|mouth|brain|lungs|heart|foot|feet|leg|arm|head|torso|fingerprint|touchid)(?:_|$)/.test(name)) return true;
    if (/(?:^|_)(?:face|faceid)(?:_|$)/.test(name) && !/(?:^|_)die_face(?:_|$)/.test(name)) return true;
    return /(?:^|_)hands?(?:_|$)/.test(name) && !/(?:^|_)door(?:_sliding)?_(?:left|right)_hand(?:_|$)/.test(name);
  });
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
    if (category.id === "people") return recordDepictsPeople(record);
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
  arrowCategoryIds(record).forEach(function (categoryId) {
    if (!categories.includes(categoryId)) categories.push(categoryId);
  });
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
  const isObjectsToolsSource = record.sources.some(function (source) { return source.repo === "objects-tools"; });
  if (isObjectsToolsSource) {
    if (!categories.includes("objects-tools")) categories.push("objects-tools");
    OBJECT_TOOL_CATEGORY_RULES.forEach(function (rule) {
      if (!categories.includes(rule.id) && rule.terms.some(function (term) { return recordMatchesTerm(record, term); })) categories.push(rule.id);
    });
  }
  const isNorwaySwedenSource = record.sources.some(function (source) { return source.repo === "norway-sweden"; });
  if (isNorwaySwedenSource && !categories.includes("commerce")) categories.push("commerce");
  const indicesSourceNames = record.sources.filter(function (source) { return source.repo === "indices"; }).map(function (source) { return normalizedName(source.symbol); });
  if (indicesSourceNames.length) {
    if (!categories.includes("indices")) categories.push("indices");
    if (indicesSourceNames.some(function (name) { return /^(?:\d{1,2}|[4-9]_alt)_(?:circle|square)(?:_|$)/.test(name); }) && !categories.includes("math")) categories.push("math");
    if (indicesSourceNames.some(function (name) { return /^[a-z]_(?:circle|square)(?:_|$)/.test(name); }) && !categories.includes("text-formatting")) categories.push("text-formatting");
    if (indicesSourceNames.some(function (name) { return /sign(?:_|$)/.test(name); }) && !categories.includes("commerce")) categories.push("commerce");
  }
  const isCountrySource = record.sources.some(function (source) {
    return source.repo === "visit-tracker" && /^assets\/svgs\/!(?:countries|continents)\//i.test(source.file);
  });
  if (isCountrySource && !categories.includes("locations-countries")) categories.push("locations-countries");
  const isEarthSource = record.sources.some(function (source) {
    return source.repo === "visit-tracker" && /^assets\/svgs\/!earth\//i.test(source.file);
  });
  if (isEarthSource && !categories.includes("locations-mapping")) categories.push("locations-mapping");
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
  if (isGameSource && !categories.includes("recreation-games")) categories.push("recreation-games");
  const isBrandingSource = record.sources.some(function (source) {
    return /(?:^|\/)(?:app[ -]?icon|apple[ -]?touch[ -]?icon|favicon|splash)[^/]*\.svg$/i.test(source.file);
  });
  if (isBrandingSource && !categories.includes("branding")) categories.push("branding");
  [
    { id: "accessibility", folder: "Accessibility" },
    { id: "editing", folder: "Editing" },
    { id: "keyboard", folder: "Keyboard" },
    { id: "locations-mapping", folder: "Maps" },
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
  return input.kind === "sf-symbol"
    || /\bclass=["'][^"']*\bsf-symbol\b/i.test(original)
    || /Generator:\s*Apple Native CoreSVG/i.test(original)
    || input.repo === "svg-converter" && /(?:^|\/)(?:bulk-convert-format|bulk-convert-circle|output|output-circle)/i.test(file)
    || /(?:^|\/)build\/icon-sources\/source-material\//i.test(file);
}

function iconNameComesFirst(candidate, current) {
  return candidate.length < current.length || (candidate.length === current.length && candidate.localeCompare(current) < 0);
}

function repairKnownSourceIcon(input, svg) {
  if (input.repo !== "visit-tracker" || input.file !== "build/icon-sources/parked-icon-consts.js") {
    return { symbol: input.symbol, svg: svg };
  }
  const transposedSquareSymbols = {
    __CHECKMARK_SQUARE_FILL: "x_square_fill",
    __X_SQUARE_FILL: "checkmark_square_fill"
  };
  const symbol = transposedSquareSymbols[input.symbol] || input.symbol;
  if (symbol === input.symbol) return { symbol: symbol, svg: svg };
  return {
    symbol: symbol,
    svg: svg.replace('<rect height="22.959" width="23.3203" x="0" y="0"/>', '<rect height="22.959" opacity="0" width="23.3203" x="0" y="0"/>')
  };
}

function consolidateRecords(target, duplicate) {
  if (iconNameComesFirst(duplicate.name, target.name)) {
    target.name = duplicate.name;
    target.hash = duplicate.hash;
    target.svg = duplicate.svg;
  }
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
  const repaired = repairKnownSourceIcon(input, svg);
  svg = repaired.svg;
  const hash = crypto.createHash("sha256").update(canonicalSvg(svg)).digest("hex").slice(0, 12);
  const name = normalizedName(input.preferredName || repaired.symbol);
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
    if (!input.inline && iconNameComesFirst(name, existing.name)) existing.name = name;
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

existingCatalog.forEach(function (icon) {
  const retainedSources = Array.isArray(icon.sources) && icon.sources.length ? icon.sources : [{ repo: "retained-catalog", file: "assets/js/icon-library.js", symbol: icon.name }];
  retainedSources.forEach(function (source, index) {
    addIcon({ repo: source.repo, file: source.file, symbol: source.symbol || icon.name, preferredName: index === 0 ? icon.name : "", kind: icon.kind, svg: icon.svg });
  });
});

const assignedIconIds = new Set();

function stableIconId(record, preferred) {
  const slug = preferred.replace(/_/g, "-");
  const candidates = [
    existingIdByHash.get(record.hash),
    existingIdByName.get(preferred),
    preferred === "x_square_fill" ? "x-square-fill-44b51b" : "",
    slug + "-" + record.hash.slice(0, 6),
    slug + "-" + record.hash.slice(0, 8),
    slug + "-" + record.hash
  ].filter(Boolean);
  const selected = candidates.find(function (candidate) { return !assignedIconIds.has(candidate); });
  if (!selected) throw new Error("Could not assign a unique icon id for " + preferred + ".");
  assignedIconIds.add(selected);
  return selected;
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
    id: stableIconId(record, preferred),
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
  ["arrows", "locations", "recreation"].forEach(function (parentId) {
    if (!overrideCategories.includes(parentId)) return;
    record.categories.filter(function (categoryId) { return ICON_CATEGORY_BY_ID.get(categoryId)?.parent === parentId; }).forEach(function (categoryId) {
      if (!overrideCategories.includes(categoryId)) overrideCategories.push(categoryId);
    });
  });
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
  return category.id === "other" || records.some(function (record) { return record.categories.includes(category.id); });
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
