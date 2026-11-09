/* =========================================================
   SECURITY — encrypted patient vault (Web Crypto API)
   AES-256-GCM, key derived from the doctor's password with
   PBKDF2-SHA256 (310 000 iterations, 16-byte random salt).
   The password and key never leave memory; nothing is sent
   over the network.
   ========================================================= */
const SEC={key:null,salt:null,iter:310000,last:Date.now(),fails:0,until:0};
const cryptoOK=()=>!!(window.crypto&&crypto.subtle&&window.isSecureContext!==false);
function b64e(u8){let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)}
function b64d(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
async function deriveKey(pw,salt,iter){
  const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
/* raw=true keeps the ciphertext as bytes (IndexedDB); otherwise base64 (backup files) */
async function sealWith(key,salt,iter,obj,raw){
  const iv=crypto.getRandomValues(new Uint8Array(12)),plain=new TextEncoder().encode(JSON.stringify(obj));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,plain));
  const box={app:"tbibi",format:"vault",v:1,kdf:"PBKDF2-SHA256",iter,cipher:"AES-256-GCM",salt:b64e(salt),iv:b64e(iv),at:new Date().toISOString()};
  if(raw)box.ctBytes=ct;else box.ct=b64e(ct);
  return box;
}
async function openBox(pw,box){
  const salt=b64d(box.salt),key=await deriveKey(pw,salt,box.iter||310000);
  const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(box.iv)},key,box.ctBytes||b64d(box.ct)); // throws if password is wrong or data was altered
  return{key,salt,iter:box.iter||310000,data:JSON.parse(new TextDecoder().decode(pt))};
}
async function sealWithPassword(pw,obj){const salt=crypto.getRandomValues(new Uint8Array(16));return sealWith(await deriveKey(pw,salt,SEC.iter),salt,SEC.iter,obj)}
const isBox=o=>o&&o.app==="tbibi"&&(o.ct||o.ctBytes)&&o.iv&&o.salt;
async function readVault(){try{return(await kvGet("vault"))||null}catch(e){return null}}
const encrypted=()=>!!SEC.key;

async function enableEncryption(pw){
  SEC.salt=crypto.getRandomValues(new Uint8Array(16));
  SEC.key=await deriveKey(pw,SEC.salt,SEC.iter);
  await persist();
}
async function verifyPassword(pw){await flushSave();const v=await readVault();if(!v)return false;try{await openBox(pw,v);return true}catch(e){return false}}
async function disableEncryption(){await flushSave();SEC.key=null;SEC.salt=null;await persist()}

/* lock / unlock */
async function lockNow(){
  if(!SEC.key)return;
  if(VE.open)VE.close(true);
  await flushSave();while(modalStack.length)closeModal();
  S=null;SEC.key=null;UI.locked=true;
  $("#app").innerHTML="";showUnlock();
}
function showUnlock(){
  if($(".lock"))return;
  const d=document.createElement("div");d.className="lock";
  d.innerHTML=`<form class="box" autocomplete="off"><div class="mark">${LOGO}</div><h2 style="margin:0 0 4px">${APP} <span style="font-family:var(--ar);color:var(--side-acc);font-weight:600">${APP_AR}</span></h2>
   <p style="margin:0 0 18px;color:var(--side-ink)">${t("sec_locked")}</p>
   <input class="in" type="password" placeholder="${t("sec_password")}" style="text-align:center;font-size:16px;height:46px" autocomplete="current-password">
   <button class="btn pri lg" style="width:100%;justify-content:center;margin-top:10px;background:var(--side-acc);color:#06261b;border-color:var(--side-acc)">${I("lock")}${t("unlock")}</button>
   <p class="msg" style="min-height:22px;font-weight:600;color:#ffb3a9;margin:12px 0 0"></p>
   <p style="font-size:12px;color:var(--side-mute);margin-top:14px">${t("sec_forgot")}</p></form>`;
  document.body.appendChild(d);const f=d.querySelector("form"),i=d.querySelector("input"),msg=d.querySelector(".msg"),btn=d.querySelector("button");i.focus();
  f.onsubmit=async e=>{e.preventDefault();
    if(Date.now()<SEC.until){msg.textContent=t("sec_wait").replace("{s}",Math.ceil((SEC.until-Date.now())/1000));return}
    btn.disabled=true;msg.textContent="";
    try{const o=await openBox(i.value,await readVault());S=o.data;migrateData();SEC.key=o.key;SEC.salt=o.salt;SEC.iter=o.iter;SEC.fails=0;UI.locked=false;SEC.last=Date.now();d.remove();start()}
    catch(err){SEC.fails++;if(SEC.fails>=5)SEC.until=Date.now()+30000*(SEC.fails-4);msg.textContent=t("wrong_pin");i.value="";i.focus()}
    btn.disabled=false};
}
/* auto-lock after inactivity */
["mousemove","keydown","mousedown","touchstart","wheel"].forEach(ev=>document.addEventListener(ev,()=>{SEC.last=Date.now()},{passive:true}));
setInterval(()=>{if(!SEC.key||UI.locked||!S||UI.route[0]==="ecran")return;const m=+(S.settings.autolock??10);if(m>0&&Date.now()-SEC.last>m*60000)lockNow()},15000);

