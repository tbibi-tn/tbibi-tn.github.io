/* =========================================================
   WAITING ROOM — who is next, and in which order
   Each patient who has arrived gets a queue position (r.q).
   Two modes decide the default order:
     "arrival": first come, first seen (walk-ins friendly)
     "time":    by appointment time
   The doctor or secretary can always reorder by hand
   (drag, arrows, "see first"). Manual order wins until the
   mode is changed again.
   ========================================================= */
const queueMode=()=>S.settings.queueMode||"arrival";
const apptMs=r=>new Date(r.date+"T"+(r.time||"00:00")+":00").getTime();
const qKey=r=>r.q!=null?r.q:(queueMode()==="arrival"&&r.arrivedAt?r.arrivedAt:apptMs(r));

/* today's appointments grouped and ordered for the waiting room */
function todayQueue(d=todayISO()){
  const rd=S.rdv.filter(r=>r.date===d);
  const byTime=(a,b)=>a.time.localeCompare(b.time);
  return{
    encours:rd.filter(r=>r.status==="encours").sort(byTime),
    waiting:rd.filter(r=>r.status==="arrive").sort((a,b)=>qKey(a)-qKey(b)),
    upcoming:rd.filter(r=>r.status==="prevu").sort(byTime),
    done:rd.filter(r=>r.status==="termine"||r.status==="absent").sort(byTime),
    all:rd,
  };
}
function nextPatient(){
  const q=todayQueue();
  if(q.encours[0])return q.encours[0];
  if(q.waiting[0])return q.waiting[0];
  const now=nowHM();
  return q.upcoming.find(r=>r.time>=now.slice(0,3)+"00")||q.upcoming[0]||null;
}
function nextTicket(d=todayISO()){return S.rdv.filter(r=>r.date===d&&r.ticket).reduce((m,r)=>Math.max(m,r.ticket),0)+1}
function markArrived(r){
  r.status="arrive";r.arrivedAt=Date.now();if(!r.ticket)r.ticket=nextTicket(r.date);
  if(S.settings.autoTicket)setTimeout(()=>printTicket(r),300);
  r.q=queueMode()==="arrival"?r.arrivedAt:apptMs(r);
}
/* write positions 1..n back after a manual move */
function setQueueOrder(list){const base=Date.now();list.forEach((r,i)=>{r.q=base+i})}
function moveInQueue(id,to){
  const list=todayQueue().waiting;const i=list.findIndex(r=>r.id===id);if(i<0)return;
  const j=to==="first"?0:to==="up"?i-1:to==="down"?i+1:+to;
  if(j<0||j>=list.length||j===i)return;
  const [r]=list.splice(i,1);list.splice(j,0,r);setQueueOrder(list);save();render();
}
function setQueueMode(m){
  S.settings.queueMode=m;
  todayQueue().waiting.forEach(r=>{r.q=m==="arrival"?(r.arrivedAt||apptMs(r)):apptMs(r)});
  save();render();
}
function addWalkIn(p){
  const m=new Date();m.setMinutes(Math.round(m.getMinutes()/5)*5,0,0);
  const r={id:uid("r"),patientId:p.id,name:"",phone:"",date:todayISO(),time:pad(m.getHours())+":"+pad(m.getMinutes()),duration:+(S.settings.agenda.slot||30),motif:t("walkin"),status:"prevu",walkin:true};
  markArrived(r);S.rdv.push(r);save();toast(t("walkin_added").replace("{p}",shortName(p)));render();
}
function removeFromQueue(r){
  const prev={status:r.status,q:r.q};const p=r.patientId?P(r.patientId):null;
  r.status="absent";save();render();
  toastUndo(t("q_removed").replace("{p}",p?shortName(p):r.name),()=>{Object.assign(r,prev);save();render()});
}

/* ---------- waiting-time estimate ----------
   Average consultation length: set by hand in Settings, or learnt from
   the gaps between consecutive visits of the last 60 days (median). */
