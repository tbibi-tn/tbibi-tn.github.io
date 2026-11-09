/* =========================================================
   VISIT VIEW (read-only modal)
   ========================================================= */
function openVisitView(vid){
  const v=S.visits.find(x=>x.id===vid);if(!v)return;const p=P(v.patientId);
  const reste=num(v.honoraires)-num(v.recu);
  openModal(mh(t("visit_of")+" "+fmtD(v.date),`<span class="pill">${esc(v.time||"")}</span>`,"stetho")+`<div class="mb">
    <div class="row" style="margin-bottom:14px;cursor:pointer" id="vvp"><div class="avatar">${initials(p)}</div><div><b>${esc(fullName(p))}</b><div class="muted" style="font-size:12.5px">${t("dossier")} ${esc(p.dossier)} · ${ageStr(p.dob)}</div></div><span class="btn xs right">${t("open_file")} ${I("right")}</span></div>
    <dl class="kv">${v.motif?`<dt>${t("motif")}</dt><dd>${esc(v.motif)}</dd>`:""}${v.diagnostic?`<dt>${t("diagnostic")}</dt><dd><b>${esc(v.diagnostic)}</b></dd>`:""}${v.observations?`<dt>${t("observations")}</dt><dd>${esc(v.observations)}</dd>`:""}</dl>
    ${v.vitals&&Object.values(v.vitals).some(Boolean)?`<div class="card mt"><div class="bd">${vitalsGrid(v.vitals)}</div></div>`:""}
    ${(v.rx||[]).length?`<div class="mt"><b>${t("prescription")}</b>${v.rx.map((r,i)=>`<div style="padding:4px 0">${i+1}. <b>${esc(r.nom)}</b> <span class="muted">— ${esc(r.posologie)}${r.duree?" · "+esc(r.duree):""} · ${r.qte||1} bt</span></div>`).join("")}</div>`:""}
    ${(v.analyses||[]).length?`<div class="mt"><b>${t("analyses")}</b> <span class="muted">${esc(v.analyses.join(", "))}</span></div>`:""}
    ${(v.imagerie||[]).length?`<div class="mt"><b>${t("imagerie")}</b> <span class="muted">${esc(v.imagerie.join(", "))}</span></div>`:""}
    <div class="row wrap mt" style="gap:16px;padding-top:12px;border-top:1px solid var(--line)"><span>${t("code")} <b>${esc(v.code)}</b></span><span>${t("honoraires")} <b class="num">${money(v.honoraires)}</b></span><span>${t("recu")} <b class="num">${money(v.recu)}</b></span><span>${t("reste")} <b class="num ${reste>0?"red":""}">${money(reste)}</b></span>${bsPill(v.bs)}<span class="muted">${esc(v.doctor||"")}</span></div>
  </div><div class="mf"><button class="btn danger" id="vvd" style="margin-right:auto">${I("trash")}</button>${(v.rx||[]).length?`<button class="btn" id="vvrx">${I("pdf")}${t("doc_rx")}</button>`:""}<button class="btn" id="vvnote">${I("pdf")}${t("doc_note")}</button><button class="btn pri" id="vve">${I("edit")}${t("edit")}</button></div>`,{onMount:m=>{
    m.querySelector("#vvp").onclick=()=>{closeModal();go("patient/"+p.id)};
    m.querySelector("#vve").onclick=()=>{closeModal();openVisit(p.id,{visitId:v.id})};
    m.querySelector("#vvrx")&&(m.querySelector("#vvrx").onclick=()=>pdfRx(p,v));
    m.querySelector("#vvnote").onclick=()=>pdfNote(p,v);
    m.querySelector("#vvd").onclick=()=>confirmBox(t("confirm_delete"),()=>{S.visits=S.visits.filter(x=>x.id!==v.id);save();closeModal();toast(t("deleted"));render()});
  }});
}

/* =========================================================
   VISIT EDITOR (full screen)
   ========================================================= */
