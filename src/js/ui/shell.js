/* ---------- router ---------- */
function go(path){location.hash="#/"+path}
function parseHash(){const h=location.hash.replace(/^#\/?/,"");UI.route=h?h.split("/"):["today"]}

/* ---------- shell ---------- */
const NAV=[["today","today"],["agenda","agenda"],["patients","patients"],["journal","journal"],["sep","grp_tools"],["meds","meds"],["templates","templates"],["stats","stats"],["sep",""],["settings","settings"]];
const LOGO=`<svg viewBox="0 0 24 24" fill="none"><path d="M9.2 3.5h5.6v5.7h5.7v5.6h-5.7v5.7H9.2v-5.7H3.5V9.2h5.7z" fill="#fff"/><path d="M6 12h3l1.4-2.4L13 14.6l1.4-2.6H18" stroke="#0f7b5f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const brandHTML=()=>`<div class="mark">${LOGO}</div><div><div class="wordmark">${APP}<span class="ar">${APP_AR}</span></div><small>${t("tagline")}</small></div>`;
function shell(){
  const r=UI.route[0]==="patient"?"patients":UI.route[0];
  const waiting=S.rdv.filter(x=>x.date===todayISO()&&x.status==="arrive").length;
  document.documentElement.lang=UI.lang;
  $("#app").innerHTML=`
  <div class="app">
   <aside class="side" id="side">
    <div class="brand">${brandHTML()}</div>
    ${NAV.map(n=>n[0]==="sep"?`<div class="sep"></div>${n[1]?`<div class="grp-l">${t(n[1])}</div>`:""}`:`<button class="nav ${r===n[0]?"on":""}" data-go="${n[0]}">${I(n[1])}<span>${t("nav_"+n[0])}</span>${n[0]==="today"&&waiting?`<span class="badge">${waiting}</span>`:""}</button>`).join("")}
    <div class="foot"><div class="avatar">${esc((S.settings.doctor.name.replace(/^Dr\.?\s*/i,"")[0]||"D").toUpperCase())}</div><div><b>${esc(S.settings.doctor.name)}</b>${esc(S.settings.doctor.spe)}</div></div>
   </aside>
   <div class="main">
    <header class="top">
      <button class="iconbtn menu-btn" data-act="menu" aria-label="Menu">${I("menu")}</button>
      <div class="search-trigger" data-act="search" role="button" tabindex="0">${I("search")}<span>${t("search_ph")}</span><kbd>Ctrl K</kbd></div>
      <div class="grow"></div>
      <div class="seg" title="${t("lang")}"><button class="${UI.lang==="fr"?"on":""}" data-lang="fr">FR</button><button class="${UI.lang==="en"?"on":""}" data-lang="en">EN</button></div>
      <button class="iconbtn" data-act="theme" title="${t("theme")}" aria-label="${t("theme")}">${I(UI.theme==="dark"?"sun":"moon")}</button>
      ${encrypted()?`<button class="iconbtn hide-m" data-act="lock" title="${t("lock")}" aria-label="${t("lock")}">${I("lock")}</button>`:""}
      <button class="btn pri hide-m" data-act="newPatient">${I("userplus")}${t("new_patient")}</button>
    </header>
    <main class="page" id="page"></main>
   </div>
  </div>`;
}
function render(){
  document.documentElement.dataset.theme=UI.theme;
  if(UI.route[0]==="ecran"){vScreen();return}
  shell();
  const r=UI.route[0],pg=$("#page");
  const V={today:vToday,journal:vJournal,patients:vPatients,patient:vPatient,agenda:vAgenda,meds:vMeds,templates:vTemplates,stats:vStats,settings:vSettings}[r]||vToday;
  V(pg);
  draftBanner(pg);
}
/* unsaved consultation kept as a draft (survives closing the browser) */
function draftBanner(pg){
  const dr=S.draft;if(!dr||VE.open)return;const p=P(dr.pid);if(!p){delete S.draft;return}
  const mins=Math.max(1,Math.round((Date.now()-dr.at)/60000));
  const div=document.createElement("div");div.className="alert amber draftbar";
  div.innerHTML=`${I("edit")}<div style="flex:1">${t("draft_banner").replace("{p}",`<b>${esc(fullName(p))}</b>`)} <span style="font-weight:500">(${mins<60?mins+" min":fmtD(isoDate(dr.at))})</span></div><button class="btn sm pri" data-act="draftResume">${t("draft_resume")}</button><button class="btn sm ghost" data-act="draftDrop">${t("draft_discard")}</button>`;
  pg.prepend(div);
}
var ACT_EXTRA={
  draftResume:()=>{const dr=S.draft;if(dr)openVisit(dr.pid,{draft:dr})},
  draftDrop:()=>confirmBox(t("draft_discard_q"),()=>{delete S.draft;save();render()},{yes:t("draft_discard")}),
};
/* global listeners */
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]");if(g){go(g.dataset.go);$("#side")&&$("#side").classList.remove("open");return}
  const l=e.target.closest("[data-lang]");if(l){UI.lang=l.dataset.lang;savePrefs();render();if(VE.open)VE.rerender();return}
  const c=e.target.closest("[data-close]");if(c){closeModal();return}
  const a=e.target.closest("[data-act]");if(a&&ACT[a.dataset.act]){ACT[a.dataset.act](a,e);return}
});
document.addEventListener("keydown",e=>{
  if(UI.locked)return;
  const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k==="k"){e.preventDefault();openSearch();return}
  if(e.key==="Escape"&&modalStack.length){e.preventDefault();closeModal();return}
  if(e.key==="Escape"&&VE.open){VE.close();return}
  if((e.ctrlKey||e.metaKey)&&k==="s"){e.preventDefault();if(VE.open)VE.save();else if(UI.route[0]==="settings"&&ACT.setSave)ACT.setSave();return}
  const typing=/input|textarea|select/i.test(document.activeElement.tagName);
  if(!typing&&e.key==="/"){e.preventDefault();openSearch()}
  if(e.altKey&&k==="n"){e.preventDefault();openPatientForm()}
});
const ACT={
  menu:()=>$("#side").classList.toggle("open"),
  theme:()=>{UI.theme=UI.theme==="dark"?"light":"dark";savePrefs();document.documentElement.dataset.theme=UI.theme;render()},
  search:()=>openSearch(),
  newPatient:()=>openPatientForm(),
  lock:()=>lockNow(),
};
Object.assign(ACT,ACT_EXTRA);
$("#app")||document.body.insertAdjacentHTML("afterbegin",'<div id="app"></div>');
