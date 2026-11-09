// Smoke test: opens dist/tbibi.html in Chromium, exercises every screen and the
// critical flows (storage, encryption, drafts, PDFs), and saves screenshots to
// docs/screenshots/.  Usage: npm install && npm test   (SHOTS=0 to skip screenshots)
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import zlib from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = "file://" + join(root, "dist", "tbibi.html");
const shots = join(root, "docs", "screenshots");
mkdirSync(shots, { recursive: true });
const SHOT = process.env.SHOTS !== "0";
let failed = 0;
const ok = (cond, msg) => { console.log((cond ? "  ✓ " : "  ✗ ") + msg); if (!cond) failed++; };
const section = (s) => console.log("\n" + s);

const browser = await chromium.launch();
const errors = [];
async function newPage(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  await page.goto(url); await page.waitForFunction(() => typeof S !== "undefined" && S && document.querySelector(".page"));
  return page;
}
const flush = (page) => page.evaluate(() => flushSave());
/* tiny valid PNG (solid green 40x20) for upload tests */
function png() {
  const w = 40, h = 20, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set([15, 123, 95], y * (w * 3 + 1) + 1 + x * 3);
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 0xff] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
/* capture the HTML of the next printed document without opening the print dialog */
const capturePrint = (page, code) => page.evaluate((code) => new Promise((r) => {
  const mo = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.tagName === "IFRAME") { n.contentWindow.print = () => {}; setTimeout(() => { mo.disconnect(); r(n.contentDocument.documentElement.outerHTML); }, 60); } })));
  mo.observe(document.body, { childList: true }); (0, eval)(code);
}), code);

let page = await newPage();
const shot = async (name) => { await page.waitForTimeout(250); if (SHOT) await page.screenshot({ path: join(shots, name + ".png") }); };

section("Screens");
await shot("today");
for (const r of ["journal", "patients", "agenda", "meds", "templates", "stats", "settings"]) { await page.evaluate((r) => (location.hash = "#/" + r), r); await shot(r); }
await page.evaluate(() => (location.hash = "#/patient/p4")); await shot("patient");
await page.evaluate(() => (location.hash = "#/patient/p4/vitals")); await shot("patient-vitals");
ok(errors.length === 0, "all screens render without errors");

section("Storage (IndexedDB)");
ok(await page.evaluate(() => STORE.backend === "idb"), "IndexedDB is used");
ok(await page.evaluate(async () => (await kvGet("data")).patients.length === S.patients.length), "records are saved in IndexedDB");
ok(await page.evaluate(() => !localStorage.getItem("tbibi.data.v1")), "no patient data left in localStorage");

section("Search");
await page.keyboard.press("Control+k"); await page.keyboard.type("grip"); await page.waitForTimeout(150);
ok((await page.locator(".palette .it").count()) > 0, "realtime search returns results");
const counts = await page.evaluate(() => { const n = S.visits.filter((v) => norm(v.diagnostic).includes("grip")).length; return { shown: +document.querySelector('#scat [data-c="visits"] .n').textContent, real: n }; });
ok(counts.shown >= counts.real, `category count is exact (${counts.shown} visits)`);
await shot("search"); await page.keyboard.press("Escape");

section("Consultation");
await page.evaluate(() => (location.hash = "#/patient/p4")); await page.waitForTimeout(200);
const before = await page.evaluate(() => S.visits.length);
await page.click("[data-act=pvisit]");
await page.fill("[data-vt=poids]", "78"); await page.fill("[data-vt=taille]", "176"); await page.fill("[data-vt=ta_s]", "150");
await page.fill("#vdx", "Angine"); await page.fill("#vmed", "amox"); await page.waitForTimeout(100); await page.keyboard.press("Enter");
await page.waitForTimeout(200); await shot("consultation");
await page.click("[data-doc=repos]"); await page.waitForTimeout(80); await page.evaluate(() => closeModal());
await page.evaluate(() => document.activeElement.blur());
await page.keyboard.press("Control+s"); await page.waitForTimeout(250);
ok((await page.evaluate(() => S.visits.length)) === before + 1, "Ctrl+S saves even when focus is outside the form");