const ALLERGY_MAP={penicilline:["penicilline","amoxicilline","augmentin","clamoxyl","amoxil"],aspirine:["aspirine","acetylsalicylique","aspegic"],ains:["ains","ibuprofene","diclofenac","ketoprofene","acetylsalicylique"],sulfamides:["sulfamide","sulfamethoxazole","bactrim"],iode:["iode","povidone","betadine"],cephalosporines:["cephalosporine","cefixime","ceftriaxone"],macrolides:["macrolide","azithromycine","clarithromycine","erythromycine"]};
function allergyHit(p,m){const h=norm(m.nom+" "+(m.dci||"")+" "+(m.classe||""));for(const a of allergyList(p)){const k=norm(a).replace(/s$/,"");const keys=ALLERGY_MAP[k]||ALLERGY_MAP[k+"s"]||[k];if(keys.some(x=>h.includes(x)))return a}return null}
const VE={open:false};
function openVisit(pid,{visitId,rdvId,rx,draft}={}){
  const p=P(pid);if(!p)return;
  if(draft){visitId=draft.visitId;rdvId=draft.rdvId}
  const ex=visitId?S.visits.find(v=>v.id===visitId):null;
  const tarif0=S.settings.tarifs[0]||{code:"C1",price:0};
  const d=ex?JSON.parse(JSON.stringify(ex)):{id:null,patientId:pid,date:todayISO(),time:nowHM(),doctor:S.settings.doctors[0]||S.settings.doctor.name,motif:"",diagnostic:"",observations:"",vitals:{},rx:rx?JSON.parse(JSON.stringify(rx)):[],analyses:[],imagerie:[],code:tarif0.code,honoraires:tarif0.price,recu:tarif0.price,bs:p.cnam.regime&&p.cnam.regime!=="none"?"avec":"sans"};
  if(draft)Object.assign(d,JSON.parse(JSON.stringify(draft.d)));
  d.vitals=d.vitals||{};
  const initial=draft?"":JSON.stringify(d);
  const dirty=()=>JSON.stringify(d)!==initial;
  let lastDraft="";
  const keepDraft=()=>{const j=JSON.stringify(d);if(!dirty()||j===lastDraft)return;lastDraft=j;S.draft={pid,visitId:ex?ex.id:null,rdvId:rdvId||null,d:JSON.parse(j),at:Date.now()};save()};
  const dropDraft=()=>{if(S.draft&&S.draft.pid===pid){delete S.draft;save()}};
  const draftTimer=setInterval(keepDraft,2500);
  const prevSolde=solde(pid)-(ex?num(ex.honoraires)-num(ex.recu):0);
  Object.assign(VE,{open:true,d,p,rdvId,ex});
  let el=$(".ve");if(el)el.remove();
  el=document.createElement("div");el.className="ve";document.body.appendChild(el);
  document.body.style.overflow="hidden";
  const teardown=()=>{clearInterval(draftTimer);el.remove();VE.open=false;VE.docDone=false;document.body.style.overflow=""};
  /* force=true: close without asking (used by lock); otherwise ask when there are unsaved changes */
  VE.close=force=>{
    if(force){keepDraft();teardown();return}
    if(!dirty()){dropDraft();teardown();return}
    openModal(mh(t("draft_q_title"),"","alert")+`<div class="mb"><p style="margin:0">${t("draft_q_text")}</p></div><div class="mf"><button class="btn danger" id="dq-drop" style="margin-right:auto">${I("trash")}${t("draft_discard")}</button><button class="btn" id="dq-keep">${t("draft_keep")}</button><button class="btn pri" id="dq-back">${I("stetho")}${t("draft_continue")}</button></div>`,{cls:"sm",onMount:m=>{
      m.querySelector("#dq-back").onclick=closeModal;
      m.querySelector("#dq-keep").onclick=()=>{closeModal();keepDraft();teardown();toast(t("draft_kept"));render()};
      m.querySelector("#dq-drop").onclick=()=>{closeModal();dropDraft();teardown();render()};
    }});
  };
  VE.save=()=>saveVisit();
  VE.rerender=()=>draw();
  const vs=visitsOf(pid).filter(v=>!ex||v.id!==ex.id);
  const freq={};S.visits.forEach(v=>{if(v.diagnostic)freq[v.diagnostic]=(freq[v.diagnostic]||0)+1});
  const topDx=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>x[0]);
  const ownDx=[...new Set(vs.map(v=>v.diagnostic).filter(Boolean))].slice(0,5);
  function draw(){
    const al=allergyList(p);
    el.innerHTML=`
    <aside class="ve-side">
      <div class="row" style="margin-bottom:14px"><div class="avatar lg ${p.sexe==="F"?"f":""}">${initials(p)}</div><div style="min-width:0"><b style="font-size:16px">${esc(shortName(p))}</b><div class="muted" style="font-size:12.5px">${t("dossier")} ${esc(p.dossier)}<br>${ageStr(p.dob)} · ${p.sexe==="F"?t("female"):t("male")}${p.cnam.caisse?" · "+esc(p.cnam.caisse):""}</div></div></div>
      ${al.length?`<div class="alert" style="margin-bottom:10px">${I("alert")}<div>${t("allergy_alert")} : ${esc(al.join(", "))}</div></div>`:""}
      ${p.cnam.apci?`<div class="alert amber" style="margin-bottom:10px">${I("heart")}<div>${esc(p.cnam.apci)}</div></div>`:""}
      <div class="side-sec"><h4>${I("journal")}${t("tab_ant")}</h4><div style="font-size:13px">${[["ant_med","med"],["ant_chir","chir"],["ant_fam","fam"],["ant_hab","hab"],["ant_trait","trait"]].filter(x=>(p.ant||{})[x[1]]).map(x=>`<div style="margin-bottom:4px"><span class="muted">${t(x[0])} :</span> ${esc(p.ant[x[1]])}</div>`).join("")||`<span class="muted">${t("no_data")}</span>`}</div></div>
      <div class="side-sec"><h4>${I("wallet")}${t("ancien_solde")}</h4><b class="${prevSolde>0.0005?"red":""} num">${money(prevSolde)} ${t("tnd")}</b></div>
      <div class="side-sec"><h4>${I("history")}${t("history_side")} (${vs.length})</h4>${vs.slice(0,8).map(v=>`<div class="mini-visit" data-mv="${v.id}"><div class="row"><b class="num">${fmtD(v.date)}</b><span class="muted right" style="font-size:12px">${(v.rx||[]).length?(v.rx.length+" ℞"):""}</span></div><div>${esc(v.diagnostic||"—")}</div>${v.vitals&&v.vitals.ta_s?`<div class="muted" style="font-size:12px">TA ${taStr(v.vitals)}${v.vitals.poids?" · "+v.vitals.poids+" kg":""}</div>`:""}</div>`).join("")||`<span class="muted">${t("no_data")}</span>`}</div>
    </aside>
    <div class="ve-main">
      <div class="ve-top"><div class="r1">
        <button class="btn sm ghost" id="vback">${I("left")}${t("back")}</button>
        <b style="font-size:15px">${ex?t("visit_of")+" "+fmtD(d.date):t("new_visit")} — ${esc(shortName(p))}</b>
        <input type="date" class="in right" id="vdate" value="${d.date}" style="width:150px;height:34px">
        </div>
        <nav class="steps">${[["vitals","vitals"],["consult","consultation"],["rx","prescription"],["exams","exams"],["docs","certificates"],["bill","billing"]].map(x=>`<a href="#" data-sec="${x[0]}" id="st-${x[0]}"><i></i>${t(x[1])}</a>`).join("")}</nav>
      </div>
      <div class="ve-body">
        <section class="card" id="sec-vitals"><div class="hd"><h3><span class="hi">${I("heart")}</span>${t("vitals")}</h3><span class="muted right" style="font-size:12px">${t("vitals_hint")}</span></div><div class="bd"><div class="vitals">
          ${vin("poids","v_poids","kg","scale")}${vin("taille","v_taille","cm","ruler")}<label class="field vital" id="vw-imc"><span>${I("bmi")}${t("v_imc")}</span><input class="in" id="imc" disabled value="${imcOf(d.vitals)}"></label>
          <label class="field vital" id="vw-ta"><span>${I("heart")}${t("v_ta")}</span><div class="row" style="gap:4px"><input class="in" data-vt="ta_s" value="${esc(d.vitals.ta_s||"")}" placeholder="130" inputmode="numeric" style="padding:0 4px"><span class="muted">/</span><input class="in" data-vt="ta_d" value="${esc(d.vitals.ta_d||"")}" placeholder="80" inputmode="numeric" style="padding:0 4px"></div></label>
          ${vin("fc","v_fc","bpm","pulse")}${vin("temp","v_temp","°C","thermo")}${vin("gly","v_gly","g/L","drop")}${vin("spo2","v_spo2","%","lungs")}
        </div></div></section>
        <section class="card" id="sec-consult"><div class="hd"><h3><span class="hi">${I("stetho")}</span>${t("consultation")}</h3></div><div class="bd form">
          <label class="field c12"><span>${t("motif")}</span><textarea class="in" data-f="motif" style="min-height:56px">${esc(d.motif)}</textarea></label>
          <label class="field c12"><span>${t("diagnostic")}</span><input class="in" data-f="diagnostic" id="vdx" value="${esc(d.diagnostic)}"></label>
          <div class="c12"><div class="chips">${[...ownDx,...topDx.filter(x=>!ownDx.includes(x))].slice(0,12).map(x=>`<button class="chip" data-dx="${esc(x)}">${esc(x)}</button>`).join("")}</div><div id="tplsug"></div></div>
          <label class="field c12"><span>${t("observations")}</span><textarea class="in" data-f="observations" style="min-height:90px">${esc(d.observations)}</textarea></label>
        </div></section>
        <section class="card" id="sec-rx"><div class="hd"><h3><span class="hi">${I("meds")}</span>${t("prescription")}</h3><div class="r">
          <select class="in" id="vtpl" style="height:30px;width:auto;font-size:12.5px"><option value="">${t("use_template")}</option>${S.templates.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>
          ${vs.find(v=>(v.rx||[]).length)?`<button class="btn xs" id="vrenew">${I("repeat")}${t("renew_last")}</button>`:""}
          <button class="btn xs" id="vsavetpl" title="${t("save_template")}">${I("copy")}</button><button class="btn xs soft" id="vprx">${I("pdf")}${t("print_rx")}</button>
        </div></div><div class="bd"><input class="in" id="vmed" placeholder="${t("add_med")}"><div id="rxlist" style="margin-top:6px"></div></div></section>
        <section class="card" id="sec-exams"><div class="hd"><h3><span class="hi">${I("flask")}</span>${t("exams")}</h3></div><div class="bd">
          <div class="row" style="margin-bottom:8px"><span class="ico">${I("flask")}</span><b>${t("analyses")}</b><button class="btn xs soft right" id="pan">${I("pdf")}${t("doc_analyses")}</button></div>
          <div class="checks" id="ckan"></div><input class="in" id="anx" placeholder="${t("other_exam")}" style="margin-top:8px;max-width:340px">
          <div class="row" style="margin:18px 0 8px"><span class="ico blue">${I("scan")}</span><b>${t("imagerie")}</b><button class="btn xs soft right" id="pim">${I("pdf")}${t("doc_imagerie")}</button></div>
          <div class="checks" id="ckim"></div><input class="in" id="imx" placeholder="${t("other_exam")}" style="margin-top:8px;max-width:340px">
        </div></section>
        <section class="card" id="sec-docs"><div class="hd"><h3><span class="hi">${I("cert")}</span>${t("certificates")}</h3><span class="muted" style="font-size:12px">${t("pdf_hint")}</span></div><div class="bd"><div class="docbtns">
          ${[["repos","doc_cert_repos","cert",""],["med","doc_cert_med","file",""],["aptitude","doc_aptitude","run","blue"],["bonne","doc_bonne_sante","heart",""],["presence","doc_presence","clock","amber"],["accomp","doc_accomp","user","amber"],["permis","doc_permis","car","blue"],["lettre","doc_lettre","mail","rose"]].map(x=>`<button class="docbtn" data-doc="${x[0]}"><span class="ico ${x[3]}">${I(x[2])}</span>${t(x[1])}</button>`).join("")}
        </div></div></section>
        <section class="card" id="sec-bill"><div class="hd"><h3><span class="hi">${I("cash")}</span>${t("billing")}</h3><div class="r"><button class="btn xs" id="pnote">${I("pdf")}${t("doc_note")}</button></div></div><div class="bd form">
          <label class="field c4"><span>${t("code")}</span><select class="in" id="vcode">${S.settings.tarifs.map(x=>`<option value="${esc(x.code)}" ${x.code===d.code?"selected":""}>${esc(x.code)} — ${esc(x.label)}</option>`).join("")}</select></label>
          <label class="field c2"><span>${t("honoraires")}</span><input class="in num" id="vhon" value="${d.honoraires}" inputmode="decimal"></label>
          <label class="field c3"><span>${t("recu")}</span><div class="row" style="gap:4px"><input class="in num" id="vrecu" value="${d.recu}" inputmode="decimal"><button class="btn sm" id="vfull" title="=">${I("check")}</button><button class="btn sm" id="vzero">0</button></div></label>
          <label class="field c3"><span>${t("doctor")}</span><select class="in" id="vdoc">${S.settings.doctors.map(x=>`<option ${x===d.doctor?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
          <div class="field c12"><span>${t("bs_mode")}</span><div class="seg" id="vbs" style="align-self:flex-start">${[["sans","sans_bs"],["avec","avec_bs"],["compl","bs_compl"]].map(x=>`<button type="button" data-bs="${x[0]}" class="${d.bs===x[0]?"on":""}">${t(x[1])}</button>`).join("")}</div></div>
        </div></section>
      </div>
      <div class="ve-bar"><div class="tot" id="vtot"></div><div class="right row"><button class="btn" id="vback2">${t("cancel")}</button><button class="btn pri lg" id="vsave">${I("check")}${t("save_visit")}<kbd style="background:transparent;color:inherit;border-color:rgba(255,255,255,.35)">Ctrl S</kbd></button></div></div>
    </div>`;
    bind();
  }
  function vin(k,lab,u,ic){return`<label class="field vital" id="vw-${k}"><span>${I(ic)}${t(lab)} <small>${u}</small></span><input class="in" data-vt="${k}" value="${esc(d.vitals[k]||"")}" inputmode="decimal"></label>`}
  function drawRx(){
    const box=$("#rxlist",el);
    if(!d.rx.length){box.innerHTML=emptyState("rx",t("rx_empty"),t("rx_empty_hint"));progress();return}
    box.innerHTML=d.rx.map((r,i)=>{const m=S.meds.find(x=>x.id===r.medId)||{posologies:[]};const hit=m.nom?allergyHit(p,m):null;return`<div class="rx-line"><div class="n">${i+1}</div><div class="nm">${esc(r.nom)}${hit?` <span class="pill red">⚠ ${esc(hit)}</span>`:""}<small>${esc(m.dci||"")}${m.forme?" · "+esc(m.forme):""}</small></div>
      <div><input class="in" data-rx="${i}" data-k="posologie" value="${esc(r.posologie)}" placeholder="${t("posologie")}" style="height:32px"><div class="qchips">${(m.posologies||[]).slice(0,3).map(x=>`<button data-qp="${i}" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
      <div><input class="in num" data-rx="${i}" data-k="qte" value="${r.qte||1}" title="${t("qte")}" style="height:32px;text-align:center"></div>
      <div><input class="in" data-rx="${i}" data-k="duree" value="${esc(r.duree||"")}" placeholder="${t("duree")}" style="height:32px"><div class="qchips">${["5 jours","7 jours","10 jours","1 mois","3 mois"].map(x=>`<button data-qd="${i}" data-v="${x}">${x}</button>`).join("")}</div></div>
      <button class="iconbtn" data-rm="${i}" style="width:32px;height:32px" aria-label="${t("delete")}">${I("x")}</button></div>`}).join("");
    $$("[data-rx]",box).forEach(x=>x.oninput=()=>{const r=d.rx[+x.dataset.rx];r[x.dataset.k]=x.dataset.k==="qte"?(+x.value||1):x.value});
    $$("[data-qp]",box).forEach(b=>b.onclick=()=>{d.rx[+b.dataset.qp].posologie=b.dataset.v;drawRx()});
    $$("[data-qd]",box).forEach(b=>b.onclick=()=>{d.rx[+b.dataset.qd].duree=b.dataset.v;drawRx()});
    $$("[data-rm]",box).forEach(b=>b.onclick=()=>{d.rx.splice(+b.dataset.rm,1);drawRx();totals()});
    progress();
  }
  function addMed(m){
    const push=()=>{setTimeout(totals,0);d.rx.push({medId:m.id,nom:m.nom,posologie:(m.posologies||[])[0]||"",qte:1,duree:""});drawRx();const ins=$$("#rxlist [data-k=posologie]",el);ins.length&&ins[ins.length-1].focus()};
    const hit=allergyHit(p,m);
    if(hit)confirmBox(`⚠ ${t("allergy_warn")} ${hit} — ${m.nom}. ${t("add_anyway")}`,push,{yes:t("add")});else push();
  }
  function checks(boxId,list,key){
    const all=[...new Set([...list,...d[key]])];
    $("#"+boxId,el).innerHTML=all.map(x=>`<label class="chk"><input type="checkbox" value="${esc(x)}" ${d[key].includes(x)?"checked":""}>${esc(x)}</label>`).join("");
    $$("#"+boxId+" input",el).forEach(c=>c.onchange=()=>{if(c.checked){if(!d[key].includes(c.value))d[key].push(c.value)}else d[key]=d[key].filter(x=>x!==c.value);progress()});
  }
  function progress(){
    const v=d.vitals||{},has={vitals:Object.values(v).some(x=>x!==""&&x!=null),consult:!!(d.motif||d.diagnostic),rx:d.rx.length>0,exams:d.analyses.length+d.imagerie.length>0,docs:!!VE.docDone,bill:num(d.honoraires)>0};
    Object.keys(has).forEach(k=>{const a=$("#st-"+k,el);a&&a.classList.toggle("done",has[k])});
    VIT.forEach(([k])=>{const w=$("#vw-"+k,el);w&&w.classList.toggle("warn",!!vitalWarn(k,v)&&(k!=="imc"||!!imcOf(v)))});
  }
  function totals(){
    const nv=prevSolde+num(d.honoraires)-num(d.recu);
    $("#vtot",el).innerHTML=`<span>${t("honoraires")} <b class="num">${money(d.honoraires)}</b></span><span>${t("recu")} <b class="num">${money(d.recu)}</b></span><span>${t("ancien_solde")} <b class="num">${money(prevSolde)}</b></span><span>${t("nouveau_solde")} <b class="num ${nv>0.0005?"red":"green"}" style="font-size:15px">${money(nv)} ${t("tnd")}</b></span>${d.rx.length?`<span><b>${d.rx.length}</b> ${t("search_meds").toLowerCase()}</span>`:""}`;progress();
  }
  function tplSuggest(){
    const dx=norm(d.diagnostic);const box=$("#tplsug",el);if(!dx||dx.length<3){box.innerHTML="";return}
    const tp=S.templates.find(x=>norm(x.name).includes(dx)||dx.includes(norm(x.name).split(" ")[0]));
    box.innerHTML=tp&&!d.rx.length?`<button class="btn xs" style="margin-top:8px" id="tplgo">${I("copy")}${t("use_template")} « ${esc(tp.name)} »</button>`:"";
    $("#tplgo",el)&&($("#tplgo",el).onclick=()=>{applyTpl(tp);box.innerHTML=""});
  }
  function applyTpl(tp){tp.rx.forEach(l=>{const m=S.meds.find(x=>x.id===l.medId)||{id:l.medId,nom:l.nom};const hit=m.dci?allergyHit(p,m):null;if(hit)toast("⚠ "+t("allergy_warn")+" "+hit+" — "+m.nom);d.rx.push({...l})});drawRx()}
  function bind(){
    $$("[data-vt]",el).forEach(x=>x.oninput=()=>{d.vitals[x.dataset.vt]=x.value.replace(",",".");$("#imc",el).value=imcOf(d.vitals);progress()});
    $$("[data-f]",el).forEach(x=>x.oninput=()=>{d[x.dataset.f]=x.value;if(x.dataset.f==="diagnostic")tplSuggest();progress()});
    $$("[data-dx]",el).forEach(b=>b.onclick=()=>{$("#vdx",el).value=b.dataset.dx;d.diagnostic=b.dataset.dx;tplSuggest()});
    $$("[data-sec]",el).forEach(a=>a.onclick=e=>{e.preventDefault();$("#sec-"+a.dataset.sec,el).scrollIntoView({behavior:"smooth",block:"start"})});
    $$("[data-mv]",el).forEach(x=>x.onclick=()=>openVisitView(x.dataset.mv));
    $("#vdate",el).onchange=e=>d.date=e.target.value||todayISO();
    $("#vback",el).onclick=()=>VE.close();$("#vback2",el).onclick=()=>VE.close();
    attachAC($("#vmed",el),{source:medSource,render:medRender,onPick:(it,inp)=>{inp.value="";addMed(it.m)}});
    $("#vtpl",el).onchange=e=>{const tp=S.templates.find(x=>x.id===e.target.value);if(tp)applyTpl(tp);e.target.value=""};
    $("#vrenew",el)&&($("#vrenew",el).onclick=()=>{const lv=vs.find(v=>(v.rx||[]).length);lv.rx.forEach(r=>d.rx.push({...r}));drawRx()});
    $("#vsavetpl",el).onclick=()=>{if(!d.rx.length)return;openModal(mh(t("save_template"))+`<div class="mb"><label class="field"><span>${t("template_name")}</span><input class="in" id="tn" value="${esc(d.diagnostic)}"></label></div><div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="tok">${t("save")}</button></div>`,{cls:"sm",onMount:m=>m.querySelector("#tok").onclick=()=>{const n=m.querySelector("#tn").value.trim();if(!n)return;S.templates.push({id:uid("t"),name:n,rx:JSON.parse(JSON.stringify(d.rx))});save();closeModal();toast(t("saved"));draw()}})};
    checks("ckan",ANALYSES.slice(0,24),"analyses");checks("ckim",IMAGERIE.slice(0,12),"imagerie");
    const other=(id,key,box,list)=>$("#"+id,el).onkeydown=e=>{if(e.key==="Enter"&&e.target.value.trim()){e.preventDefault();d[key].push(e.target.value.trim());e.target.value="";checks(box,list,key)}};
    other("anx","analyses","ckan",ANALYSES.slice(0,24));other("imx","imagerie","ckim",IMAGERIE.slice(0,12));
    $("#pan",el).onclick=()=>d.analyses.length&&pdfExams(p,d,"analyses");
    $("#pim",el).onclick=()=>d.imagerie.length&&pdfExams(p,d,"imagerie");
    $$("[data-doc]",el).forEach(b=>b.onclick=()=>{VE.docDone=true;progress();openCert(b.dataset.doc,p,d)});
    $("#vcode",el).onchange=e=>{const tr=S.settings.tarifs.find(x=>x.code===e.target.value);d.code=e.target.value;if(tr){const full=num(d.recu)===num(d.honoraires);d.honoraires=tr.price;$("#vhon",el).value=tr.price;if(full){d.recu=tr.price;$("#vrecu",el).value=tr.price}}totals()};
    $("#vhon",el).oninput=e=>{d.honoraires=num(e.target.value);totals()};
    $("#vrecu",el).oninput=e=>{d.recu=num(e.target.value);totals()};
    $("#vfull",el).onclick=()=>{d.recu=num(d.honoraires);$("#vrecu",el).value=d.recu;totals()};
    $("#vzero",el).onclick=()=>{d.recu=0;$("#vrecu",el).value=0;totals()};
    $("#vdoc",el).onchange=e=>d.doctor=e.target.value;
    $$("#vbs button",el).forEach(b=>b.onclick=()=>{d.bs=b.dataset.bs;$$("#vbs button",el).forEach(x=>x.classList.toggle("on",x===b))});
    $("#pnote",el).onclick=()=>pdfNote(p,d);
    $("#vprx",el).onclick=()=>{if(d.rx.length)pdfRx(p,d);else $("#vmed",el).focus()};
    $("#vsave",el).onclick=saveVisit;
    drawRx();totals();tplSuggest();progress();
  }
  function saveVisit(){
    d.honoraires=num(d.honoraires);d.recu=num(d.recu);
    if(ex){Object.assign(ex,d)}else{d.id=uid("v");S.visits.push(d)}
    if(rdvId){const r=S.rdv.find(x=>x.id===rdvId);if(r)r.status="termine"}
    else{const r=S.rdv.find(x=>x.patientId===pid&&x.date===d.date&&(x.status==="arrive"||x.status==="encours"||x.status==="prevu"));if(r)r.status="termine"}
    if(S.draft&&S.draft.pid===pid)delete S.draft;
    save();teardown();toast(t("visit_saved"));
    if(UI.route[0]==="patient"&&UI.route[1]===pid)render();else go("patient/"+pid);
  }
  draw();
}
