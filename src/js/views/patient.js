/* =========================================================
   PATIENT FILE
   ========================================================= */
function vPatient(pg){
  const p=P(UI.route[1]);if(!p){go("patients");return}
  const tab=UI.route[2]||"overview";
  const vs=visitsOf(p.id),s=solde(p.id),al=allergyList(p);
  const lastV=vs[0],lastVit=vs.find(v=>v.vitals&&(v.vitals.poids||v.vitals.ta_s));
  const lastRx=vs.find(v=>v.rx&&v.rx.length);
  const tabs=[["overview","tab_overview","today"],["visits","tab_visits","history"],["vitals","tab_vitals","heart"],["docs","tab_docs","meds"],["ant","tab_ant","journal"],["info","tab_info","user"]];
  const cn=p.cnam||{};
  pg.innerHTML=`
  <div class="crumb"><button data-go="patients">${t("nav_patients")}</button>${I("right")}<span>${esc(shortName(p))}</span></div>
  <div class="card">
   <div class="phead">
    <div class="avatar lg">${initials(p)}</div>
    <div style="min-width:0;flex:1">
      <h1>${esc(fullName(p))}</h1>
      <div class="meta"><span>${I("file")}${t("dossier")} <b style="color:var(--ink)">${esc(p.dossier)}</b></span>${p.dob?`<span>${I("cake")}${ageStr(p.dob)} (${fmtD(p.dob)})</span>`:""}<span>${I("user")}${p.sexe==="F"?t("female"):t("male")}</span>${p.tel?`<span>${I("phone")}${esc(p.tel)}</span>`:""}${cn.caisse?`<span>${I("shield")}${esc(cn.caisse)}, ${t("r_"+(cn.regime||"none")).toLowerCase()}</span>`:""}${p.groupe?`<span>${I("drop")}${esc(p.groupe)}</span>`:""}</div>
      <div class="row wrap" style="margin-top:8px">${al.map(a=>`<span class="pill red">⚠ ${esc(a)}</span>`).join("")}${cn.apci?`<span class="pill amber">${I("heart")}APCI : ${esc(cn.apci)}</span>`:""}<span class="pill ${s>0.0005?"red":"green"}">${s>0.0005?t("solde_due")+" "+money(s)+" "+t("tnd"):t("solde_ok")}</span></div>
    </div>
    <div class="pacts">
      <button class="btn pri" data-act="pvisit">${I("stetho")}${t("new_visit")}</button>
      <button class="btn" data-act="prdv">${I("agenda")}${t("new_rdv")}</button>
      ${s>0.0005?`<button class="btn" data-act="pay">${I("cash")}${t("encaisser")} ${money(s)}</button>`:""}
      <button class="btn ghost right" data-act="pfiche">${I("pdf")}${t("doc_fiche")}</button>
      <button class="btn ghost" data-act="pedit">${I("edit")}${t("edit")}</button>
      <button class="btn ghost danger" data-act="pdelete" title="${t("del_patient")}">${I("trash")}${t("delete")}</button>
    </div>
   </div>
   <div class="tabs">${tabs.map(x=>`<button class="tab ${tab===x[0]?"on":""}" data-go="patient/${p.id}/${x[0]}">${I(x[2])}${t(x[1])}${x[0]==="visits"?` <span class="cnt">${vs.length}</span>`:""}</button>`).join("")}</div>
   <div class="bd" id="ptab"></div>
  </div>`;
  ACT.pvisit=()=>openVisit(p.id);
  ACT.pedit=()=>openPatientForm(p.id);
  ACT.pdelete=()=>deletePatient(p.id);
  ACT.prdv=()=>openRdvForm(null,{patientId:p.id});
  ACT.pfiche=()=>pdfFiche(p);
  ACT.pay=()=>openPayment(p);
  const box=$("#ptab");
  if(tab==="overview"){
    box.innerHTML=`<div class="split">
     <div><h3 class="kvh">${I("history")}${t("tab_visits")}</h3>${vs.length?`<div class="tl">${vs.slice(0,6).map(v=>visitEv(v)).join("")}</div>${vs.length>6?`<button class="btn sm soft" data-go="patient/${p.id}/visits">${t("tab_visits")} (${vs.length}) ${I("right")}</button>`:""}`:emptyState("stetho",t("no_visits_yet"),t("no_visits_hint"),`<button class="btn pri" data-act="pvisit">${I("stetho")}${t("new_visit")}</button>`)}</div>
     <div class="grid" style="align-content:start">
      <div class="card"><div class="hd"><h3><span class="hi">${I("heart")}</span>${t("last_vitals")}</h3><span class="muted right">${lastVit?fmtD(lastVit.date):""}</span></div><div class="bd">${lastVit?vitalsGrid(lastVit.vitals):`<span class="muted">${t("no_data")}</span>`}</div></div>
      <div class="card"><div class="hd"><h3><span class="hi">${I("meds")}</span>${t("last_rx")}</h3>${lastRx?`<div class="r"><button class="btn xs soft" data-act="renew" title="${t("renew_last")}">${I("repeat")}${t("renew")}</button><button class="btn xs" data-act="lrxpdf">${I("pdf")}</button></div>`:""}</div><div class="bd">${lastRx?`<div class="muted" style="font-size:12px;margin-bottom:6px">${fmtD(lastRx.date)} · ${esc(lastRx.diagnostic||"")}</div>`+lastRx.rx.map((r,i)=>`<div style="padding:4px 0"><b>${i+1}. ${esc(r.nom)}</b><div class="muted" style="font-size:12.5px">${esc(r.posologie)} · ${esc(r.duree||"")} · ${r.qte||1} bt</div></div>`).join(""):`<span class="muted">${t("no_data")}</span>`}</div></div>
      <div class="card"><div class="hd"><h3><span class="hi">${I("journal")}</span>${t("tab_ant")}</h3><div class="r"><button class="btn xs" data-go="patient/${p.id}/ant">${I("edit")}</button></div></div><div class="bd"><dl class="kv">${[["ant_med","med"],["ant_chir","chir"],["ant_gyn","gyn"],["ant_fam","fam"],["ant_hab","hab"],["ant_trait","trait"]].filter(x=>(p.ant||{})[x[1]]).map(x=>`<dt>${t(x[0])}</dt><dd>${esc(p.ant[x[1]])}</dd>`).join("")||`<dd class="muted">${t("no_data")}</dd>`}</dl></div></div>
     </div></div>`;
    ACT.renew=()=>openVisit(p.id,{rx:lastRx.rx});
    ACT.lrxpdf=()=>pdfRx(p,lastRx);
  }
  else if(tab==="visits"){
    box.innerHTML=`<div class="tablewrap" style="margin:-16px"><table class="t"><thead><tr><th>${t("date")}</th><th>${t("col_motif")}</th><th>${t("col_diag")}</th><th>${t("prescription")}</th><th class="num">${t("col_hon")}</th><th class="num">${t("col_recu")}</th><th></th></tr></thead><tbody>${vs.map(v=>`<tr class="click" data-v="${v.id}"><td class="num b">${fmtD(v.date)}</td><td>${esc(v.motif)}</td><td>${esc(v.diagnostic)}</td><td class="muted">${(v.rx||[]).length?(v.rx.length+" "+t("search_meds").toLowerCase()):"—"}</td><td class="num">${money(v.honoraires)}</td><td class="num">${money(v.recu)}</td><td>${bsPill(v.bs)}</td></tr>`).join("")||`<tr><td colspan="7" class="empty">${t("no_data")}</td></tr>`}</tbody></table></div>`;
    $$("#ptab tr[data-v]").forEach(tr=>tr.onclick=()=>openVisitView(tr.dataset.v));
  }
  else if(tab==="vitals"){
    const vv=[...vs].reverse().filter(v=>v.vitals);
    const ser=k=>vv.filter(v=>num(v.vitals[k])>0).map(v=>({x:v.date,y:num(v.vitals[k])}));
    const imc=vv.filter(v=>num(v.vitals.poids)&&num(v.vitals.taille)).map(v=>({x:v.date,y:+(num(v.vitals.poids)/Math.pow(num(v.vitals.taille)/100,2)).toFixed(1)}));
    box.innerHTML=`<div class="grid g2">
      <div class="card"><div class="hd"><h3>${t("v_poids")} (kg)</h3></div><div class="bd chart">${lineChart([{pts:ser("poids"),name:t("v_poids")}],{dec:1})}</div></div>
      <div class="card"><div class="hd"><h3>${t("v_ta")} (mmHg)</h3><div class="r legend"><span><i style="background:var(--s1)"></i>${t("v_ta_s")}</span><span><i style="background:var(--s2)"></i>${t("v_ta_d")}</span></div></div><div class="bd chart">${lineChart([{pts:ser("ta_s"),name:t("v_ta_s")},{pts:ser("ta_d"),name:t("v_ta_d")}])}</div></div>
      <div class="card"><div class="hd"><h3>${t("v_gly")} (g/L)</h3></div><div class="bd chart">${lineChart([{pts:ser("gly"),name:t("v_gly")}],{dec:2})}</div></div>
      <div class="card"><div class="hd"><h3>${t("v_imc")}</h3></div><div class="bd chart">${lineChart([{pts:imc,name:t("v_imc")}],{dec:1})}</div></div>
    </div>
    <div class="card mt"><div class="tablewrap"><table class="t"><thead><tr><th>${t("date")}</th><th class="num">${t("v_poids")}</th><th class="num">${t("v_taille")}</th><th class="num">${t("v_imc")}</th><th class="num">${t("v_ta")}</th><th class="num">${t("v_fc")}</th><th class="num">${t("v_temp")}</th><th class="num">${t("v_gly")}</th><th class="num">${t("v_spo2")}</th></tr></thead><tbody>${[...vv].reverse().map(v=>{const x=v.vitals;return`<tr><td class="num b">${fmtD(v.date)}</td><td class="num">${x.poids||""}</td><td class="num">${x.taille||""}</td><td class="num">${imcOf(x)}</td><td class="num">${taStr(x)}</td><td class="num">${x.fc||""}</td><td class="num">${x.temp||""}</td><td class="num">${x.gly||""}</td><td class="num">${x.spo2?x.spo2+"%":""}</td></tr>`}).join("")}</tbody></table></div></div>`;
    mountViz(box);
  }
  else if(tab==="docs"){
    const withRx=vs.filter(v=>(v.rx||[]).length||(v.analyses||[]).length||(v.imagerie||[]).length);
    box.innerHTML=withRx.length?`<div class="grid g2">${withRx.map(v=>`<div class="card"><div class="hd"><h3>${fmtD(v.date)}</h3><span class="muted">${esc(v.diagnostic||"")}</span><div class="r">${(v.rx||[]).length?`<button class="btn xs" data-rx="${v.id}">${I("pdf")}${t("doc_rx")}</button>`:""}${(v.analyses||[]).length?`<button class="btn xs" data-an="${v.id}">${I("flask")}</button>`:""}${(v.imagerie||[]).length?`<button class="btn xs" data-im="${v.id}">${I("scan")}</button>`:""}</div></div><div class="bd">${(v.rx||[]).map((r,i)=>`<div style="padding:3px 0"><b>${i+1}. ${esc(r.nom)}</b> <span class="muted">— ${esc(r.posologie)}${r.duree?" · "+esc(r.duree):""}</span></div>`).join("")}${(v.analyses||[]).length?`<div class="muted" style="margin-top:6px">${t("analyses")} : ${esc(v.analyses.join(", "))}</div>`:""}${(v.imagerie||[]).length?`<div class="muted">${t("imagerie")} : ${esc(v.imagerie.join(", "))}</div>`:""}</div></div>`).join("")}</div>`:emptyState("rx",t("no_rx_yet"),"");
    $$("[data-rx]",box).forEach(b=>b.onclick=()=>pdfRx(p,S.visits.find(v=>v.id===b.dataset.rx)));
    $$("[data-an]",box).forEach(b=>b.onclick=()=>pdfExams(p,S.visits.find(v=>v.id===b.dataset.an),"analyses"));
    $$("[data-im]",box).forEach(b=>b.onclick=()=>pdfExams(p,S.visits.find(v=>v.id===b.dataset.im),"imagerie"));
  }
  else if(tab==="ant"){
    const a=p.ant||{};
    box.innerHTML=`<div class="form">${[["ant_med","med"],["ant_chir","chir"],["ant_gyn","gyn"],["ant_fam","fam"],["ant_hab","hab"],["ant_trait","trait"]].map(x=>`<label class="field c6"><span>${t(x[0])}</span><textarea class="in" data-ant="${x[1]}">${esc(a[x[1]]||"")}</textarea></label>`).join("")}
      <label class="field c6"><span>${t("f_allergies")}</span><input class="in" id="aall" value="${esc(al.join(", "))}" placeholder="${t("f_allergies_ph")}"></label>
      <label class="field c6"><span>${t("f_apci")}</span><input class="in" id="aapci" value="${esc(cn.apci||"")}"></label>
      <div class="c12 row"><button class="btn pri right" id="asave">${I("check")}${t("save")}</button></div></div>`;
    $("#asave").onclick=()=>{p.ant=p.ant||{};$$("[data-ant]",box).forEach(x=>p.ant[x.dataset.ant]=x.value.trim());p.allergies=$("#aall").value.split(",").map(x=>x.trim()).filter(Boolean);p.cnam.apci=$("#aapci").value.trim();save();toast(t("saved"));render()};
  }
  else if(tab==="info"){
    const row=(k,v)=>v?`<dt>${t(k)}</dt><dd>${esc(v)}</dd>`:"";
    box.innerHTML=`<div class="grid g3">
      <div><h4 class="kvh">${I("user")}${t("p_identity")}</h4><dl class="kv">${row("f_titre",p.titre)}${row("f_nom",p.nom)}${row("f_prenom",p.prenom)}${row("f_nomjf",p.nomJF)}${row("f_dob",fmtD(p.dob))}${row("f_etat",p.etat?t("et_"+p.etat):"")}${row("f_enfants",p.enfants?String(p.enfants):"")}${row("f_cin",p.cin)}${row("f_groupe",p.groupe)}</dl></div>
      <div><h4 class="kvh">${I("phone")}${t("p_contact")}</h4><dl class="kv">${row("f_adresse",p.adresse)}${row("f_ville",p.ville)}${row("f_tel",p.tel)}${row("f_tel2",p.tel2)}${row("f_profession",p.profession)}${row("f_adrpar",p.adrPar)}${row("since",fmtD(p.createdAt))}</dl></div>
      <div><h4 class="kvh">${I("shield")}${t("p_cnam")}</h4><dl class="kv">${row("f_caisse",cn.caisse)}${row("f_regime",cn.regime?t("r_"+cn.regime):"")}${row("f_qualite",cn.qualite?t("q_"+cn.qualite):"")}${row("f_idu",cn.idu)}${row("f_rang",cn.rang?String(cn.rang):"")}${row("f_apci",cn.apci)}</dl></div>
    </div>${p.remarques?`<div class="alert amber mt">${esc(p.remarques)}</div>`:""}
    <div class="row mt"><button class="btn danger right" id="pdel">${I("trash")}${t("delete")}</button></div>`;
    $("#pdel").onclick=()=>deletePatient(p.id);
  }
}
const imcOf=x=>num(x.poids)&&num(x.taille)?(num(x.poids)/Math.pow(num(x.taille)/100,2)).toFixed(1):"";
const VIT=[["poids","v_poids","kg","scale"],["taille","v_taille","cm","ruler"],["imc","v_imc","","bmi"],["ta","v_ta","mmHg","heart"],["fc","v_fc","bpm","pulse"],["temp","v_temp","°C","thermo"],["gly","v_gly","g/L","drop"],["spo2","v_spo2","%","lungs"]];
function vitalWarn(k,x){const n=num;if(k==="ta")return n(x.ta_s)>=140||n(x.ta_d)>=90;if(k==="temp")return n(x.temp)>=38;if(k==="gly")return n(x.gly)>=1.26;if(k==="spo2")return x.spo2&&n(x.spo2)<94;if(k==="imc")return n(imcOf(x))>=30;if(k==="fc")return x.fc&&(n(x.fc)>100||n(x.fc)<50);return false}
function vitalsGrid(x){const val=k=>k==="imc"?imcOf(x):k==="ta"?taStr(x):x[k];
  return`<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:14px 12px">${VIT.map(([k,l,u,ic])=>{const v=val(k),w=v&&vitalWarn(k,x);return`<div><div class="muted row" style="font-size:12px;gap:5px">${I(ic).replace("<svg",`<svg style="width:13px;height:13px;color:${w?"var(--warn)":"var(--pri)"}"`)}${t(l)}</div><div class="b num" style="font-size:17px;${w?"color:var(--warn)":""}">${v||"—"}<small class="muted" style="font-size:11px;font-weight:500"> ${v?u:""}</small></div></div>`}).join("")}</div>`}