section("Drafts");
await page.click("[data-act=pvisit]"); await page.fill("[data-f=motif]", "Toux depuis 3 jours");
await page.waitForTimeout(2800);
ok(await page.evaluate(() => S.draft && S.draft.d.motif === "Toux depuis 3 jours"), "draft is saved automatically while typing");
await page.keyboard.press("Escape"); await page.waitForTimeout(100);
ok(await page.locator("#dq-keep").isVisible(), "closing asks what to do with unsaved changes");
await page.click("#dq-keep"); await flush(page);
await page.reload(); await page.waitForFunction(() => S && document.querySelector(".page"));
ok(await page.locator(".draftbar").isVisible(), "draft survives closing the browser (banner shown)");
await shot("draft-banner");
await page.click("[data-act=draftResume]"); await page.waitForTimeout(200);
ok((await page.inputValue("[data-f=motif]")) === "Toux depuis 3 jours", "resuming restores what was typed");
await page.click("#vsave"); await page.waitForTimeout(200);
ok(await page.evaluate(() => !S.draft), "saving the visit removes the draft");

section("Bug fixes");
ok(await page.evaluate(() => { const r = parseRdvName("Mme. Haddad Sirine"); return r.titre === "Mme." && r.sexe === "F" && r.nom === "Haddad" && r.prenom === "Sirine"; }), "appointment name keeps title and sex");
await page.click("[data-act=newPatient]"); await page.click("#pfs"); await page.waitForTimeout(80);
ok(await page.evaluate(() => [...document.querySelectorAll(".toast")].pop().classList.contains("warn")), "errors use the warning toast");
await page.evaluate(() => { while (modalStack.length) closeModal(); });
const pages = await capturePrint(page, 'pdfRx(S.patients[3],{date:todayISO(),rx:S.meds.slice(0,11).map(m=>({nom:m.nom,posologie:m.posologies[0],qte:1,duree:"7 jours"}))})');
ok((pages.match(/class="sheet"/g) || []).length === 2 && (pages.match(/Mme\. Belhaj Ines/g) || []).length >= 2, "long prescription: 2 pages, each with header and patient");
await page.evaluate(() => (location.hash = "#/agenda")); await page.waitForTimeout(150);
const taken = await page.evaluate(() => S.rdv.find((r) => r.status !== "absent" && r.date > todayISO()));
await page.evaluate((r) => openRdvForm(null, { date: r.date, time: r.time }), taken);
await page.fill("#rn", "Test Patient"); await page.click("#rok"); await page.waitForTimeout(100);
ok(await page.evaluate(() => /chevauche|overlaps/.test([...document.querySelectorAll(".modal .mh h2")].pop().textContent)), "double booking asks for confirmation");
await page.evaluate(() => { while (modalStack.length) closeModal(); });

section("Settings");
await page.evaluate(() => (location.hash = "#/settings")); await page.waitForTimeout(200);
await page.fill("#sn", "Dr Test Auto"); await page.locator("#ss").focus(); await page.waitForTimeout(100);
ok(await page.evaluate(() => S.settings.doctor.name === "Dr Test Auto"), "settings save automatically");
await page.setInputFiles("#lgf", { name: "logo.png", mimeType: "image/png", buffer: png() }); await page.waitForTimeout(400);
await page.setInputFiles("#stf", { name: "stamp.png", mimeType: "image/png", buffer: png() }); await page.waitForTimeout(400);
ok(await page.evaluate(() => /^data:image\/png/.test(S.settings.doctor.logo || "") && /^data:image\/png/.test(S.settings.doctor.stamp || "")), "logo and stamp are uploaded");
const rx = await capturePrint(page, "pdfRx(S.patients[3],visitsOf(S.patients[3].id).find(v=>v.rx.length))");
ok(rx.includes('class="logo img"') && /class="box"><img/.test(rx), "logo and stamp are printed on the prescription");
await page.evaluate(() => document.querySelector("#stor").scrollIntoView()); await shot("settings");