let _avgCache=null;
function autoConsultMin(){
  if(_avgCache&&Date.now()-_avgCache.at<60000)return _avgCache.v;
  const from=addDays(todayISO(),-60),byDay={};
  S.visits.forEach(v=>{if(v.date>=from&&v.time)(byDay[v.date]=byDay[v.date]||[]).push(toMin(v.time))});
  const gaps=[];Object.values(byDay).forEach(a=>{a.sort((x,y)=>x-y);for(let i=1;i<a.length;i++){const g=a[i]-a[i-1];if(g>=4&&g<=60)gaps.push(g)}});
  gaps.sort((a,b)=>a-b);let v=gaps.length>=10?gaps[Math.floor(gaps.length/2)]:15;v=Math.min(40,Math.max(8,v));
  _avgCache={v,at:Date.now()};return v;
}
const avgConsultMin=()=>+S.settings.consultMin>0?+S.settings.consultMin:autoConsultMin();
function queueETA(){
  const q=todayQueue(),avg=avgConsultMin()*60000,now=Date.now(),cur=q.encours[0];
  let t0=now;if(cur)t0=now+Math.max(avg-(now-(cur.startedAt||now)),3*60000);
  const eta={};q.waiting.forEach((r,i)=>{eta[r.id]=t0+i*avg});
  let tq=t0+q.waiting.length*avg;q.upcoming.forEach(r=>{const x=Math.max(apptMs(r),tq);eta[r.id]=x;tq=x+avg});
  return{eta,avg:avgConsultMin(),cur,q};
}
const hm=ms=>{const d=new Date(ms);return pad(d.getHours())+":"+pad(d.getMinutes())};
/* make sure everyone already in the waiting room has a ticket number */
function ensureTickets(){let ch=false;if(UI.route[0]==="ecran")return assignTicketsInMemory();todayQueue().waiting.concat(todayQueue().encours).sort((a,b)=>qKey(a)-qKey(b)).forEach(r=>{if(!r.ticket){r.ticket=nextTicket(r.date);ch=true}});if(ch)save()}

/* ---------- QR snapshot for the patient page ----------
   Only ticket numbers and times leave the app: no names. */