function visitEv(v){return`<div class="ev"><div class="d">${fmtD(v.date)} · ${v.time||""}</div><div class="x" onclick="openVisitView('${v.id}')"><div class="row"><b>${esc(v.diagnostic||"—")}</b><span class="right">${bsPill(v.bs)}</span></div><div class="muted" style="font-size:13px">${esc(v.motif||"")}</div>${(v.rx||[]).length?`<div style="font-size:12.5px;margin-top:4px">${I("meds").replace("<svg","<svg style='width:12px;vertical-align:-1px'")} ${esc(v.rx.map(r=>r.nom).join(", "))}</div>`:""}</div></div>`}

/* Delete a patient with everything linked to them. The doctor sees what will be removed,
   and can undo for a few seconds afterwards. */
function deletePatient(id){
  const p=P(id);if(!p)return;
  const vs=S.visits.filter(v=>v.patientId===id),rs=S.rdv.filter(r=>r.patientId===id),ps=S.payments.filter(x=>x.patientId===id);
  openModal(mh(t("del_patient_q").replace("{p}",esc(fullName(p))),"","trash")+`<div class="mb">
    <div class="row" style="margin-bottom:14px"><div class="avatar ${p.sexe==="F"?"f":""}">${initials(p)}</div><div><b>${esc(fullName(p))}</b><div class="muted" style="font-size:12.5px">${t("dossier")} ${esc(p.dossier)}${p.dob?", "+ageStr(p.dob):""}</div></div></div>
    <div class="alert">${I("alert")}<div>${t("del_patient_text").replace("{v}",vs.length).replace("{r}",rs.length).replace("{pay}",ps.length)}</div></div>
    <p class="muted" style="margin:12px 0 0;font-size:12.5px">${t("del_patient_tip")}</p></div>
    <div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="dpok" style="background:var(--danger);border-color:var(--danger);color:#fff">${I("trash")}${t("del_patient")}</button></div>`,{cls:"sm",onMount:m=>{
    const hi=m.querySelector(".mh .hi");if(hi){hi.style.background="var(--danger-soft)";hi.style.color="var(--danger)"}
    m.querySelector("#dpok").onclick=()=>{
      const pi=S.patients.indexOf(p),draft=S.draft&&S.draft.pid===id?S.draft:null;
      S.patients.splice(pi,1);S.visits=S.visits.filter(v=>v.patientId!==id);S.rdv=S.rdv.filter(r=>r.patientId!==id);S.payments=S.payments.filter(x=>x.patientId!==id);
      if(draft)delete S.draft;
      save();closeModal();
      if(UI.route[0]==="patient")go("patients");else render();
      toastUndo(t("del_patient_done").replace("{p}",shortName(p)),()=>{
        S.patients.splice(Math.min(pi,S.patients.length),0,p);S.visits.push(...vs);S.rdv.push(...rs);S.payments.push(...ps);if(draft)S.draft=draft;
        save();toast(t("del_patient_restored"));render();
      },10000);
    };
  }});
}
