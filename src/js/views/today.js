/* =========================================================
   TODAY
   ========================================================= */
function dayTotals(date,doctor){
  const vs=S.visits.filter(v=>v.date===date&&(!doctor||v.doctor===doctor));
  const pay=S.payments.filter(x=>x.date===date);
  let ca=0,recu=0,avec=0,sans=0;vs.forEach(v=>{ca+=num(v.honoraires);recu+=num(v.recu);if(v.bs==="sans")sans+=num(v.honoraires);else avec+=num(v.honoraires)});
  const payT=pay.reduce((s,x)=>s+num(x.amount),0);
  return{vs,pay,ca,recu,payT,recette:recu+payT,impayes:ca-recu,avec,sans}
}
function vToday(pg){
  const d=todayISO(),tot=dayTotals(d),h=new Date().getHours();
  const Q=todayQueue(d),rd=Q.all,waiting=Q.waiting;
  const next=nextPatient();
  const sm=soldeMap(),unpaid=S.patients.filter(p=>(sm[p.id]||0)>0.0005).sort((a,b)=>sm[b.id]-sm[a.id]).slice(0,5);
  const recentIds=[];[...S.visits].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).some(v=>{if(!recentIds.includes(v.patientId))recentIds.push(v.patientId);return recentIds.length>=5});
  const remaining=rd.filter(r=>r.status==="prevu"||r.status==="arrive"||r.status==="encours").length;
  let hero="";
  if(next){const p=next.patientId?P(next.patientId):null;const lv=p?visitsOf(p.id)[0]:null;const al=p?allergyList(p):[];
    hero=`<div class="next"><div class="avatar">${p?initials(p):esc((next.name||"?").replace(/^(Mme\.|Mr\.|Mlle\.)\s*/,"").split(" ").map(x=>x[0]).slice(0,2).join(""))}</div>
     <div style="min-width:0"><div class="lbl">${next.status==="encours"?t("st_encours"):next.status==="arrive"?t("next_waiting")+(waiting.length>1?` (1/${waiting.length})`:""):t("next_patient")} — ${next.status==="arrive"&&waitMins(next)!=null?t("q_waits").replace("{m}",durStr(waitMins(next))):next.time}</div><div class="nm">${esc(p?fullName(p):next.name)}</div>
      <div class="mt2">${p?`<span>${ageStr(p.dob)}</span><span>${t("dossier")} ${esc(p.dossier)}</span>`:`<span>${t("new_patient")}</span>`}${next.motif?`<span>${esc(next.motif)}</span>`:""}${lv?`<span>${t("col_last")} : ${fmtD(lv.date)}${lv.diagnostic?" ("+esc(lv.diagnostic)+")":""}</span>`:""}${al.map(a=>`<span class="tag al">⚠ ${esc(a)}</span>`).join("")}${p&&p.cnam.apci?`<span class="tag">${esc(p.cnam.apci)}</span>`:""}</div></div>
     <div class="row">${p?`<button class="btn ghost" data-go="patient/${p.id}">${I("user")}${t("open_file")}</button>`:""}<button class="btn pri lg" data-q="consult" data-id="${next.id}">${I("stetho")}${t("start_consult")}</button></div></div>`}
  pg.innerHTML=`
  <div class="ph"><div><h1>${h<18?t("good_morning"):t("good_evening")}, ${esc(S.settings.doctor.name)}</h1><div class="sub">${longDate(d)}. ${remaining?`${remaining} ${t("rdv_remaining")}`:t("today_sub")}</div></div>
   <div class="actions"><button class="btn" data-act="newRdv">${I("agenda")}${t("new_rdv")}</button><button class="btn pri" data-act="quickVisit">${I("stetho")}${t("new_visit")}</button></div></div>
  ${!encrypted()&&!UI.secHint?`<div class="alert green" style="margin-bottom:16px;align-items:center">${I("shield")}<div style="flex:1">${t("sec_banner")}</div><button class="btn sm pri" data-act="secOn">${t("sec_enable")}</button><button class="btn sm ghost" data-act="secHide" aria-label="${t("close")}">${I("x")}</button></div>`:""}
  ${hero}
  <div class="grid g4">
    ${kpi(t("k_consult"),tot.vs.length,"",false,"stetho")}
    ${kpi(t("k_recette"),money(tot.recette),t("tnd"),false,"cash")}
    ${kpi(t("k_waiting"),waiting.length,"",false,"clock")}
    ${kpi(t("k_impayes"),money(tot.impayes),t("tnd"),tot.impayes>0,"wallet")}
  </div>
  <div class="split mt">
   ${waitingRoomCard()}
   <div class="grid" style="align-content:start">
    <div class="card"><div class="hd"><h3><span class="hi">${I("zap")}</span>${t("quick")}</h3></div><div class="qa">
      <button data-act="newPatient"><span class="ico">${I("userplus")}</span>${t("new_patient")}<small>Alt + N</small></button>
      <button data-act="search"><span class="ico blue">${I("search")}</span>${t("sc_search")}<small>Ctrl + K</small></button>
      <button data-go="journal"><span class="ico amber">${I("journal")}</span>${t("nav_journal")}<small>${t("export_pdf")}</small></button>
      <button data-act="newRdv"><span class="ico rose">${I("agenda")}</span>${t("new_rdv")}<small>${t("nav_agenda")}</small></button>
    </div></div>
    <div class="card"><div class="hd"><h3><span class="hi">${I("patients")}</span>${t("recent")}</h3></div><div>${recentIds.map(id=>{const p=P(id);return p?`<div class="q-item" style="cursor:pointer" data-go="patient/${p.id}"><div class="avatar ${p.sexe==="F"?"f":""}">${initials(p)}</div><div class="tx"><b>${esc(shortName(p))}</b><small>${ageStr(p.dob)}, ${t("dossier").toLowerCase()} ${esc(p.dossier)}</small></div>${I("right").replace("<svg","<svg style='width:16px;color:var(--faint)'")}</div>`:""}).join("")}</div></div>
    <div class="card"><div class="hd"><h3><span class="hi" style="background:var(--danger-soft);color:var(--danger)">${I("wallet")}</span>${t("unpaid_list")}</h3></div><div>${unpaid.length?unpaid.map(p=>`<div class="q-item" style="cursor:pointer" data-go="patient/${p.id}"><div class="tx"><b>${esc(shortName(p))}</b><small>${t("dossier")} ${esc(p.dossier)}</small></div><span class="red b num">${money(sm[p.id])} ${t("tnd")}</span></div>`).join(""):emptyState("check",t("all_paid"),"")}</div></div>
   </div>
  </div>`;
  ACT.newRdv=()=>openRdvForm(null,{date:d});
  ACT.secOn=()=>openEnableEncryption();ACT.secHide=()=>{UI.secHint=true;savePrefs();render()};
  ACT.quickVisit=()=>pickPatient(p=>openVisit(p.id));
  ACT.walkIn=()=>pickPatient(p=>addWalkIn(p));
  ACT.qDone=()=>{UI.showDone=!UI.showDone;render()};
  ACT.openScreen=()=>openWaitingScreen();
  bindWaitingRoom(pg);
  $$(".next [data-q=consult]",pg).forEach(b=>b.onclick=e=>{e.stopPropagation();startFromRdv(S.rdv.find(x=>x.id===b.dataset.id))});
}
function kpi(l,v,unit,neg,icon){return`<div class="card kpi ${neg?"neg":""} ${icon?"":"plain"}">${icon?`<div class="ki">${I(icon)}</div>`:""}<div><div class="l">${l}</div><div class="v num">${v}${unit?`<small>${unit}</small>`:""}</div></div></div>`}
function stPill(s){const c={prevu:"blue",arrive:"amber",encours:"pri",termine:"green",absent:"red"}[s];return`<span class="pill ${c}"><span class="dot"></span>${t("st_"+s)}</span>`}
function startFromRdv(r){
  if(r.status!=="encours")r.startedAt=Date.now();
  if(r.patientId){r.status="encours";save();openVisit(r.patientId,{rdvId:r.id});return}
  const pre=parseRdvName(r.name);pre.tel=(r.phone||"").replace(/\s/g,"");
  openPatientForm(null,{prefill:pre,onSaved:p=>{r.patientId=p.id;r.status="encours";r.startedAt=Date.now();save();openVisit(p.id,{rdvId:r.id})}});
}
function pickPatient(cb){
  const m=openModal(mh(t("search_patient"))+`<div class="mb"><div><input class="in" id="pp" placeholder="${t("search_in_list")}"></div><div class="mt row"><span class="muted">${t("new_patient")} ?</span><button class="btn sm" id="ppn">${I("userplus")}${t("new_patient")}</button></div></div>`,{cls:"sm"});
  attachAC(m.querySelector("#pp"),{source:patientSource,render:patientRender,onPick:it=>{closeModal();cb(it.p)}});
  m.querySelector("#ppn").onclick=()=>{closeModal();openPatientForm(null,{onSaved:cb})};
}

/* "Mme. Haddad Sirine" -> {titre:"Mme.",sexe:"F",nom:"Haddad",prenom:"Sirine"} */
function parseRdvName(raw){
  let name=String(raw||"").trim(),titre="",sexe="";
  const m=name.match(/^(mme|mlle|mr|m|madame|mademoiselle|monsieur|enf)\.?\s+/i);
  if(m){const k=m[1].toLowerCase();titre={mme:"Mme.",madame:"Mme.",mlle:"Mlle.",mademoiselle:"Mlle.",mr:"Mr.",m:"Mr.",monsieur:"Mr.",enf:"Enf."}[k];sexe=titre==="Mr."?"M":titre==="Enf."?"":"F";name=name.slice(m[0].length)}
  const parts=name.split(/\s+/).filter(Boolean);
  const out={nom:parts.length>1?parts.slice(0,-1).join(" "):(parts[0]||""),prenom:parts.length>1?parts[parts.length-1]:""};
  if(titre)out.titre=titre;if(sexe)out.sexe=sexe;
  return out;
}
