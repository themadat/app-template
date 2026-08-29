#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceParent = path.dirname(projectRoot);
const outputFile = path.join(projectRoot, "assets/js/icon-library.js");
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
const stats = { files: 0, extracted: 0, templateLiterals: 0, inlineMarkup: 0, standalone: 0, rejected: 0, skippedOversized: 0 };

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

function addIcon(input) {
  const kind = isSfSymbol(input) ? "sf-symbol" : "custom";
  const svg = cleanSvg(input.svg);
  if (!svg) { stats.rejected += 1; return; }
  const hash = crypto.createHash("sha256").update(canonicalSvg(svg)).digest("hex").slice(0, 12);
  const name = normalizedName(input.symbol);
  const source = { repo: input.repo, file: input.file, symbol: input.symbol };
  const existing = recordsByHash.get(hash);
  stats.extracted += 1;
  if (existing) {
    existing.aliases.add(name);
    existing.sources.push(source);
    existing.kinds.add(kind);
    if (!input.inline && name.length < existing.name.length) existing.name = name;
    return;
  }
  recordsByHash.set(hash, { hash: hash, name: name, aliases: new Set([name]), sources: [source], kinds: new Set([kind]), svg: svg });
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

const records = Array.from(recordsByHash.values()).map(function (record) {
  const aliases = Array.from(record.aliases).sort();
  const sourcesForIcon = record.sources.sort(function (a, b) {
    return (a.repo + a.file + a.symbol).localeCompare(b.repo + b.file + b.symbol);
  });
  const preferred = record.name;
  return {
    id: preferred.replace(/_/g, "-") + "-" + record.hash.slice(0, 6),
    name: preferred,
    label: labelFor(preferred),
    kind: record.kinds.has("sf-symbol") ? "sf-symbol" : "custom",
    aliases: aliases,
    repositories: Array.from(new Set(sourcesForIcon.map(function (source) { return source.repo; }))).sort(),
    sources: sourcesForIcon,
    svg: record.svg
  };
}).sort(function (a, b) { return a.label.localeCompare(b.label, undefined, { numeric: true }) || a.id.localeCompare(b.id); });

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
  lines.push("      repositories: " + JSON.stringify(record.repositories) + ",");
  lines.push("      sources: " + JSON.stringify(record.sources) + ",");
  lines.push("      svg: " + templateLiteral(record.svg));
  lines.push("    },");
});

lines.push("  ];");
lines.push("  window.LocalApp.iconLibrary = Object.freeze({");
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
  scannedSources: sources.filter(function (source) { return fs.existsSync(source.root); }).map(function (source) { return source.name; }),
  contributingSources: contributingSources
}, null, 2) + "\n");
