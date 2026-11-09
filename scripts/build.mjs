// Builds the single-file app from src/:
//   dist/tbibi.html        the app (one file, for doctors to download)
//   dist/attente.html      patient phone page, local copy
//   docs/index.html        the app on GitHub Pages  -> https://<user>.github.io/tbibi/
//   docs/attente/          patient phone page on GitHub Pages (opened by the QR code;
//                          docs/attente.html is the same page, found automatically by the online app)
// Usage: node scripts/build.mjs [--no-minify]
// No dependencies needed. If esbuild is installed (npm install), the output is minified.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MODULES } from "./modules.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (p) => join(root, "src", p);
const out = (p) => { const f = join(root, p); mkdirSync(dirname(f), { recursive: true }); return f; };
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

let css = readFileSync(src("styles/main.css"), "utf8");
let js = MODULES.map((m) => `/* ---- src/js/${m} ---- */\n` + readFileSync(src("js/" + m), "utf8")).join("\n");

// Optional minification. Modules share top-level globals, so the code is minified as one
// classic script: esbuild keeps top-level names and only shortens local ones.
let minified = false;
if (!process.argv.includes("--no-minify")) {
  try {
    const esbuild = await import("esbuild");
    const opts = { minify: true, target: "es2020", legalComments: "none" };
    js = (await esbuild.transform(js, { ...opts, loader: "js" })).code;
    css = (await esbuild.transform(css, { ...opts, loader: "css" })).code;
    minified = true;
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND") throw e; // a real syntax error must stop the build
  }
}

const banner = `/*! Tbibi v${pkg.version} — built ${new Date().toISOString().slice(0, 10)} */`;
const html = readFileSync(src("index.html"), "utf8")
  .replace("<!-- @inline-css -->", () => `<style>\n${css}</style>`)
  .replace("<!-- @inline-js -->", () => `<script>\n${banner}\nconst APP_VERSION="${pkg.version}";\n${js}</script>`);

writeFileSync(out("dist/tbibi.html"), html);
writeFileSync(out("docs/index.html"), html);
copyFileSync(src("attente.html"), out("dist/attente.html"));
copyFileSync(src("attente.html"), out("docs/attente/index.html"));
copyFileSync(src("attente.html"), out("docs/attente.html")); // the online app's QR code finds it with no setup
if (!existsSync(join(root, "docs", ".nojekyll"))) writeFileSync(out("docs/.nojekyll"), ""); // serve files as-is on GitHub Pages

console.log(`dist/tbibi.html  ${(html.length / 1024).toFixed(0)} KB  (v${pkg.version}, ${MODULES.length} modules${minified ? ", minified" : ""})`);