function queueSnapshot(ticket){
  const{eta,cur,q}=queueETA(),D=S.settings.doctor;
  const o={v:1,n:D.name||"",s:D.spe||"",a:[D.addr,D.city].filter(Boolean).join(", "),u:Math.round(Date.now()/60000),m:avgConsultMin(),c:cur&&cur.ticket||0,q:q.waiting.slice(0,40).map(r=>[r.ticket||0,Math.round(eta[r.id]/60000)])};
  if(ticket)o.t=ticket;return o;
}
function b64url(str){const b=new TextEncoder().encode(str);let s="";b.forEach(x=>s+=String.fromCharCode(x));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function patientPageUrl(snap){
  const base=(S.settings.queueUrl||"").trim()||new URL("attente.html",location.href.split("#")[0]).href;
  return base.replace(/#.*$/,"")+"#d="+b64url(JSON.stringify(snap));
}

/* ---------- 80 mm ticket for the patient ---------- */
function printTicket(r){
  ensureTickets();
  const{eta,q}=queueETA(),D=S.settings.doctor,pos=q.waiting.findIndex(x=>x.id===r.id),url=patientPageUrl(queueSnapshot(r.ticket));
  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Ticket ${r.ticket}</title><style>
  @page{size:80mm auto;margin:4mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font-family:"IBM Plex Sans","Segoe UI",Arial,sans-serif;color:#111;text-align:center;width:72mm}
  .n{font-size:15px;font-weight:700}.a{font-size:10px;color:#444}.hr{border-top:1px dashed #999;margin:3mm 0}
  .l{font-size:11px;color:#444;margin-top:2mm}.big{font-size:54px;font-weight:800;line-height:1;margin:1mm 0;color:#0d2a21}
  .row{display:flex;justify-content:space-between;font-size:12px;margin:1mm 2mm}.row b{font-size:13px}
  .qr{width:34mm;height:34mm;margin:2mm auto 1mm;display:block}.s{font-size:10px;color:#444}.ar{font-size:11px;direction:rtl;margin-top:1mm}
  </style></head><body><div class="n">${esc(D.name)}</div><div class="a">${esc([D.spe,D.city].filter(Boolean).join(" — "))}</div>
  <div class="hr"></div><div class="l">Votre numéro · رقمك</div><div class="big">${r.ticket}</div>
  <div class="row"><span>Arrivée</span><b>${hm(r.arrivedAt||Date.now())}</b></div>
  <div class="row"><span>Patients avant vous</span><b>${Math.max(0,pos)}</b></div>
  <div class="row"><span>Passage estimé vers</span><b>${eta[r.id]?hm(eta[r.id]):"—"}</b></div>
  <div class="hr"></div>${qrSvg(url,{ecl:"L",border:1,dark:"#000"})}
  <div class="s">Scannez pour suivre votre tour sur votre téléphone</div><div class="ar">امسح الرمز لمتابعة دورك على هاتفك</div>
  <div class="hr"></div><div class="s">${fmtD(todayISO())} — estimation, peut varier selon les urgences</div></body></html>`;
  const f=document.createElement("iframe");f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";document.body.appendChild(f);
  const w=f.contentWindow;w.document.open();w.document.write(html);w.document.close();setTimeout(()=>{try{w.focus();w.print()}catch(e){}setTimeout(()=>f.remove(),1500)},250);
}

/* ---------- rendering ---------- */
function waitMins(r){return r.arrivedAt?Math.max(0,Math.round((Date.now()-r.arrivedAt)/60000)):null}
function queueRow(r,pos,total,eta){
  const p=r.patientId?P(r.patientId):null,nm=p?shortName(p):r.name;
  const al=p?allergyList(p):[];
  const ini=p?initials(p):(r.name||"?").replace(/^(Mme\.|Mr\.|Mlle\.)\s*/,"").split(" ").slice(0,2).map(x=>x[0]).join("");
  const w=r.status==="arrive"?waitMins(r):null;
  const est=eta&&eta[r.id]&&(r.status==="arrive"||r.status==="prevu")?`<span class="eta" title="${t("q_eta_hint")}">≈ ${hm(eta[r.id])}</span>`:"";
  const sub=[r.motif?esc(r.motif):"",w!=null?`<span class="${w>=45?"red":""}">${t("q_waits").replace("{m}",durStr(w))}</span>`:"",al.length?`<span class="red">⚠ ${esc(al.join(", "))}</span>`:""].filter(Boolean).join(" — ");
  let lead=`<div class="tm">${r.time}</div>`,btns="";
  if(r.status==="arrive"){
    lead=`<span class="qhandle" title="${t("q_drag_hint")}" aria-hidden="true">${I("grip")}</span><span class="qpos" title="${t("q_ticket_n").replace("{n}",r.ticket||"")}">${r.ticket||pos+1}</span>`;
    btns=`<div class="qmove"><button class="iconbtn sm" data-qm="up" data-id="${r.id}" ${pos===0?"disabled":""} title="${t("q_up")}" aria-label="${t("q_up")}">${I("up")}</button><button class="iconbtn sm" data-qm="down" data-id="${r.id}" ${pos===total-1?"disabled":""} title="${t("q_down")}" aria-label="${t("q_down")}">${I("down")}</button><button class="iconbtn sm" data-qm="first" data-id="${r.id}" ${pos===0?"disabled":""} title="${t("q_first_hint")}" aria-label="${t("q_first_hint")}">${I("zap")}</button></div>
      <button class="iconbtn sm ghost" data-q="ticket" data-id="${r.id}" title="${t("q_ticket")}" aria-label="${t("q_ticket")}">${I("ticket")}</button><button class="btn xs pri" data-q="consult" data-id="${r.id}">${I("stetho")}${t("start_consult")}</button><button class="iconbtn sm ghost" data-q="remove" data-id="${r.id}" title="${t("q_remove")}" aria-label="${t("q_remove")}">${I("x")}</button>`;
  }else if(r.status==="encours"){
    btns=`<button class="btn xs pri" data-q="consult" data-id="${r.id}">${I("stetho")}${t("q_resume")}</button>`;
  }else if(r.status==="prevu"){
    btns=`<button class="btn xs" data-q="arrive" data-id="${r.id}">${I("check")}${t("mark_arrived")}</button><button class="iconbtn sm ghost" data-q="remove" data-id="${r.id}" title="${t("st_absent")}" aria-label="${t("st_absent")}">${I("x")}</button>`;
  }else btns=stPill(r.status);
  return`<div class="q-item ${r.status==="termine"||r.status==="absent"?"done":""} ${r.status==="encours"?"now":""} ${r.status==="arrive"?"qdrag":""}" ${r.status==="arrive"?`draggable="true" data-qid="${r.id}"`:""}${p?` data-open="patient/${p.id}"`:""}>
    ${lead}<div class="avatar ${p&&p.sexe==="F"?"f":""}">${esc(ini)}</div>
    <div class="tx"><b>${r.ticket&&r.status!=="prevu"&&r.status!=="arrive"?`<span class="ticket">N° ${r.ticket}</span>`:""}${esc(nm)}${r.walkin?` <span class="pill">${t("walkin")}</span>`:""}</b><small>${sub||(r.status==="arrive"?"":`${t("st_"+r.status)}`)}</small></div>
    ${est}<div class="row qbtns">${btns}</div></div>`;
}
function waitingRoomCard(){
  ensureTickets();
  const q=todayQueue(),mode=queueMode(),{eta}=queueETA();
  const grp=(title,list,icon,extra="")=>list.length?`<div class="qgrp">${I(icon)}${title}<span class="cnt">${list.length}</span>${extra}</div>`:"";
  return`<div class="card" id="wroom"><div class="hd"><h3><span class="hi">${I("clock")}</span>${t("waiting_room")}</h3>
    <div class="r"><div class="seg" title="${t("q_mode")}"><button data-qmode="arrival" class="${mode==="arrival"?"on":""}">${t("q_mode_arrival")}</button><button data-qmode="time" class="${mode==="time"?"on":""}">${t("q_mode_time")}</button></div>
    <button class="btn sm soft" data-act="walkIn">${I("userplus")}${t("add_walkin")}</button><button class="iconbtn sm" data-act="openScreen" title="${t("q_screen")}" aria-label="${t("q_screen")}">${I("tv")}</button></div></div>
    ${q.waiting.length||q.encours.length?`<div class="qinfo">${I("clock")}<span>${t("q_avg").replace("{m}",avgConsultMin())}${+S.settings.consultMin>0?"":` (${t("q_auto")})`}</span>${q.waiting.length?`<span>· ${t("q_last_eta").replace("{h}",hm(eta[q.waiting[q.waiting.length-1].id]))}</span>`:""}</div>`:""}
    ${q.all.length?`
    ${grp(t("q_in_consult"),q.encours,"stetho")}${q.encours.map(r=>queueRow(r,0,0,eta)).join("")}
    ${grp(t("q_waiting"),q.waiting,"clock",q.waiting.length>1?`<span class="muted qhint">${t("q_drag_hint")}</span>`:"")}<div id="qlist">${q.waiting.map((r,i)=>queueRow(r,i,q.waiting.length,eta)).join("")}</div>
    ${grp(t("q_upcoming"),q.upcoming,"agenda")}${q.upcoming.map(r=>queueRow(r,0,0,eta)).join("")}
    ${q.done.length?`<button class="qgrp qtoggle" data-act="qDone">${I(UI.showDone?"down":"right")}${t("q_done")}<span class="cnt">${q.done.length}</span></button>${UI.showDone?q.done.map(r=>queueRow(r)).join(""):""}`:""}
    `:emptyState("agenda",t("waiting_empty"),t("waiting_empty_hint"),`<button class="btn soft" data-act="walkIn">${I("userplus")}${t("add_walkin")}</button>`)}
  </div>`;
}
function bindWaitingRoom(root){
  const card=$("#wroom",root);if(!card)return;
  $$("[data-qmode]",card).forEach(b=>b.onclick=()=>setQueueMode(b.dataset.qmode));
  $$("[data-qm]",card).forEach(b=>b.onclick=e=>{e.stopPropagation();moveInQueue(b.dataset.id,b.dataset.qm)});
  $$("[data-q]",card).forEach(b=>b.onclick=e=>{e.stopPropagation();const r=S.rdv.find(x=>x.id===b.dataset.id);const a=b.dataset.q;
    if(a==="consult")startFromRdv(r);else if(a==="arrive"){markArrived(r);save();render()}else if(a==="remove")removeFromQueue(r);else if(a==="ticket")printTicket(r)});
  $$(".q-item[data-open]",card).forEach(el=>el.onclick=e=>{if(e.target.closest("button"))return;go(el.dataset.open)});
  /* drag and drop inside the waiting list */
  const list=$("#qlist",card);if(!list)return;let dragId=null;
  $$(".qdrag",list).forEach(el=>{
    el.addEventListener("dragstart",e=>{dragId=el.dataset.qid;el.classList.add("dragging");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",dragId)}catch(_){}});
    el.addEventListener("dragend",()=>{el.classList.remove("dragging");$$(".dropbefore,.dropafter",list).forEach(x=>x.classList.remove("dropbefore","dropafter"))});
    el.addEventListener("dragover",e=>{if(!dragId||el.dataset.qid===dragId)return;e.preventDefault();const r=el.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;el.classList.toggle("dropafter",after);el.classList.toggle("dropbefore",!after)});
    el.addEventListener("dragleave",()=>el.classList.remove("dropbefore","dropafter"));
    el.addEventListener("drop",e=>{e.preventDefault();if(!dragId)return;const ids=$$(".qdrag",list).map(x=>x.dataset.qid);const from=ids.indexOf(dragId);let to=ids.indexOf(el.dataset.qid);
      if(el.classList.contains("dropafter"))to++;if(from<to)to--;dragId=null;moveInQueue(ids[from],String(to))});
  });
}
function assignTicketsInMemory(){const q=todayQueue();let n=nextTicket();q.waiting.concat(q.encours).sort((a,b)=>qKey(a)-qKey(b)).forEach(r=>{if(!r.ticket)r.ticket=n++})}
/* 25 -> "25 min", 114 -> "1 h 54" */
const durStr=m=>m<60?m+" min":Math.floor(m/60)+" h "+String(m%60).padStart(2,"0");
