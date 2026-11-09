/* =========================================================
   GLOBAL SEARCH (realtime, multi-category)
   ========================================================= */
function openSearch(){
  let cat="all",act=0,flat=[];
  const cats=[["all","search_all"],["patients","search_patients"],["visits","search_visits"],["meds","search_meds"],["rdv","search_rdv"]];
  const m=openModal(`<div class="pin">${I("search")}<input id="sq" placeholder="${t("search_ph")}" autocomplete="off"><kbd>Esc</kbd></div><div class="chips" id="scat"></div><div class="res" id="sres"></div><div class="ft"><span><kbd>↑</kbd> <kbd>↓</kbd> ${t("search_nav")}</span><span><kbd>↵</kbd> ${t("search_open")}</span><span><kbd>Tab</kbd> ${t("search_all")} / ${t("search_patients")}…</span></div>`,{cls:"palette"});
  const inp=m.querySelector("#sq");
  /* searchable text is normalised once when the palette opens, not on every keystroke */
  let IX=null;
  const index=()=>IX||(IX={
    patients:S.patients.map(p=>[p,norm([p.nom,p.prenom,p.nomJF,p.dossier,p.tel,p.tel2,p.cin,p.cnam&&p.cnam.idu,p.ville,p.profession].join(" "))]),
    visits:[...S.visits].sort((a,b)=>b.date.localeCompare(a.date)).map(v=>{const p=P(v.patientId);return[v,norm([v.diagnostic,v.motif,v.observations,(v.rx||[]).map(r=>r.nom).join(" "),p&&p.nom,p&&p.prenom].join(" "))]}),
    meds:S.meds.map(md=>[md,norm(md.nom+" "+md.dci+" "+md.classe+" "+md.forme)]),
    rdv:S.rdv.map(r=>{const p=r.patientId?P(r.patientId):null;return[r,norm([p?shortName(p):r.name,r.motif,r.phone,fmtD(r.date)].join(" "))]}),
  });
  function run(){
    const q=inp.value.trim(),tk=norm(q).split(/\s+/).filter(Boolean);
    const res={patients:[],visits:[],meds:[],rdv:[]};
    if(tk.length){
      const match=h=>tk.every(x=>h.includes(x));
      const ix=index();
      for(const g of ["patients","visits","meds","rdv"])for(const[x,h]of ix[g])if(match(h))res[g].push(x);
      const pos=p=>norm(p.nom).indexOf(tk[0]);
      res.patients=res.patients.map(p=>[p,pos(p)]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
      res.rdv.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
    }
    const counts={patients:res.patients.length,visits:res.visits.length,meds:res.meds.length,rdv:res.rdv.length};counts.all=counts.patients+counts.visits+counts.meds+counts.rdv;
    m.querySelector("#scat").innerHTML=cats.map(c=>`<button class="chip ${cat===c[0]?"on":""}" data-c="${c[0]}">${t(c[1])}${q?`<span class="n">${counts[c[0]]}</span>`:""}</button>`).join("");
    m.querySelectorAll("#scat .chip").forEach(b=>b.onclick=()=>{cat=b.dataset.c;act=0;run();inp.focus()});
    flat=[];let html="";
    const groups=[["patients","search_patients",p=>({ico:"user",a:hl(fullName(p),tk),b:`${t("dossier")} ${hl(p.dossier,tk)} · ${ageStr(p.dob)} · ${hl(p.tel||"",tk)}${p.cin?" · CIN "+hl(p.cin,tk):""}`,go:()=>go("patient/"+p.id)})],
      ["visits","search_visits",v=>{const p=P(v.patientId);return{ico:"stetho",c:"blue",a:hl(v.diagnostic||v.motif||"—",tk),b:`${p?hl(shortName(p),tk):""} · ${fmtD(v.date)} · ${hl(v.motif||"",tk)}`,go:()=>{openVisitView(v.id)}}}],
      ["meds","search_meds",md=>({ico:"meds",c:"amber",a:hl(md.nom,tk),b:`${hl(md.dci,tk)} · ${hl(md.classe,tk)} · ${money(md.pvp)} ${t("tnd")}`,go:()=>{go("meds");setTimeout(()=>openMedForm(md.id),50)}})],
      ["rdv","search_rdv",r=>{const p=r.patientId?P(r.patientId):null;return{ico:"agenda",c:"rose",a:hl(p?fullName(p):r.name,tk),b:`${fmtD(r.date)} ${r.time} · ${t("st_"+r.status)}${r.motif?" · "+hl(r.motif,tk):""}`,go:()=>{openRdvForm(r.id)}}}]];
    /* quick actions: shown when the box is empty, and matched by name while typing */
    const acts=searchActions().filter(x=>!tk.length||tk.every(k=>norm(x.a).includes(k)));
    if(cat==="all"&&acts.length&&(!q||acts.length)){html+=`<div class="grp">${t("search_actions")}</div>`;(q?acts.slice(0,4):acts).forEach(o=>{const i=flat.length;flat.push(o);html+=`<div class="it" data-i="${i}"><div class="ico ${o.c||""}">${I(o.ico)}</div><div class="tx"><div>${hl(o.a,tk)}</div><div>${esc(o.b||"")}</div></div>${o.k?`<kbd>${o.k}</kbd>`:""}</div>`})}
    for(const[g,lab,fn]of groups){
      if(cat!=="all"&&cat!==g)continue;const arr=res[g].slice(0,cat==="all"?6:60);if(!arr.length)continue;
      html+=`<div class="grp">${t(lab)}${res[g].length>arr.length?` · ${arr.length}/${res[g].length}`:""}</div>`;
      arr.forEach(x=>{const o=fn(x);const i=flat.length;flat.push(o);html+=`<div class="it" data-i="${i}"><div class="ico ${o.c||""}">${I(o.ico)}</div><div class="tx"><div>${o.a}</div><div>${o.b}</div></div></div>`});
    }
    if(!q&&!html)html=emptyState("search",t("search_hint"),t("search_hint2"));
    else if(!flat.length)html=emptyState("search",`${t("search_none")} « ${esc(q)} »`,t("search_none_hint"));
    const box=m.querySelector("#sres");box.innerHTML=html;act=Math.min(act,Math.max(flat.length-1,0));
    box.querySelectorAll(".it").forEach(el=>{el.onmousemove=()=>{act=+el.dataset.i;paint()};el.onclick=()=>pickIt(+el.dataset.i)});paint();
  }
  function paint(){m.querySelectorAll("#sres .it").forEach(el=>el.classList.toggle("act",+el.dataset.i===act));const a=m.querySelector("#sres .it.act");a&&a.scrollIntoView({block:"nearest"})}
  function pickIt(i){const o=flat[i];if(!o)return;closeModal();o.go()}
  inp.addEventListener("input",()=>{act=0;run()});
  inp.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown"){e.preventDefault();act=Math.min(act+1,flat.length-1);paint()}
    else if(e.key==="ArrowUp"){e.preventDefault();act=Math.max(act-1,0);paint()}
    else if(e.key==="Enter"){e.preventDefault();pickIt(act)}
    else if(e.key==="Tab"){e.preventDefault();const i=cats.findIndex(c=>c[0]===cat);cat=cats[(i+(e.shiftKey?cats.length-1:1))%cats.length][0];act=0;run()}
  });
  run();
}

function searchActions(){
  const A=(a,ico,run,b="",k="",c="")=>({a,ico,go:run,b,k,c});
  return[
    A(t("new_patient"),"userplus",()=>openPatientForm(),"","Alt N"),
    A(t("add_walkin"),"clock",()=>pickPatient(p=>{go("today");setTimeout(()=>addWalkIn(p),60)}),t("waiting_room")),
    A(t("new_rdv"),"agenda",()=>openRdvForm(null,{date:todayISO()}),"","","rose"),
    A(t("new_visit"),"stetho",()=>pickPatient(p=>openVisit(p.id))),
    A(t("q_screen"),"tv",()=>openWaitingScreen(),t("set_queue"),"","blue"),
    A(t("nav_journal"),"journal",()=>go("journal"),t("export_pdf"),"","amber"),
    A(t("nav_stats"),"stats",()=>go("stats")),
    A(t("set_export"),"download",()=>{go("settings");setTimeout(()=>openBackupExport(),80)},t("set_backup")),
    A(t("nav_settings"),"settings",()=>go("settings")),
  ].concat(encrypted()?[A(t("lock"),"lock",()=>lockNow(),t("set_security"))]:[]);
}
