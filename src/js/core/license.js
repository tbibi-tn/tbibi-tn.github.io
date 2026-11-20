/* =========================================================
   LICENSE — activation, daily check-in, offline grace.
   Sends ONLY: license key, device id, device label, app version and
   counts (patients, visits). Never any patient data.
   ========================================================= */
const LIC_SERVER="https://tbibi-license.seif-manaibs0.workers.dev";
const LIC_PUB={kty:"EC",crv:"P-256",x:"kAQ0xZtX1V8HkfTlot3LOr9Lb_cCEB-KgR2uJjE1u-o",y:"6V1vyu8mJH7h3RBBhzD3i2Qs5ZxPzEjMBb_557Hq--o"};
const LS_LIC="tbibi.license.v1",LS_DEV="tbibi.device.v1";
const LIC={key:"",token:"",data:null,lastCheck:0};
const LIC_MSG={
  fr:{title:"Activation de Tbibi",intro:"Entrez la clé de licence fournie par votre installateur.",key:"Clé de licence",go:"Activer",install:"Installer Tbibi sur cet ordinateur",offline:"Pas de connexion internet. L'activation demande internet une seule fois.",
      unknown_key:"Clé inconnue. Vérifiez la clé.",blocked:"Cette licence est suspendue. Contactez votre fournisseur.",expired:"Cette licence a expiré. Contactez votre fournisseur.",
      device_blocked:"Cet ordinateur a été désactivé. Contactez votre fournisseur.",too_many_devices:"Nombre maximal d'ordinateurs atteint pour cette licence ({n}).",
      stale:"Connexion nécessaire : l'application n'a pas pu vérifier sa licence depuis {d} jours. Connectez-vous à internet puis réessayez.",retry:"Réessayer",bad:"Licence invalide.",warn:"Licence non vérifiée depuis {d} jours — connectez-vous à internet."},
  en:{title:"Activate Tbibi",intro:"Enter the license key you were given.",key:"License key",go:"Activate",install:"Install Tbibi on this computer",offline:"No internet connection. Activation needs internet once.",
      unknown_key:"Unknown key. Please check it.",blocked:"This license is suspended. Contact your provider.",expired:"This license has expired. Contact your provider.",
      device_blocked:"This computer has been deactivated. Contact your provider.",too_many_devices:"Maximum number of computers reached for this license ({n}).",
      stale:"Connection needed: the license could not be checked for {d} days. Connect to the internet and try again.",retry:"Try again",bad:"Invalid license.",warn:"License not checked for {d} days — please connect to the internet."}
};
const lt=k=>(LIC_MSG[UI.lang]||LIC_MSG.fr)[k]||k;
function licDevice(){let d=localStorage.getItem(LS_DEV);if(!d){d=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,"0")).join("");localStorage.setItem(LS_DEV,d)}return d}
function licLabel(){const u=navigator.userAgent;return (/Windows/.test(u)?"Windows":/Mac/.test(u)?"Mac":/Android/.test(u)?"Android":/Linux/.test(u)?"Linux":"PC")+" · "+(/Edg\//.test(u)?"Edge":/Chrome\//.test(u)?"Chrome":/Firefox\//.test(u)?"Firefox":/Safari\//.test(u)?"Safari":"")}
const b64u=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4)),c=>c.charCodeAt(0));
async function licVerify(token){
  try{const [body,sig]=token.split(".");const k=await crypto.subtle.importKey("jwk",LIC_PUB,{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
    if(!await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},k,b64u(sig),new TextEncoder().encode(body)))return null;
    const d=JSON.parse(new TextDecoder().decode(b64u(body)));return d.device===licDevice()?d:null}catch(e){return null}
}
function licSave(){try{localStorage.setItem(LS_LIC,JSON.stringify({key:LIC.key,token:LIC.token,lastCheck:LIC.lastCheck}))}catch(e){}}
function licStats(){return S?{patients:S.patients.length,visits:S.visits.length,backup:S.settings&&S.settings.lastBackup||null}:{}}
/* ask the server. Returns {ok} or {error} or {offline:true} */
async function licCheck(key){
  try{const r=await fetch(LIC_SERVER+"/api/check",{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({key,device:licDevice(),label:licLabel(),appVersion:typeof APP_VERSION!=="undefined"?APP_VERSION:"dev",stats:licStats()})});
    const j=await r.json();if(!j.ok)return j;
    const d=await licVerify(j.license);if(!d)return{error:"bad"};
    Object.assign(LIC,{key,token:j.license,data:d,lastCheck:Date.now()});licSave();return{ok:true}
  }catch(e){return{offline:true}}
}
function licErrText(r){return r.offline?lt("offline"):lt(r.error).replace("{n}",r.max||"")}
/* apply the settings chosen in the admin dashboard */
function licApply(){
  const s=LIC.data&&LIC.data.settings;if(!s||!S||!S.settings)return;
  if(s.doctor){S.settings.doctor=S.settings.doctor||{};Object.assign(S.settings.doctor,s.doctor)}
  const nm=S.settings.doctor.name||LIC.data.name;
  if(nm&&!S.settings.doctor.name)S.settings.doctor.name=nm;
  if(nm&&!(S.settings.doctors||[]).length)S.settings.doctors=[nm];
}
const licOff=f=>!!(LIC.data&&LIC.data.settings&&(LIC.data.settings.off||[]).includes(f));
/* gate: resolves true when the app may run */
async function licenseGate(){
  if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&localStorage.getItem("tbibi.dev")==="1")return true; // developer mode, local only
  try{Object.assign(LIC,JSON.parse(localStorage.getItem(LS_LIC)||"{}"))}catch(e){}
  if(LIC.token)LIC.data=await licVerify(LIC.token);
  const expired=LIC.data&&LIC.data.expires&&todayISO()>LIC.data.expires;
  if(LIC.data&&Date.now()<LIC.data.until&&!expired){licBackground();licInstall();return true}
  if(LIC.key){const r=await licCheck(LIC.key);if(r.ok){licBackground();licInstall();return true}
    if(r.offline){const d=Math.floor((Date.now()-(LIC.lastCheck||0))/864e5);return licScreen(lt("stale").replace("{d}",d))}
    return licScreen(licErrText(r),true)}
  return licScreen("")
}
/* check-in once a day while the app is open; a refusal from the server locks the app */
function licBackground(){
  const run=async()=>{if(Date.now()-(LIC.lastCheck||0)<20*3600e3)return;const r=await licCheck(LIC.key);
    if(r.ok){licApply();if(S)save();if(!modalStack.length&&!VE.open)render()}
    else if(r.error){LIC.token="";LIC.data=null;licSave();location.reload()}};
  setTimeout(run,3000);setInterval(run,3600e3);
}
function licScreen(msg,askKey){
  return new Promise(res=>{
    const d=document.createElement("div");d.className="lock";
    d.innerHTML=`<form class="box" autocomplete="off"><div class="mark">${LOGO}</div><h2 style="margin:0 0 4px">${APP} <span style="font-family:var(--ar);color:var(--side-acc);font-weight:600">${APP_AR}</span></h2>
     <p style="margin:0 0 18px;color:var(--side-ink)">${LIC.key&&!askKey?"":lt("intro")}</p>
     <input class="in" placeholder="TB-XXXX-XXXX-XXXX-XXXX" value="${esc(LIC.key||"")}" style="text-align:center;font-size:16px;height:46px;letter-spacing:1px;text-transform:uppercase" aria-label="${lt("key")}">
     <button class="btn pri lg" style="width:100%;justify-content:center;margin-top:10px;background:var(--side-acc);color:#06261b;border-color:var(--side-acc)">${LIC.key&&!askKey?lt("retry"):lt("go")}</button>
     <p class="msg" style="min-height:22px;font-weight:600;color:#ffb3a9;margin:12px 0 0">${esc(msg)}</p></form>`;
    document.body.appendChild(d);const f=d.querySelector("form"),i=d.querySelector("input"),m=d.querySelector(".msg"),b=d.querySelector("button");i.focus();
    f.onsubmit=async e=>{e.preventDefault();const k=i.value.trim().toUpperCase();if(!k)return;b.disabled=true;m.textContent="…";
      const r=await licCheck(k);b.disabled=false;
      if(r.ok){d.remove();licBackground();licInstall();res(true)}else m.textContent=licErrText(r)};
  });
}
/* "install as an app" button (desktop icon, opens without internet) */
let licPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();licPrompt=e;licInstall()});
function licInstall(){
  if(!licPrompt||document.getElementById("lic-install")||matchMedia("(display-mode: standalone)").matches)return;
  const b=document.createElement("button");b.id="lic-install";b.className="btn pri";
  b.style.cssText="position:fixed;right:18px;bottom:18px;z-index:50;box-shadow:0 6px 20px #0003";
  b.innerHTML=I("download")+lt("install");
  b.onclick=async()=>{licPrompt.prompt();await licPrompt.userChoice;licPrompt=null;b.remove()};
  document.body.appendChild(b);
}
window.addEventListener("appinstalled",()=>{const b=document.getElementById("lic-install");b&&b.remove()});
