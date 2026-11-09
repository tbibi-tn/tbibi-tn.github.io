/* =========================================================
   WAITING-ROOM SCREEN (#/ecran) — for a TV or second monitor
   Shows ticket numbers (never full names), the estimated time
   for each, and a QR code patients scan to follow the queue
   on their phone. Refreshes itself when the main window saves.
   ========================================================= */
const CHANNEL=("BroadcastChannel" in window)?new BroadcastChannel("tbibi"):null;
function announceSave(){try{CHANNEL&&CHANNEL.postMessage({type:"saved",at:Date.now()})}catch(e){}}
async function reloadFromStore(){
  try{
    if(SEC.key){const box=await kvGet("vault");if(!box)return;const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(box.iv)},SEC.key,box.ctBytes||b64d(box.ct));S=JSON.parse(new TextDecoder().decode(pt))}
    else{const d=await kvGet("data");if(d)S=d}
  }catch(e){console.warn("reload",e)}
}
function openWaitingScreen(){
  const url=location.href.split("#")[0]+"#/ecran";
  const w=window.open(url,"tbibi-ecran","popup,width=1280,height=760");
  if(!w)go("ecran");
}
const anonName=r=>{if(S.settings.screenNames!=="initials")return"";const p=r.patientId?P(r.patientId):null;const n=p?[p.prenom,p.nom]:String(r.name||"").replace(/^(Mme\.|Mr\.|Mlle\.)\s*/,"").split(" ").reverse();return n.filter(Boolean).map(x=>x[0].toUpperCase()+".").join(" ")};
function vScreen(){
  document.documentElement.dataset.theme=UI.theme;
  ensureTickets();
  const{eta,cur,q,avg}=queueETA(),D=S.settings.doctor,now=Date.now();
  const url=patientPageUrl(queueSnapshot());
  const next=q.waiting.slice(0,8);
  const mins=ms=>Math.max(0,Math.round((ms-now)/60000));
  $("#app").innerHTML=`<div class="screen">
   <header class="sc-top">
     <div class="row" style="gap:14px">${D.logo?`<img class="sc-logo" src="${D.logo}" alt="">`:`<div class="mark">${LOGO}</div>`}<div><div class="sc-dn">${esc(D.name)}</div><div class="sc-sp">${esc(D.spe||"")}</div></div></div>
     <div class="sc-clock" id="scClock">${nowHM()}</div>
   </header>
   <main class="sc-main">
     <section class="sc-left">
       <div class="sc-now"><div class="sc-lbl">${t("sc_now")} · <span lang="ar">في الفحص</span></div><div class="sc-big">${cur&&cur.ticket?cur.ticket:"—"}</div>${cur?`<div class="sc-name">${esc(anonName(cur))}</div>`:""}</div>
       <div class="sc-list">
         <div class="sc-lbl">${t("sc_next")} · <span lang="ar">الدور القادم</span></div>
         ${next.length?next.map((r,i)=>`<div class="sc-row ${i===0?"first":""}"><span class="sc-t">${r.ticket||"?"}</span><span class="sc-n">${esc(anonName(r))}</span><span class="sc-eta">≈ ${hm(eta[r.id])}</span><span class="sc-in">${i===0&&!cur?t("sc_soon"):t("sc_in").replace("{m}",durStr(mins(eta[r.id])))}</span></div>`).join(""):`<div class="sc-empty">${t("sc_empty")}</div>`}
         ${q.waiting.length>next.length?`<div class="sc-more">+ ${q.waiting.length-next.length} ${t("sc_more")}</div>`:""}
       </div>
     </section>
     <aside class="sc-qr">
       <div class="sc-qrbox">${qrSvg(url,{ecl:"L",border:2,dark:"#0d2a21",title:t("sc_scan")})}</div>
       <div class="sc-scan">${t("sc_scan")}</div><div class="sc-scan ar" lang="ar" dir="rtl">امسح الرمز لمعرفة وقت دورك</div>
       <div class="sc-avg">${t("q_avg").replace("{m}",avg)}</div>
     </aside>
   </main>
   <footer class="sc-foot"><span>${t("sc_privacy")}</span><span class="row"><button class="btn sm ghost" data-act="scFull">${I("scan")}${t("sc_full")}</button><button class="btn sm ghost" data-act="scExit">${I("x")}${t("close")}</button></span></footer>
  </div>`;
  ACT.scFull=()=>{const el=document.documentElement;document.fullscreenElement?document.exitFullscreen():el.requestFullscreen&&el.requestFullscreen()};
  ACT.scExit=()=>{if(window.name==="tbibi-ecran")window.close();else go("today")};
}
/* the screen keeps itself up to date */
CHANNEL&&CHANNEL.addEventListener("message",async e=>{if(e.data&&e.data.type==="saved"&&UI.route[0]==="ecran"&&!UI.locked){await reloadFromStore();render()}});
setInterval(async()=>{if(UI.route[0]==="ecran"&&S&&!UI.locked){await reloadFromStore();render()}},30000);
setInterval(()=>{const c=$("#scClock");if(c)c.textContent=nowHM()},10000);
