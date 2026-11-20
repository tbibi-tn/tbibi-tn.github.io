// Tbibi license server — Cloudflare Worker + D1 (free plan).
// Stores ONLY licenses, devices, settings and app versions. Never patient data.
//
// Routes
//   POST /api/check        app check-in  {key, device, label, appVersion, stats} -> signed license
//   GET  /api/pubkey       public key the app uses to verify licenses
//   GET  /app/<key>        serves the app version assigned to this license
//   GET  /admin            admin dashboard (password created on first visit)
//   /api/admin/*           admin API (needs the admin session cookie)
//
// D1 binding name: DB. No secrets needed: the signing key and the admin password
// hash are created on first use and kept in the `config` table.

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS config(k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS doctors(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, cabinet TEXT, phone TEXT,
     license_key TEXT UNIQUE, max_devices INTEGER DEFAULT 1, expires TEXT, status TEXT DEFAULT 'active',
     version TEXT DEFAULT '', settings TEXT DEFAULT '{}', notes TEXT DEFAULT '', created TEXT)`,
  `CREATE TABLE IF NOT EXISTS devices(id INTEGER PRIMARY KEY AUTOINCREMENT, doctor_id INTEGER, device_id TEXT,
     label TEXT, app_version TEXT, stats TEXT, first_seen TEXT, last_seen TEXT, blocked INTEGER DEFAULT 0,
     UNIQUE(doctor_id, device_id))`,
  `CREATE TABLE IF NOT EXISTS versions(version TEXT PRIMARY KEY, notes TEXT, html TEXT, created TEXT)`,
];
const OFFLINE_DAYS = 14;
const now = () => new Date().toISOString();
const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", ...CORS, ...h } });
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" };
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();

let ready = false;
async function init(env) {
  if (ready) return;
  await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
  ready = true;
}
const cfg = async (env, k) => (await env.DB.prepare("SELECT v FROM config WHERE k=?").bind(k).first())?.v ?? null;
const setCfg = (env, k, v) => env.DB.prepare("INSERT OR REPLACE INTO config(k,v) VALUES(?,?)").bind(k, v).run();

// ---- signing key (ECDSA P-256), created once ----
async function keys(env) {
  let priv = await cfg(env, "priv"), pub = await cfg(env, "pub");
  if (!priv) {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    priv = JSON.stringify(await crypto.subtle.exportKey("jwk", kp.privateKey));
    pub = JSON.stringify(await crypto.subtle.exportKey("jwk", kp.publicKey));
    await setCfg(env, "priv", priv); await setCfg(env, "pub", pub);
  }
  return { priv: JSON.parse(priv), pub: JSON.parse(pub) };
}
async function sign(env, payload) {
  const { priv } = await keys(env);
  const k = await crypto.subtle.importKey("jwk", priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const body = b64(enc.encode(JSON.stringify(payload)));
  const sig = b64(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, enc.encode(body)));
  return body + "." + sig;
}

// ---- admin password + session ----
async function hashPw(pw, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return b64(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, k, 256));
}
async function hmac(env, msg) {
  let s = await cfg(env, "session_secret");
  if (!s) { s = b64(crypto.getRandomValues(new Uint8Array(32))); await setCfg(env, "session_secret", s); }
  const k = await crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
async function isAdmin(env, req) {
  const c = (req.headers.get("cookie") || "").match(/tb_admin=([^;]+)/);
  if (!c) return false;
  const [exp, sig] = c[1].split(".");
  return +exp > Date.now() && sig === (await hmac(env, "admin." + exp));
}
async function sessionCookie(env) {
  const exp = Date.now() + 7 * 864e5;
  return `tb_admin=${exp}.${await hmac(env, "admin." + exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`;
}
const newKey = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint8Array(16)); return "TB-" + [0, 4, 8, 12].map((i) => [...r.slice(i, i + 4)].map((x) => a[x % a.length]).join("")).join("-"); };

// ---- app check-in ----
async function check(env, req) {
  const b = await req.json().catch(() => ({}));
  const key = String(b.key || "").trim().toUpperCase(), device = String(b.device || "").slice(0, 64);
  if (!key || !device) return json({ ok: false, error: "missing" }, 400);
  const d = await env.DB.prepare("SELECT * FROM doctors WHERE license_key=?").bind(key).first();
  if (!d) return json({ ok: false, error: "unknown_key" }, 403);
  if (d.status !== "active") return json({ ok: false, error: "blocked" }, 403);
  if (d.expires && d.expires < now().slice(0, 10)) return json({ ok: false, error: "expired", expires: d.expires }, 403);
  const dev = await env.DB.prepare("SELECT * FROM devices WHERE doctor_id=? AND device_id=?").bind(d.id, device).first();
  if (dev?.blocked) return json({ ok: false, error: "device_blocked" }, 403);
  if (!dev) {
    const n = (await env.DB.prepare("SELECT COUNT(*) n FROM devices WHERE doctor_id=? AND blocked=0").bind(d.id).first()).n;
    if (n >= d.max_devices) return json({ ok: false, error: "too_many_devices", max: d.max_devices }, 403);
    await env.DB.prepare("INSERT INTO devices(doctor_id,device_id,label,app_version,stats,first_seen,last_seen) VALUES(?,?,?,?,?,?,?)")
      .bind(d.id, device, String(b.label || "").slice(0, 120), String(b.appVersion || ""), JSON.stringify(b.stats || {}), now(), now()).run();
  } else {
    await env.DB.prepare("UPDATE devices SET last_seen=?, app_version=?, stats=?, label=COALESCE(NULLIF(?,''),label) WHERE id=?")
      .bind(now(), String(b.appVersion || ""), JSON.stringify(b.stats || {}), String(b.label || "").slice(0, 120), dev.id).run();
  }
  const payload = { did: d.id, key, device, cabinet: d.cabinet, name: d.name, version: d.version || null,
    settings: JSON.parse(d.settings || "{}"), expires: d.expires || null, iat: Date.now(), until: Date.now() + OFFLINE_DAYS * 864e5 };
  return json({ ok: true, license: await sign(env, payload) });
}

// ---- admin API ----
async function admin(env, req, path) {
  const m = req.method;
  if (path === "/api/admin/status") return json({ setup: !(await cfg(env, "admin_hash")), logged: await isAdmin(env, req) });
  if (path === "/api/admin/login" && m === "POST") {
    const { password } = await req.json().catch(() => ({}));
    if (!password || password.length < 8) return json({ ok: false, error: "Password: 8 characters minimum" }, 400);
    const h = await cfg(env, "admin_hash");
    if (!h) { const salt = b64(crypto.getRandomValues(new Uint8Array(16))); await setCfg(env, "admin_salt", salt); await setCfg(env, "admin_hash", await hashPw(password, salt)); }
    else if ((await hashPw(password, await cfg(env, "admin_salt"))) !== h) { await new Promise((r) => setTimeout(r, 800)); return json({ ok: false, error: "Wrong password" }, 403); }
    return json({ ok: true }, 200, { "set-cookie": await sessionCookie(env) });
  }
  if (path === "/api/admin/logout") return json({ ok: true }, 200, { "set-cookie": "tb_admin=; Path=/; Max-Age=0" });
  if (!(await isAdmin(env, req))) return json({ ok: false, error: "auth" }, 401);

  if (path === "/api/admin/data") {
    const doctors = (await env.DB.prepare("SELECT * FROM doctors ORDER BY id").all()).results;
    const devices = (await env.DB.prepare("SELECT id,doctor_id,device_id,label,app_version,stats,first_seen,last_seen,blocked FROM devices ORDER BY last_seen DESC").all()).results;
    const versions = (await env.DB.prepare("SELECT version,notes,created,length(html) size FROM versions ORDER BY created DESC").all()).results;
    return json({ doctors, devices, versions });
  }
  if (path === "/api/admin/doctor" && m === "POST") {
    const b = await req.json();
    const f = [b.name || "", b.cabinet || "", b.phone || "", +b.max_devices || 1, b.expires || "", b.status || "active", b.version || "", JSON.stringify(b.settings || {}), b.notes || ""];
    if (b.id) await env.DB.prepare("UPDATE doctors SET name=?,cabinet=?,phone=?,max_devices=?,expires=?,status=?,version=?,settings=?,notes=? WHERE id=?").bind(...f, b.id).run();
    else await env.DB.prepare("INSERT INTO doctors(name,cabinet,phone,max_devices,expires,status,version,settings,notes,license_key,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(...f, newKey(), now()).run();
    return json({ ok: true });
  }
  if (path === "/api/admin/doctor/delete" && m === "POST") {
    const { id } = await req.json();
    await env.DB.batch([env.DB.prepare("DELETE FROM devices WHERE doctor_id=?").bind(id), env.DB.prepare("DELETE FROM doctors WHERE id=?").bind(id)]);
    return json({ ok: true });
  }
  if (path === "/api/admin/device" && m === "POST") {
    const { id, action } = await req.json();
    if (action === "remove") await env.DB.prepare("DELETE FROM devices WHERE id=?").bind(id).run();
    else await env.DB.prepare("UPDATE devices SET blocked=? WHERE id=?").bind(action === "block" ? 1 : 0, id).run();
    return json({ ok: true });
  }
  if (path === "/api/admin/version" && m === "POST") {
    const b = await req.json();
    if (!/^[\w.\-]{1,20}$/.test(b.version || "") || !b.html) return json({ ok: false, error: "version + file required" }, 400);
    await env.DB.prepare("INSERT OR REPLACE INTO versions(version,notes,html,created) VALUES(?,?,?,?)").bind(b.version, b.notes || "", b.html, now()).run();
    return json({ ok: true });
  }
  if (path === "/api/admin/version/delete" && m === "POST") {
    const { version } = await req.json();
    await env.DB.prepare("DELETE FROM versions WHERE version=?").bind(version).run();
    return json({ ok: true });
  }
  return json({ ok: false, error: "not_found" }, 404);
}

// ---- serve the app version assigned to a license ----
async function serveApp(env, key) {
  const d = await env.DB.prepare("SELECT version,status FROM doctors WHERE license_key=?").bind(key.toUpperCase()).first();
  if (!d || d.status !== "active") return new Response("Invalid license", { status: 403 });
  const v = d.version
    ? await env.DB.prepare("SELECT html FROM versions WHERE version=?").bind(d.version).first()
    : await env.DB.prepare("SELECT html FROM versions ORDER BY created DESC LIMIT 1").first();
  if (!v) return new Response("No version published", { status: 404 });
  return new Response(v.html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    await init(env);
    const url = new URL(req.url), p = url.pathname.replace(/\/+$/, "") || "/";
    try {
      if (p === "/api/check" && req.method === "POST") return await check(env, req);
      if (p === "/api/pubkey") return json((await keys(env)).pub);
      if (p.startsWith("/api/admin")) return await admin(env, req, p);
      if (p.startsWith("/app/")) return await serveApp(env, decodeURIComponent(p.slice(5)));
      if (p === "/admin" || p === "/") return new Response(ADMIN_HTML, { headers: { "content-type": "text/html; charset=utf-8", "x-frame-options": "DENY" } });
      return new Response("Not found", { status: 404 });
    } catch (e) {
      return json({ ok: false, error: String(e.message || e) }, 500);
    }
  },
};

const ADMIN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tbibi — Admin</title>
<style>
:root{--pri:#0f7b5f;--bg:#f4f7f6;--line:#dde7e3;--mut:#5c7a70;--red:#c0392b;--amb:#b7791f}
*{box-sizing:border-box}body{margin:0;font:14px system-ui,Segoe UI,sans-serif;background:var(--bg);color:#16302a}
header{background:#fff;border-bottom:1px solid var(--line);padding:12px 20px;display:flex;gap:12px;align-items:center}
header b{font-size:17px;color:var(--pri)}main{padding:20px;max-width:1200px;margin:auto}
.card{background:#fff;border:1px solid var(--line);border-radius:10px;margin-bottom:16px}.card h3{margin:0;padding:12px 16px;border-bottom:1px solid var(--line);display:flex;gap:8px;align-items:center}
table{width:100%;border-collapse:collapse}td,th{padding:8px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--mut);font-weight:600}
tr.click{cursor:pointer}tr.click:hover{background:#f0f6f3}
button,.btn{background:#fff;border:1px solid var(--line);border-radius:7px;padding:6px 12px;cursor:pointer;font:inherit}button.pri{background:var(--pri);color:#fff;border-color:var(--pri)}button.red{color:var(--red)}
input,select,textarea{font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:7px;width:100%}textarea{min-height:70px}
label{display:block;font-size:12px;color:var(--mut);margin-bottom:10px}label>*{margin-top:3px;color:#16302a}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0 14px}.c2{grid-column:span 2}.c3{grid-column:1/-1}
.pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:12px;background:#e6f4ef;color:var(--pri)}.pill.red{background:#fbeaea;color:var(--red)}.pill.amb{background:#fdf3e1;color:var(--amb)}
.mut{color:var(--mut);font-size:12px}.right{margin-left:auto}code{background:#eef3f1;padding:2px 6px;border-radius:5px;user-select:all}
.modal{position:fixed;inset:0;background:#0006;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:30px 10px}.modal>div{background:#fff;border-radius:12px;width:min(760px,100%);padding:18px}
#login{max-width:340px;margin:12vh auto}.err{color:var(--red);font-size:13px;min-height:18px}
.feat{display:flex;flex-wrap:wrap;gap:6px 16px}.feat label{display:flex;gap:6px;align-items:center;color:#16302a;font-size:13px}.feat input{width:auto;margin:0}
</style></head><body>
<div id="root"></div>
<script>
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const api=async(p,b)=>{const r=await fetch("/api/admin/"+p,b?{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}:{});const d=await r.json();if(r.status===401){boot();throw 0}if(!d.ok&&d.error&&!d.doctors)alert(d.error);return d};
const FEATS=[["agenda","Agenda"],["journal","Journal"],["meds","Medications"],["stats","Statistics"],["queue","Waiting room / QR"],["security","Encryption"]];
const ago=t=>{if(!t)return"never";const m=(Date.now()-new Date(t))/6e4;return m<60?Math.round(m)+" min":m<1440?Math.round(m/60)+" h":Math.round(m/1440)+" d"};
let D={doctors:[],devices:[],versions:[]};
async function boot(){
  const s=await (await fetch("/api/admin/status")).json();
  if(s.logged)return load();
  $("#root").innerHTML=\`<div id="login" class="card" style="padding:20px"><h2 style="margin-top:0;color:var(--pri)">Tbibi — Admin</h2><p class="mut">\${s.setup?"First login: choose your admin password (8 characters minimum).":"Sign in."}</p><label>Password<input type="password" id="pw" autocomplete="\${s.setup?"new-password":"current-password"}"></label><div class="err" id="er"></div><button class="pri" id="go">\${s.setup?"Create and sign in":"Sign in"}</button></div>\`;
  const go=async()=>{const r=await fetch("/api/admin/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:$("#pw").value})});const d=await r.json();d.ok?load():$("#er").textContent=d.error};
  $("#go").onclick=go;$("#pw").onkeydown=e=>e.key==="Enter"&&go();$("#pw").focus();
}
async function load(){D=await api("data");draw()}
function draw(){
  const devs=id=>D.devices.filter(x=>x.doctor_id===id);
  const today=new Date().toISOString().slice(0,10);
  $("#root").innerHTML=\`<header><b>Tbibi</b><span class="mut">License administration</span><button class="right" onclick="fetch('/api/admin/logout').then(boot)">Sign out</button></header><main>
  <div class="card"><h3>Doctors <span class="pill">\${D.doctors.length}</span><button class="pri right" onclick="edit()">+ New doctor</button></h3>
  <table><thead><tr><th>Doctor / clinic</th><th>License key</th><th>Devices</th><th>Version</th><th>Last activity</th><th>Patients</th><th>License</th></tr></thead><tbody>
  \${D.doctors.map(d=>{const dv=devs(d.id),last=dv[0],st=JSON.parse(last?.stats||"{}"),exp=d.expires&&d.expires<today;
   return\`<tr class="click" onclick="edit(\${d.id})"><td><b>\${esc(d.name)}</b><div class="mut">\${esc(d.cabinet)}</div></td><td><code onclick="event.stopPropagation()">\${d.license_key}</code></td>
   <td>\${dv.filter(x=>!x.blocked).length} / \${d.max_devices}</td><td>\${esc(d.version||"latest")}</td><td>\${last?ago(last.last_seen)+'<div class="mut">v'+esc(last.app_version)+"</div>":'<span class="mut">never</span>'}</td>
   <td>\${st.patients??"—"}<div class="mut">\${st.visits!=null?st.visits+" visits":""}</div></td>
   <td>\${d.status!=="active"?'<span class="pill red">blocked</span>':exp?'<span class="pill red">expired</span>':'<span class="pill">active</span>'}<div class="mut">\${d.expires?"→ "+d.expires:"no limit"}</div></td></tr>\`}).join("")||'<tr><td colspan="7" class="mut">No doctors yet. Click "New doctor".</td></tr>'}
  </tbody></table></div>
  <div class="card"><h3>App versions <button class="right" onclick="upVer()">+ Publish a version</button></h3>
  <table><thead><tr><th>Version</th><th>Notes</th><th>Published</th><th>Size</th><th>Doctors</th><th></th></tr></thead><tbody>
  \${D.versions.map((v,i)=>\`<tr><td><b>\${esc(v.version)}</b> \${i===0?'<span class="pill">latest</span>':""}</td><td>\${esc(v.notes)}</td><td>\${v.created.slice(0,10)}</td><td>\${Math.round(v.size/1024)} KB</td><td>\${D.doctors.filter(d=>d.version===v.version||(!d.version&&i===0)).map(d=>esc(d.name)).join(", ")}</td><td><button class="red" onclick="delVer('\${esc(v.version)}')">Delete</button></td></tr>\`).join("")||'<tr><td colspan="6" class="mut">No version published.</td></tr>'}
  </tbody></table></div></main>\`;
}
function edit(id){
  const d=id?D.doctors.find(x=>x.id===id):{name:"",cabinet:"",phone:"",max_devices:1,expires:"",status:"active",version:"",settings:"{}",notes:""};
  const s=JSON.parse(d.settings||"{}"),doc=s.doctor||{},off=s.off||[];
  const f=(k,l,v,c="",t="text")=>\`<label class="\${c}">\${l}<input id="f_\${k}" type="\${t}" value="\${esc(v)}"></label>\`;
  const dv=id?D.devices.filter(x=>x.doctor_id===id):[];
  const m=document.createElement("div");m.className="modal";m.innerHTML=\`<div><h2 style="margin-top:0">\${id?esc(d.name):"New doctor"}</h2>
  \${id?\`<p>License key: <code>\${d.license_key}</code></p>\`:""}
  <h4>License</h4><div class="grid">\${f("name","Doctor name",d.name)}\${f("cabinet","Clinic name",d.cabinet)}\${f("phone","Phone (contact)",d.phone)}
  \${f("max_devices","Allowed devices",d.max_devices,"","number")}\${f("expires","Expires on (empty = never)",d.expires,"","date")}
  <label>Status<select id="f_status"><option value="active">Active</option><option value="blocked" \${d.status!=="active"?"selected":""}>Blocked</option></select></label>
  <label>Version<select id="f_version"><option value="">Always the latest</option>\${D.versions.map(v=>\`<option \${d.version===v.version?"selected":""}>\${esc(v.version)}</option>\`).join("")}</select></label>
  \${f("notes","Notes (private)",d.notes,"c2")}</div>
  <h4>Clinic settings <span class="mut">(applied at the app's next check-in)</span></h4><div class="grid">
  \${f("dname","Displayed name",doc.name||"")}\${f("spe","Specialty",doc.spe||"")}\${f("dphone","Clinic phone",doc.phone||"")}
  \${f("addr","Address",doc.addr||"","c2")}\${f("city","City",doc.city||"")}\${f("hours","Opening hours",doc.hours||"","c2")}\${f("cnam","CNAM code",doc.cnam||"")}</div>
  <label>Enabled features</label><div class="feat">\${FEATS.map(([k,l])=>\`<label><input type="checkbox" data-feat="\${k}" \${off.includes(k)?"":"checked"}>\${l}</label>\`).join("")}</div>
  \${id?\`<h4>Devices (\${dv.length})</h4><table><thead><tr><th>Device</th><th>Version</th><th>First / last seen</th><th>Data</th><th></th></tr></thead><tbody>\${dv.map(x=>{const st=JSON.parse(x.stats||"{}");return\`<tr><td>\${esc(x.label||x.device_id.slice(0,8))} \${x.blocked?'<span class="pill red">blocked</span>':""}</td><td>v\${esc(x.app_version)}</td><td>\${x.first_seen.slice(0,10)} / \${ago(x.last_seen)}</td><td class="mut">\${st.patients??"?"} patients · \${st.visits??"?"} consult.\${st.backup?" · backup "+ago(st.backup):""}</td><td><button onclick="devAct(\${x.id},'\${x.blocked?"unblock":"block"}')">\${x.blocked?"Unblock":"Block"}</button> <button class="red" onclick="devAct(\${x.id},'remove')">Remove</button></td></tr>\`}).join("")||'<tr><td colspan="5" class="mut">No device activated.</td></tr>'}</tbody></table>\`:""}
  <div style="display:flex;gap:8px;margin-top:16px">\${id?'<button class="red" id="del">Delete</button>':""}<span class="right"></span><button id="cl">Cancel</button><button class="pri" id="ok">Save</button></div></div>\`;
  document.body.append(m);const v=k=>m.querySelector("#f_"+k).value.trim();
  m.querySelector("#cl").onclick=()=>m.remove();
  m.querySelector("#ok").onclick=async()=>{
    const settings={doctor:Object.fromEntries([["name","dname"],["spe","spe"],["phone","dphone"],["addr","addr"],["city","city"],["hours","hours"],["cnam","cnam"]].map(([a,b])=>[a,v(b)]).filter(x=>x[1])),off:[...m.querySelectorAll("[data-feat]")].filter(x=>!x.checked).map(x=>x.dataset.feat)};
    await api("doctor",{id,name:v("name"),cabinet:v("cabinet"),phone:v("phone"),max_devices:v("max_devices"),expires:v("expires"),status:v("status"),version:v("version"),notes:v("notes"),settings});m.remove();load()};
  id&&(m.querySelector("#del").onclick=async()=>{if(confirm("Delete this doctor and their license?")){await api("doctor/delete",{id});m.remove();load()}});
}
window.devAct=async(id,action)=>{if(action==="remove"&&!confirm("Remove this device? It will need to be activated again."))return;await api("device",{id,action});document.querySelector(".modal")?.remove();await load()};
function upVer(){
  const m=document.createElement("div");m.className="modal";m.innerHTML=\`<div><h2 style="margin-top:0">Publish a version</h2><p class="mut">Choose the file <b>dist/tbibi.html</b> built with <code>npm run build</code>.</p>
  <label>Version number<input id="vv" placeholder="1.5.0"></label><label>Notes<input id="vn" placeholder="What changed"></label><label>File<input type="file" id="vf" accept=".html"></label>
  <div style="display:flex;gap:8px"><span class="right"></span><button id="cl">Cancel</button><button class="pri" id="ok">Publish</button></div></div>\`;
  document.body.append(m);m.querySelector("#cl").onclick=()=>m.remove();
  m.querySelector("#vf").onchange=e=>{const mt=(e.target.files[0]?.name||"");};
  m.querySelector("#ok").onclick=async()=>{const f=m.querySelector("#vf").files[0];if(!f)return;const html=await f.text();const auto=(html.match(/Tbibi v([\\w.\\-]+)/)||[])[1];
    const r=await api("version",{version:m.querySelector("#vv").value.trim()||auto,notes:m.querySelector("#vn").value,html});if(r.ok){m.remove();load()}};
}
window.delVer=async v=>{if(confirm("Delete version "+v+" ?")){await api("version/delete",{version:v});load()}};
boot();
</script></body></html>`;
