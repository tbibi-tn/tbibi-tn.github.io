// Builds the single-file app: src/ -> dist/tbibi.html
// Usage: node scripts/build.mjs   (no dependencies needed)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (p) => join(root, "src", p);
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// Load order matters: later files use globals defined by earlier ones.
export const MODULES = [
  "i18n.js",
  "data/demo-data.js",
  "core/state.js",
  "core/utils.js",
  "ui/icons.js",
  "ui/qr.js",
  "ui/components.js",
  "core/storage.js",
  "core/security.js",
  "ui/shell.js",
  "views/search.js",
  "views/queue.js",
  "views/today.js",
  "views/screen.js",
  "views/journal.js",
  "views/patients.js",
  "views/patient.js",
  "views/patient-form.js",
  "views/visit.js",
  "views/certificates.js",
  "pdf/documents.js",
  "views/agenda.js",
  "views/meds.js",
  "views/templates.js",
  "ui/charts.js",
  "views/stats.js",
  "views/settings.js",
  "main.js",
];

const css = readFileSync(src("styles/main.css"), "utf8");
const js = MODULES.map((m) => `/* ---- src/js/${m} ---- */\n` + readFileSync(src("js/" + m), "utf8")).join("\n");
const banner = `/*! Tbibi v${pkg.version} — built ${new Date().toISOString().slice(0, 10)} */`;

const html = readFileSync(src("index.html"), "utf8")
  .replace("<!-- @inline-css -->", () => `<style>\n${css}</style>`)
  .replace("<!-- @inline-js -->", () => `<script>\n${banner}\nconst APP_VERSION="${pkg.version}";\n${js}</script>`);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "tbibi.html"), html);
// Patient page opened by the QR code: dist/ for local use, docs/attente/ for GitHub Pages
const attente = readFileSync(src("attente.html"), "utf8");
writeFileSync(join(root, "dist", "attente.html"), attente);
mkdirSync(join(root, "docs", "attente"), { recursive: true });
writeFileSync(join(root, "docs", "attente", "index.html"), attente);
console.log(`dist/tbibi.html  ${(html.length / 1024).toFixed(0)} KB  (v${pkg.version}, ${MODULES.length} modules)`);