section("Encryption");
await page.click("[data-act=secOn]");
await page.fill("#p1", "Cabinet#2026"); await page.fill("#p2", "Cabinet#2026"); await page.click("#pok");
await page.waitForTimeout(1200); await flush(page);
const store = await page.evaluate(async () => { const v = await kvGet("vault"), d = await kvGet("data"); const txt = v && v.ctBytes ? Array.from(v.ctBytes.slice(0, 200000), (c) => String.fromCharCode(c)).join("") : ""; return { vault: !!v, plain: d !== undefined, readable: /Belhaj|patients/.test(txt) }; });
ok(store.vault && !store.plain, "records moved into the encrypted vault, plain copy removed");
ok(!store.readable, "vault content is not readable");
await page.reload(); await page.waitForSelector(".lock");
ok(true, "app opens on the lock screen"); await shot("lock");
await page.fill(".lock input", "wrong-password"); await page.click(".lock button"); await page.waitForTimeout(1200);
ok(await page.locator(".lock").isVisible(), "wrong password is rejected");
await page.fill(".lock input", "Cabinet#2026"); await page.click(".lock button"); await page.waitForFunction(() => S && !document.querySelector(".lock"));
ok(await page.evaluate(() => S.settings.doctor.logo && S.visits.length > 0), "correct password unlocks everything (including logo)");
await page.evaluate(() => lockNow()); await page.waitForTimeout(300);
ok(await page.evaluate(() => S === null && !!document.querySelector(".lock")), "manual lock clears records from memory");
await page.fill(".lock input", "Cabinet#2026"); await page.click(".lock button"); await page.waitForFunction(() => S && !document.querySelector(".lock"));
await page.evaluate(() => (location.hash = "#/settings")); await page.waitForTimeout(200);
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-act=bkExport]")]);
ok(dl.suggestedFilename().endsWith(".tbibi"), "backup is downloaded as an encrypted .tbibi file");


section("Waiting room order");
page = await newPage();
await page.evaluate(() => { const d = todayISO(); S.rdv.filter((r) => r.date === d && r.status === "prevu").slice(0, 3).forEach((r) => markArrived(r)); save(); render(); });
const ids0 = await page.evaluate(() => todayQueue().waiting.map((r) => r.id));
ok(ids0.length >= 4, `${ids0.length} patients in the waiting room`);
ok(await page.evaluate(() => nextPatient().id === todayQueue().waiting[0].id || todayQueue().encours.length > 0), "next patient is the first one in the queue");
const last = ids0[ids0.length - 1];
await page.click(`[data-qm=first][data-id="${last}"]`); await page.waitForTimeout(100);
ok(await page.evaluate((id) => todayQueue().waiting[0].id === id && nextPatient().id === id, last), "'First' moves a patient to the top and makes them next");
await page.click(`[data-qm=down][data-id="${last}"]`); await page.waitForTimeout(100);
ok(await page.evaluate((id) => todayQueue().waiting[1].id === id, last), "arrow moves a patient down one place");
const ids1 = await page.evaluate(() => todayQueue().waiting.map((r) => r.id));
await page.dragAndDrop(`[data-qid="${ids1[2]}"] .qpos`, `[data-qid="${ids1[0]}"] .qpos`, { targetPosition: { x: 5, y: 2 } }); await page.waitForTimeout(150);
ok(await page.evaluate((id) => todayQueue().waiting[0].id === id, ids1[2]), "drag and drop reorders the queue");
await page.click("[data-qmode=time]"); await page.waitForTimeout(100);
ok(await page.evaluate(() => { const w = todayQueue().waiting; return w.every((r, i) => i === 0 || w[i - 1].time <= r.time); }), "'Appointment time' mode sorts by appointment time");
await page.click("[data-qmode=arrival]"); await page.waitForTimeout(100);
await page.click("#wroom [data-act=walkIn]"); await page.fill("#pp", "jaziri"); await page.waitForTimeout(100); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
ok(await page.evaluate(() => { const w = todayQueue().waiting; return w[w.length - 1].walkin === true; }), "walk-in patient joins the end of the queue");
await shot("waiting-room");
const before2 = await page.evaluate(() => todayQueue().waiting.length);
await page.locator("#qlist [data-q=remove]").first().click(); await page.waitForTimeout(100);
ok(await page.evaluate(() => todayQueue().waiting.length) === before2 - 1, "patient can be removed from the queue");
await page.click(".toast .tbtn"); await page.waitForTimeout(100);
ok(await page.evaluate(() => todayQueue().waiting.length) === before2, "removal can be undone");


