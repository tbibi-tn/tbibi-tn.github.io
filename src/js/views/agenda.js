/* =========================================================
   AGENDA
   ========================================================= */
const toMin=hm=>{const[h,m]=(hm||"0:0").split(":").map(Number);return h*60+m};
const fromMin=m=>pad(Math.floor(m/60))+":"+pad(m%60);
function weekStart(off){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+off*7);return isoDate(d)}
function vAgenda(pg){
  const A=S.settings.agenda,slot=+A.slot||30,st=toMin(A.start),en=toMin(A.end),H=Math.round(46*slot/30);
  const ws=weekStart(UI.wkOffset),allDays=[0,1,2,3,4,5].map(i=>addDays(ws,i)),td=todayISO();
  const mobile=matchMedia("(max-width:820px)").matches;
  if(UI.agDay==null||UI.agDay>5)UI.agDay=Math.max(0,allDays.indexOf(td));
  const days=mobile?[allDays[UI.agDay]]:allDays;
  const nslots=Math.ceil((en-st)/slot);
  const wkRdv=S.rdv.filter(r=>r.date>=allDays[0]&&r.date<=allDays[5]);
  const lbl=d=>new Date(d+"T00:00:00").toLocaleDateString(loc(),{weekday:"short",day:"numeric",month:"short"});
  pg.innerHTML=`
  <div class="ph"><div><h1>${t("nav_agenda")}</h1><div class="sub">${t("agenda_sub")}</div></div>
   <div class="actions"><button class="btn pri" data-act="agNew">${I("plus")}${t("new_rdv")}</button></div></div>
  <div class="card"><div class="toolbar"><button class="iconbtn" data-act="agPrev">${I("left")}</button><button class="btn sm" data-act="agToday">${t("today_btn")}</button><button class="iconbtn" data-act="agNext">${I("right")}</button>
   <b style="margin-left:6px">${new Date(allDays[0]+"T00:00:00").toLocaleDateString(loc(),{day:"numeric",month:"long"})} – ${new Date(allDays[5]+"T00:00:00").toLocaleDateString(loc(),{day:"numeric",month:"long",year:"numeric"})}</b>
   <div class="right row wrap">${["prevu","arrive","encours","termine","absent"].map(s=>`<span class="muted" style="font-size:12px">${stPill(s)} ${wkRdv.filter(r=>r.status===s).length}</span>`).join("")}</div></div>
   ${mobile?`<div class="chips daychips">${allDays.map((d,i)=>`<button class="chip ${i===UI.agDay?"on":""}" data-agday="${i}">${new Date(d+"T00:00:00").toLocaleDateString(loc(),{weekday:"short",day:"numeric"})}<span class="n">${S.rdv.filter(r=>r.date===d&&r.status!=="absent").length}</span></button>`).join("")}</div>`:""}
   <div class="ag-wrap"><div class="ag ${mobile?"one":""}" style="grid-template-columns:${mobile?"52px":"60px"} repeat(${days.length},minmax(0,1fr))">
    <div class="hcell"></div>${days.map(d=>`<div class="hcell ${d===td?"today":""}" style="text-transform:capitalize">${lbl(d)} <span style="opacity:.6;font-weight:500">· ${S.rdv.filter(r=>r.date===d&&r.status!=="absent").length}</span></div>`).join("")}
    <div>${Array.from({length:nslots},(_,i)=>`<div style="height:${H}px" class="tcell">${(st+i*slot)%60===0||slot<60?fromMin(st+i*slot):""}</div>`).join("")}</div>
    ${days.map(d=>{
      const evs=S.rdv.filter(r=>r.date===d).sort((a,b)=>a.time.localeCompare(b.time));
      const cols={};evs.forEach(r=>{cols[r.time]=(cols[r.time]||0)+1});const idx={};
      let now="";if(d===td){const nm=toMin(nowHM());if(nm>=st&&nm<=en)now=`<div class="nowline" style="top:${(nm-st)/slot*H}px"></div>`}
      return`<div class="col ${d===td?"today":""}" data-day="${d}">${Array.from({length:nslots},(_,i)=>`<div class="slot ${(st+(i+1)*slot)%60!==0?"half":""}" style="height:${H}px" data-t="${fromMin(st+i*slot)}"></div>`).join("")}${now}
      ${evs.map(r=>{const p=r.patientId?P(r.patientId):null;const n=cols[r.time],k=idx[r.time]=(idx[r.time]||0)+1;const top=(toMin(r.time)-st)/slot*H,h=Math.max((+r.duration||slot)/slot*H-3,22);
        return`<div class="ev-blk st-${r.status}" data-r="${r.id}" style="top:${top+1}px;height:${h}px;left:calc(${(k-1)*100/n}% + 3px);right:auto;width:calc(${100/n}% - 6px)"><b>${r.time} ${esc(p?shortName(p):r.name)}</b><span>${esc(r.motif||t("st_"+r.status))}</span></div>`}).join("")}</div>`}).join("")}
   </div></div></div>`;
  ACT.agPrev=()=>{UI.wkOffset--;render()};ACT.agNext=()=>{UI.wkOffset++;render()};ACT.agToday=()=>{UI.wkOffset=0;UI.agDay=null;render()};
  $$("[data-agday]").forEach(b=>b.onclick=()=>{UI.agDay=+b.dataset.agday;render()});
  ACT.agNew=()=>openRdvForm(null,{date:UI.wkOffset===0?td:days[0]});
  $$(".ag .slot").forEach(s=>s.onclick=()=>openRdvForm(null,{date:s.parentElement.dataset.day,time:s.dataset.t}));
  $$(".ev-blk").forEach(b=>b.onclick=e=>{e.stopPropagation();openRdvForm(b.dataset.r)});
  const nl=$(".nowline");if(nl)setTimeout(()=>{const w=$(".ag-wrap");},0);
}
function openRdvForm(id,{date,time,patientId}={}){
  const ex=id?S.rdv.find(r=>r.id===id):null;
  const A=S.settings.agenda,slot=+A.slot||30;
  const r=ex?{...ex}:{patientId:patientId||null,name:"",phone:"",date:date||todayISO(),time:time||"09:00",duration:slot,motif:"",status:"prevu"};
  const times=[];for(let m=toMin(A.start);m<toMin(A.end);m+=15)times.push(fromMin(m));if(!times.includes(r.time))times.push(r.time);
  const taken=d=>S.rdv.filter(x=>x.date===d&&x.id!==(ex&&ex.id)&&x.status!=="absent").map(x=>x.time);
  const m=openModal(mh(ex?t("nav_agenda"):t("new_rdv"),"","agenda")+`<div class="mb form">
    <div class="field c12"><span>${t("rdv_patient")}</span><div id="rsel"></div></div>
    <label class="field c4"><span>${t("date")}</span><input class="in" type="date" id="rd" value="${r.date}"></label>
    <label class="field c4"><span>${t("rdv_time")}</span><select class="in" id="rt"></select></label>
    <label class="field c4"><span>${t("rdv_dur")}</span><select class="in" id="rdu">${[15,20,30,45,60].map(x=>`<option ${+r.duration===x?"selected":""}>${x}</option>`).join("")}</select></label>
    <label class="field c8"><span>${t("col_motif")}</span><input class="in" id="rm" value="${esc(r.motif)}" list="rml"><datalist id="rml"><option>Contrôle</option><option>Renouvellement ordonnance</option><option>Résultats d'analyses</option><option>Première consultation</option><option>Certificat</option><option>Vaccination</option></datalist></label>
    <label class="field c4"><span>${t("rdv_status")}</span><select class="in" id="rs">${["prevu","arrive","encours","termine","absent"].map(s=>`<option value="${s}" ${r.status===s?"selected":""}>${t("st_"+s)}</option>`).join("")}</select></label>
  </div><div class="mf">${ex?`<button class="btn danger" id="rdel" style="margin-right:auto">${I("trash")}</button>`:""}${ex&&r.status!=="termine"?`<button class="btn" id="rgo">${I("stetho")}${t("start_consult")}</button>`:""}<button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="rok">${I("check")}${t("save")}</button></div>`,{});
  const sel=m.querySelector("#rsel");
  function drawSel(){
    const p=r.patientId?P(r.patientId):null;
    if(p){sel.innerHTML=`<div class="row" style="border:1px solid var(--line2);border-radius:8px;padding:6px 8px"><div class="avatar">${initials(p)}</div><div><b>${esc(fullName(p))}</b><div class="muted" style="font-size:12px">${t("dossier")} ${esc(p.dossier)} · ${esc(p.tel||"")}</div></div><button class="btn xs right" id="rch">${I("x")}</button></div>`;sel.querySelector("#rch").onclick=()=>{r.patientId=null;drawSel()}}
    else{sel.innerHTML=`<div class="form" style="gap:8px"><div class="c12"><input class="in" id="rpq" placeholder="${t("search_patient")}"></div><input class="in c8" id="rn" value="${esc(r.name)}" placeholder="${t("rdv_new_name")}"><input class="in c4" id="rph" value="${esc(r.phone)}" placeholder="${t("f_tel")}"></div>`;
      attachAC(sel.querySelector("#rpq"),{source:patientSource,render:patientRender,onPick:it=>{r.patientId=it.p.id;drawSel()}});
      sel.querySelector("#rn").oninput=e=>r.name=e.target.value;sel.querySelector("#rph").oninput=e=>r.phone=e.target.value;setTimeout(()=>sel.querySelector("#rpq").focus(),40)}
  }
  function drawTimes(){const tk=taken(m.querySelector("#rd").value);m.querySelector("#rt").innerHTML=times.sort().map(x=>`<option value="${x}" ${x===r.time?"selected":""}>${x}${tk.includes(x)?" ●":""}</option>`).join("")}
  drawSel();drawTimes();
  m.querySelector("#rd").onchange=drawTimes;
  const collect=()=>{r.date=m.querySelector("#rd").value;r.time=m.querySelector("#rt").value;r.duration=+m.querySelector("#rdu").value;r.motif=m.querySelector("#rm").value.trim();r.status=m.querySelector("#rs").value};
  m.querySelector("#rok").onclick=()=>{collect();if(!r.patientId&&!r.name.trim()){toast(t("required"),true);return}
    const commit=()=>{if(ex)Object.assign(ex,r);else{r.id=uid("r");S.rdv.push(r)}save();closeModal();toast(t("rdv_saved"));render()};
    const a0=toMin(r.time),a1=a0+(+r.duration||slot);
    const clash=r.status==="absent"?null:S.rdv.find(x=>x!==ex&&x.date===r.date&&x.status!=="absent"&&toMin(x.time)<a1&&toMin(x.time)+(+x.duration||slot)>a0);
    if(clash){const cp=clash.patientId?P(clash.patientId):null;confirmBox(t("rdv_clash").replace("{t}",clash.time).replace("{p}",cp?shortName(cp):clash.name),commit,{yes:t("rdv_book_anyway")});return}
    commit()};
  ex&&(m.querySelector("#rdel").onclick=()=>confirmBox(t("confirm_delete"),()=>{S.rdv=S.rdv.filter(x=>x.id!==ex.id);save();closeModal();render()}));
  m.querySelector("#rgo")&&(m.querySelector("#rgo").onclick=()=>{collect();Object.assign(ex,r);closeModal();startFromRdv(ex)});
}
