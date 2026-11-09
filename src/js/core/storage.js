/* =========================================================
   STORAGE — IndexedDB key/value store
   Holds hundreds of MB (localStorage is capped at ~5 MB).
   Keys: "data" (plain records) or "vault" (encrypted records).
   Falls back to localStorage only if IndexedDB is unavailable.
   ========================================================= */
const DB_NAME="tbibi",DB_STORE="kv";
const LEGACY={data:["tbibi.data.v1","cabineo.data.v1"],vault:["tbibi.vault.v1"]};
const STORE={db:null,backend:"idb",dirty:false,writing:null,failed:false};

function idbOpen(){
  return new Promise((res,rej)=>{
    if(!window.indexedDB)return rej(new Error("no-idb"));
    let rq;try{rq=indexedDB.open(DB_NAME,1)}catch(e){return rej(e)}
    rq.onupgradeneeded=()=>rq.result.createObjectStore(DB_STORE);
    rq.onsuccess=()=>res(rq.result);
    rq.onerror=()=>rej(rq.error);
    rq.onblocked=()=>rej(new Error("blocked"));
  });
}
function idbReq(mode,fn){
  return new Promise((res,rej)=>{
    const tx=STORE.db.transaction(DB_STORE,mode),st=tx.objectStore(DB_STORE);let out;
    const r=fn(st);if(r)r.onsuccess=()=>{out=r.result};
    tx.oncomplete=()=>res(out);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error("abort"));
  });
}
async function kvGet(k){
  if(STORE.backend==="ls"){const r=localStorage.getItem("tbibi."+k);return r?JSON.parse(r):undefined}
  return idbReq("readonly",st=>st.get(k));
}
async function kvSet(k,v){
  if(STORE.backend==="ls"){localStorage.setItem("tbibi."+k,JSON.stringify(v));return}
  return idbReq("readwrite",st=>st.put(v,k));
}
async function kvDel(k){
  if(STORE.backend==="ls"){localStorage.removeItem("tbibi."+k);return}
  return idbReq("readwrite",st=>st.delete(k));
}

/* open the database and move any data left in localStorage by v1.0–1.2 */
async function storageInit(){
  try{STORE.db=await idbOpen()}catch(e){STORE.backend="ls";console.warn("IndexedDB unavailable, using localStorage",e);return}
  for(const k of ["vault","data"]){
    for(const lk of LEGACY[k]){
      const raw=localStorage.getItem(lk);if(!raw)continue;
      try{const have=await kvGet(k);if(have===undefined)await kvSet(k,JSON.parse(raw));localStorage.removeItem(lk)}catch(e){console.error("migration",lk,e)}
    }
  }
  if(await kvGet("vault")!==undefined)await kvDel("data"); // never keep a plain copy next to the vault
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
}

/* Coalesced writer: many save() calls in a row produce one write of the latest state. */
function persist(){if(UI.route[0]==="ecran")return Promise.resolve(); /* the TV screen only reads */
  STORE.dirty=true;if(!STORE.writing)STORE.writing=writeLoop();return STORE.writing}
async function writeLoop(){
  try{while(STORE.dirty){STORE.dirty=false;await writeOnce()}}
  finally{STORE.writing=null}
}
async function writeOnce(){
  if(!S)return;
  try{
    if(SEC.key){const box=await sealWith(SEC.key,SEC.salt,SEC.iter,S,true);await kvSet("vault",box);await kvDel("data")}
    else{await kvSet("data",S);await kvDel("vault")}
    announceSave();
    if(STORE.failed){STORE.failed=false;const b=$("#savefail");b&&b.remove()}
  }catch(e){
    console.error("save failed",e);STORE.failed=true;
    if(!$("#savefail")){const d=document.createElement("div");d.id="savefail";d.className="savefail";d.innerHTML=`${I("alert")}<div><b>${t("store_fail")}</b><br>${t("store_fail_hint")}</div>`;document.body.appendChild(d)}
  }
}
const flushSave=()=>STORE.writing||Promise.resolve();
async function storageUsage(){try{if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();return{used:e.usage||0,quota:e.quota||0}}}catch(e){}return null}
async function storagePersisted(){try{return navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():false}catch(e){return false}}
