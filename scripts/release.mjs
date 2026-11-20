// Publishes the current build as an app version on the license server.
//   npm run release            -> builds, copies dist/tbibi.html to server/versions/<version>.html
// Commit and push to main: GitHub deploys the server and the version appears in the admin panel.
// Bump "version" in package.json first for a new release.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
execFileSync(process.execPath, [join(root, "scripts/build.mjs"), ...process.argv.slice(2).filter((a) => a === "--no-minify")], { stdio: "inherit" });
const dir = join(root, "server/versions"), idx = join(dir, "index.json");
const list = existsSync(idx) ? JSON.parse(readFileSync(idx, "utf8")) : [];
const notes = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ");
copyFileSync(join(root, "dist/tbibi.html"), join(dir, pkg.version + ".html"));
copyFileSync(join(root, "src/attente.html"), join(dir, "attente.html"));
const old = list.find((v) => v.version === pkg.version);
if (old) { old.created = new Date().toISOString(); if (notes) old.notes = notes; }
else list.unshift({ version: pkg.version, notes, created: new Date().toISOString() });
list.sort((a, b) => b.created.localeCompare(a.created));
writeFileSync(idx, JSON.stringify(list, null, 1) + "\n");
console.log(`server/versions/${pkg.version}.html ready — commit and push to publish.`);