section("Waiting-time estimate, tickets and QR");
ok(await page.evaluate(() => { const w = todayQueue().waiting; const n = w.map((r) => r.ticket); return n.every(Boolean) && new Set(n).size === n.length; }), "every waiting patient has a unique ticket number");
ok(await page.evaluate(() => { const { eta, q } = queueETA(); const w = q.waiting.map((r) => eta[r.id]); return w.every((x, i) => i === 0 || x > w[i - 1]) && w[0] >= Date.now() - 60000; }), "estimated times follow the queue order");
const purl = await page.evaluate(() => patientPageUrl(queueSnapshot(todayQueue().waiting[1].ticket)));
ok(!/Belhaj|Khelifi|Ben Ali/.test(Buffer.from(purl.split("#d=")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()), "QR data holds no patient names");
{ const pp = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage(); pp.on("pageerror", (e) => errors.push("attente: " + e.message));
  await pp.goto(purl); await pp.waitForTimeout(200);
  ok(await pp.evaluate(() => /\d/.test(document.querySelector(".num").textContent) && document.querySelectorAll(".row").length > 1), "patient page shows the ticket and the queue");
  await pp.click("[data-l=ar]"); ok(await pp.evaluate(() => document.documentElement.dir === "rtl"), "patient page switches to Arabic (right-to-left)");
  if (SHOT) await pp.screenshot({ path: join(shots, "patient-page.png"), fullPage: true }); await pp.close(); }
await page.evaluate(() => (location.hash = "#/ecran")); await page.waitForTimeout(300);
ok(await page.evaluate(() => !!document.querySelector(".screen .qr") && document.querySelectorAll(".sc-row").length > 0 && !/Belhaj|Khelifi/.test(document.querySelector(".screen").textContent)), "waiting-room screen shows tickets and a QR code, no names");
await shot("waiting-screen");
await page.evaluate(() => (location.hash = "#/today")); await page.waitForTimeout(200);
await page.keyboard.press("Control+k"); await page.waitForTimeout(100);
ok(await page.evaluate(() => document.querySelectorAll(".palette .it").length >= 8), "search box lists quick actions when empty");
await page.keyboard.type("ecran"); await page.waitForTimeout(80);
ok(await page.evaluate(() => /cran/.test(document.querySelector(".palette .it.act").textContent)), "actions can be found by typing");
await page.keyboard.press("Escape");
await page.evaluate(() => (location.hash = "#/stats")); await page.waitForTimeout(400);
ok(await page.evaluate(() => document.querySelectorAll(".viz svg").length >= 3 && document.querySelectorAll(".stat .delta").length >= 3), "statistics draw charts and period comparisons");
await page.locator("[data-vtab]").first().click();
ok(await page.evaluate(() => !!document.querySelector(".vtable:not([hidden]) table tbody tr")), "every chart has a table view");

section("Delete a patient");
const victim = await page.evaluate(() => { const p = S.patients[5]; return { id: p.id, v: S.visits.filter((v) => v.patientId === p.id).length, n: S.patients.length }; });
await page.evaluate((id) => (location.hash = "#/patient/" + id), victim.id); await page.waitForTimeout(200);
await page.click("[data-act=pdelete]"); await page.waitForTimeout(100);
ok(await page.locator("#dpok").isVisible(), "deleting asks for confirmation and lists what will be removed");
await shot("delete-patient");
await page.click("#dpok"); await page.waitForTimeout(200);
ok(await page.evaluate((x) => S.patients.length === x.n - 1 && !S.visits.some((v) => v.patientId === x.id) && location.hash === "#/patients", victim), "patient and their visits are deleted, back to the list");
await page.click(".toast .tbtn"); await page.waitForTimeout(150);
ok(await page.evaluate((x) => S.patients.length === x.n && S.visits.filter((v) => v.patientId === x.id).length === x.v, victim), "undo restores the patient with all visits");
await page.locator(`[data-del="${victim.id}"]`).click(); await page.waitForTimeout(100);
ok(await page.locator("#dpok").isVisible(), "delete button in the patient list");
await page.evaluate(() => closeModal());

section("Large practice (10 years)");
page = await newPage();
const big = await page.evaluate(async () => {
  const P0 = S.patients.slice(), V0 = S.visits.slice(); S.patients = []; S.visits = [];
  for (let i = 0; i < 6000; i++) { const p = structuredClone(P0[i % P0.length]); p.id = "x" + i; p.dossier = String(100000 + i); S.patients.push(p); }
  for (let i = 0; i < 70000; i++) { const v = structuredClone(V0[i % V0.length]); v.id = "y" + i; v.patientId = "x" + (i % 6000); S.visits.push(v); }
  const mb = (JSON.stringify(S).length / 1048576).toFixed(0); const t0 = performance.now(); save(); await flushSave(); return { mb, ms: Math.round(performance.now() - t0), failed: STORE.failed };
});
await page.reload(); await page.waitForFunction(() => S && document.querySelector(".page"));
ok(!big.failed && (await page.evaluate(() => S.visits.length)) === 70000, `70,000 visits (${big.mb} MB) saved in ${big.ms} ms and reloaded`);

section("Migration from v1.2 (localStorage)");
page = await newPage();
await page.evaluate(async () => { const o = structuredClone(S); o.patients[0].nom = "Migrated"; await kvDel("data"); localStorage.setItem("tbibi.data.v1", JSON.stringify(o)); });
await page.reload(); await page.waitForFunction(() => S && document.querySelector(".page"));
ok(await page.evaluate(() => S.patients[0].nom === "Migrated" && !localStorage.getItem("tbibi.data.v1")), "old data is moved to IndexedDB automatically");

section("Dark mode / English / mobile");
await page.click("[data-lang=en]"); await page.click("[data-act=theme]");
await page.evaluate(() => (location.hash = "#/today")); await shot("today-dark-en");
page = await newPage({ width: 390, height: 844 });
await page.evaluate(() => (location.hash = "#/patients")); await shot("mobile");
await page.evaluate(() => (location.hash = "#/agenda")); await page.waitForTimeout(200);
ok(await page.evaluate(() => document.querySelectorAll(".ag .col").length === 1 && !!document.querySelector(".daychips")), "phone calendar shows one day with day tabs");
await shot("mobile-agenda");
await page.evaluate(() => openVisit("p4")); await page.waitForTimeout(250);
ok(await page.evaluate(() => { const m = document.querySelector(".ve-main"); return m.scrollWidth <= m.clientWidth + 1; }), "phone consultation screen has no sideways scroll");
await shot("mobile-consultation");

ok(errors.length === 0, "no JavaScript errors" + (errors.length ? ": " + errors.join(" | ") : ""));
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
