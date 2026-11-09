// Perf check: times each screen with a large practice (6,000 patients, 70,000 visits).
// Usage: npm run build && node tests/perf.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("file://" + join(root, "dist", "tbibi.html"));
await page.waitForFunction(() => typeof S !== "undefined" && S && document.querySelector(".page"));
const res = await page.evaluate(async () => {
  const P0 = S.patients.slice(), V0 = S.visits.slice(), R0 = S.rdv.slice(); S.patients = []; S.visits = [];
  for (let i = 0; i < 6000; i++) { const p = structuredClone(P0[i % P0.length]); p.id = "x" + i; p.dossier = String(100000 + i); S.patients.push(p); }
  const today = todayISO();
  for (let i = 0; i < 70000; i++) { const v = structuredClone(V0[i % V0.length]); v.id = "y" + i; v.patientId = "x" + (i % 6000); if (i % 1000 === 0) v.date = today; S.visits.push(v); }
  S.rdv = R0.map((r, i) => ({ ...r, patientId: "x" + i }));
  const out = {};
  const time = (name, fn) => { const t0 = performance.now(); for (let k = 0; k < 3; k++) fn(); out[name] = Math.round((performance.now() - t0) / 3); };
  for (const r of ["today", "journal", "patients", "agenda", "meds", "templates", "stats", "settings", "patient/x42", "patient/x42/vitals"]) {
    time(r, () => { UI.route = r.split("/"); render(); });
  }
  // search: open the palette and type a word, one keystroke at a time
  openSearch(); const inp = document.querySelector("#sq");
  const t0 = performance.now(); for (const q of ["b", "be", "ben", "ben a"]) { inp.value = q; inp.dispatchEvent(new Event("input")); }
  out["search (4 keystrokes)"] = Math.round(performance.now() - t0); closeModal();
  // looking up one patient by id, 10,000 times
  const t1 = performance.now(); for (let i = 0; i < 10000; i++) P("x" + (i % 6000)); out["P(id) x10,000"] = Math.round(performance.now() - t1);
  return out;
});
console.table(res);
await browser.close();