/* password strength 0..4 */
function pwScore(pw){let s=0;if(pw.length>=8)s++;if(pw.length>=12)s++;if(/[a-z]/.test(pw)&&/[A-Z]/.test(pw))s++;if(/\d/.test(pw)&&/[^A-Za-z0-9]/.test(pw))s++;return Math.min(s,4)}
function pwMeter(input,bar){input.addEventListener("input",()=>{const s=pwScore(input.value);bar.style.setProperty("--w",(s*25)+"%");bar.dataset.s=s})}

/* modals */
function openEnableEncryption(){
  openModal(mh(t("sec_enable"),"","lock")+`<form class="mb form" autocomplete="off"><div class="c12 alert green">${I("shield")}<div>${t("sec_enable_text")}</div></div>
   <label class="field c12"><span>${t("sec_new_pw")}</span><input class="in" type="password" id="p1" autocomplete="new-password"><div class="pwbar" id="pb"></div></label>
   <label class="field c12"><span>${t("sec_confirm_pw")}</span><input class="in" type="password" id="p2" autocomplete="new-password"></label>
   <div class="c12 alert amber">${I("alert")}<div>${t("sec_no_recovery")}</div></div><p class="c12 red b" id="pe" style="margin:0;min-height:18px"></p></form>
   <div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="pok">${I("lock")}${t("sec_enable")}</button></div>`,{cls:"sm",onMount:m=>{
    pwMeter(m.querySelector("#p1"),m.querySelector("#pb"));
    const go=async()=>{const a=m.querySelector("#p1").value,b=m.querySelector("#p2").value,er=m.querySelector("#pe");
      if(a.length<8){er.textContent=t("sec_pw_short");return}if(a!==b){er.textContent=t("sec_pw_mismatch");return}
      m.querySelector("#pok").disabled=true;await enableEncryption(a);closeModal();toast(t("sec_enabled"));render()};
    m.querySelector("#pok").onclick=go;m.querySelector("form").onsubmit=e=>{e.preventDefault();go()}}});
}
function openChangePassword(){
  openModal(mh(t("sec_change"),"","lock")+`<form class="mb form" autocomplete="off">
   <label class="field c12"><span>${t("sec_current_pw")}</span><input class="in" type="password" id="p0" autocomplete="current-password"></label>
   <label class="field c12"><span>${t("sec_new_pw")}</span><input class="in" type="password" id="p1" autocomplete="new-password"><div class="pwbar" id="pb"></div></label>
   <label class="field c12"><span>${t("sec_confirm_pw")}</span><input class="in" type="password" id="p2" autocomplete="new-password"></label><p class="c12 red b" id="pe" style="margin:0;min-height:18px"></p></form>
   <div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="pok">${I("check")}${t("save")}</button></div>`,{cls:"sm",onMount:m=>{
    pwMeter(m.querySelector("#p1"),m.querySelector("#pb"));
    m.querySelector("#pok").onclick=async()=>{const o=m.querySelector("#p0").value,a=m.querySelector("#p1").value,b=m.querySelector("#p2").value,er=m.querySelector("#pe");
      if(!await verifyPassword(o)){er.textContent=t("wrong_pin");return}
      if(a.length<8){er.textContent=t("sec_pw_short");return}if(a!==b){er.textContent=t("sec_pw_mismatch");return}
      await enableEncryption(a);closeModal();toast(t("sec_changed"))}}});
}
function askPassword(title,text,cb){
  openModal(mh(title,"","lock")+`<form class="mb form" autocomplete="off">${text?`<p class="c12 muted" style="margin:0">${text}</p>`:""}<label class="field c12"><span>${t("sec_password")}</span><input class="in" type="password" id="p0"></label><p class="c12 red b" id="pe" style="margin:0;min-height:18px"></p></form>
   <div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="pok">${I("check")}${t("confirm")}</button></div>`,{cls:"sm",onMount:m=>{
    const go=async()=>{const r=await cb(m.querySelector("#p0").value);if(r===false)m.querySelector("#pe").textContent=t("wrong_pin");else closeModal()};
    m.querySelector("#pok").onclick=go;m.querySelector("form").onsubmit=e=>{e.preventDefault();go()}}});
}
/* backups */
function openBackupExport(){
  const fname="tbibi_sauvegarde_"+todayISO();
  if(SEC.key){flushSave().then(()=>sealWith(SEC.key,SEC.salt,SEC.iter,S)).then(box=>{download(fname+".tbibi",JSON.stringify(box),"application/json");toast(t("sec_backup_enc_ok"))});return}
  openModal(mh(t("set_export"),"","download")+`<form class="mb form" autocomplete="off"><p class="c12 muted" style="margin:0">${t("sec_backup_text")}</p>
   <label class="field c6"><span>${t("sec_new_pw")}</span><input class="in" type="password" id="p1" autocomplete="new-password"></label>
   <label class="field c6"><span>${t("sec_confirm_pw")}</span><input class="in" type="password" id="p2" autocomplete="new-password"></label><p class="c12 red b" id="pe" style="margin:0;min-height:18px"></p></form>
   <div class="mf"><button class="btn ghost" id="plain" style="margin-right:auto">${t("sec_backup_plain")}</button><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="pok">${I("lock")}${t("sec_backup_enc")}</button></div>`,{cls:"sm",onMount:m=>{
    m.querySelector("#plain").onclick=()=>confirmBox(t("sec_backup_plain_warn"),()=>{closeModal();download(fname+".json",JSON.stringify(S),"application/json")},{yes:t("sec_backup_plain")});
    m.querySelector("#pok").onclick=async()=>{const a=m.querySelector("#p1").value,b=m.querySelector("#p2").value,er=m.querySelector("#pe");
      if(a.length<8){er.textContent=t("sec_pw_short");return}if(a!==b){er.textContent=t("sec_pw_mismatch");return}
      const box=await sealWithPassword(a,S);closeModal();download(fname+".tbibi",JSON.stringify(box),"application/json");toast(t("sec_backup_enc_ok"))}}});
}
function importBackupText(text){
  let o;try{o=JSON.parse(text)}catch(e){toast("⚠ "+t("import_err"));return}
  const apply=data=>{if(!data||!data.patients||!data.visits){toast("⚠ "+t("import_err"));return}S=data;migrateData();save();toast(t("import_ok"));render()};
  if(isBox(o)){askPassword(t("set_import"),t("sec_import_text"),async pw=>{try{const r=await openBox(pw,o);apply(r.data)}catch(e){return false}});return}
  confirmBox(t("sec_import_confirm"),()=>apply(o),{yes:t("set_import")});
}
