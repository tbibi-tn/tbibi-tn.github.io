/* =========================================================
   SETTINGS
   ========================================================= */
function vSettings(pg){
  const D=S.settings.doctor,A=S.settings.agenda;
  const f=(c,lab,id,val,type="text")=>`<label class="field ${c}"><span>${t(lab)}</span><input class="in" id="${id}" type="${type}" value="${esc(val||"")}"></label>`;
  pg.innerHTML=`<div class="ph"><div><h1>${t("nav_settings")}</h1><div class="sub">${t("settings_sub")}</div></div><div class="actions"><span class="autosave muted" id="asv">${I("check")}${t("set_autosaved")}</span><button class="btn pri" data-act="setSave">${I("check")}${t("save")}</button></div></div>
  <div class="grid g2">
   <div class="card"><div class="hd"><h3><span class="hi">${I("file")}</span>${t("set_doctor")}</h3><div class="r"><button class="btn xs" data-act="setPreview">${I("pdf")}${t("doc_rx")}</button></div></div><div class="bd form">
     ${f("c6","set_name","sn",D.name)}${f("c6","set_spe","ss",D.spe)}${f("c8","set_addr","sa",D.addr)}${f("c4","set_city","sc",D.city)}${f("c4","set_phone","sp",D.phone)}${f("c8","set_email","se",D.email)}${f("c6","set_cnam","scn",D.cnam)}${f("c6","set_mf","smf",D.mf)}${f("c12","set_hours","sh",D.hours)}
     <div class="c6 imgup"><span>${t("set_logo")}</span><div class="imgbox" id="lgbox">${D.logo?`<img src="${D.logo}" alt="">`:`<em>${t("set_logo_none")}</em>`}</div><div class="row"><label class="btn sm">${I("upload")}${t("set_choose")}<input type="file" accept="image/png,image/jpeg,image/webp" id="lgf" hidden></label>${D.logo?`<button class="btn sm ghost danger" id="lgx">${I("trash")}</button>`:""}</div></div>
     <div class="c6 imgup"><span>${t("set_stamp")}</span><div class="imgbox" id="stbox">${D.stamp?`<img src="${D.stamp}" alt="">`:`<em>${t("set_stamp_none")}</em>`}</div><div class="row"><label class="btn sm">${I("upload")}${t("set_choose")}<input type="file" accept="image/png,image/jpeg,image/webp" id="stf" hidden></label>${D.stamp?`<button class="btn sm ghost danger" id="stx">${I("trash")}</button>`:""}</div>
      <label class="chk" style="padding-left:0"><input type="checkbox" id="sauto" ${D.autoStamp!==false?"checked":""}>${t("set_stamp_auto")}</label></div>
     <p class="c12 muted" style="margin:0;font-size:12.5px">${t("set_img_hint")}</p>
   </div></div>
   <div class="grid" style="align-content:start">
    <div class="card"><div class="hd"><h3><span class="hi">${I("cash")}</span>${t("set_tarifs")}</h3><div class="r"><button class="btn xs" id="tadd">${I("plus")}</button></div></div><div class="bd flush"><table class="t"><thead><tr><th>${t("code")}</th><th>${t("tarif_label")}</th><th class="num">${t("tarif_price")}</th><th></th></tr></thead><tbody id="ttb"></tbody></table></div></div>
    <div class="card"><div class="hd"><h3><span class="hi">${I("agenda")}</span>${t("set_agenda")}</h3></div><div class="bd form">${f("c4","set_start","as",A.start,"time")}${f("c4","set_end","ae",A.end,"time")}<label class="field c4"><span>${t("set_slot")}</span><select class="in" id="asl">${[15,20,30,60].map(x=>`<option ${+A.slot===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label class="field c12"><span>${t("set_doctors")}</span><textarea class="in" id="sdocs" style="min-height:60px">${esc(S.settings.doctors.join("\n"))}</textarea></label></div></div>
    <div class="card"><div class="hd"><h3><span class="hi">${I("qr")}</span>${t("set_queue")}</h3></div><div class="bd form">
      <label class="field c6"><span>${t("set_consult_min")}</span><select class="in" id="qmin"><option value="0">${t("set_auto_min").replace("{m}",autoConsultMin())}</option>${[5,8,10,12,15,20,25,30,40,45].map(x=>`<option value="${x}" ${+S.settings.consultMin===x?"selected":""}>${x} min</option>`).join("")}</select></label>
      <label class="field c6"><span>${t("set_screen_names")}</span><select class="in" id="qnames"><option value="numbers">${t("set_names_numbers")}</option><option value="initials" ${S.settings.screenNames==="initials"?"selected":""}>${t("set_names_initials")}</option></select></label>
      <label class="field c12"><span>${t("set_queue_url")}</span><input class="in" id="qurl" type="url" placeholder="https://tbibi-tn.github.io/attente/" value="${esc(S.settings.queueUrl||"")}"></label>
      <p class="c12 muted" style="margin:-4px 0 0;font-size:12.5px">${t("set_queue_url_hint")}</p>
      <label class="chk c12" style="padding-left:0"><input type="checkbox" id="qauto" ${S.settings.autoTicket?"checked":""}>${t("set_auto_ticket")}</label>
      <div class="c12 row wrap"><button class="btn soft" data-act="openScreen">${I("tv")}${t("q_screen")}</button><button class="btn" data-act="qTest">${I("qr")}${t("set_queue_test")}</button></div>
    </div></div>
    <div class="card"><div class="hd"><h3><span class="hi">${I("lock")}</span>${t("set_security")}</h3><div class="r">${encrypted()?`<span class="pill green">${I("shield")}${t("sec_on")}</span>`:`<span class="pill amber">${I("alert")}${t("sec_off")}</span>`}</div></div><div class="bd">
      ${encrypted()?`<p class="muted" style="margin:0 0 12px">${t("sec_on_text")}</p>
       <div class="form"><label class="field c6"><span>${t("sec_autolock")}</span><select class="in" id="alk">${[0,5,10,15,30,60].map(x=>`<option value="${x}" ${+(S.settings.autolock??10)===x?"selected":""}>${x?x+" min":t("sec_never")}</option>`).join("")}</select></label>
       <div class="c6 row" style="align-self:end"><button class="btn" data-act="secLock">${I("lock")}${t("lock")}</button></div></div>
       <div class="row wrap mt"><button class="btn" data-act="secChange">${I("edit")}${t("sec_change")}</button><button class="btn ghost danger right" data-act="secOff">${t("sec_disable")}</button></div>`
      :`<p class="muted" style="margin:0 0 12px">${t("sec_off_text")}</p><button class="btn pri" data-act="secOn">${I("lock")}${t("sec_enable")}</button>`}
      ${cryptoOK()?"":`<div class="alert mt">${I("alert")}<div>${t("sec_unsupported")}</div></div>`}
    </div></div>
   </div>
   <div class="card" style="grid-column:1/-1"><div class="hd"><h3><span class="hi">${I("download")}</span>${t("set_backup")}</h3></div><div class="bd"><p class="muted" style="margin-top:0">${t("set_backup_hint")} — ${S.patients.length} ${t("nav_patients").toLowerCase()}, ${S.visits.length} ${t("k_consult").toLowerCase()}.</p>
    <div class="storebar" id="stor"></div>
    <div class="row wrap"><button class="btn pri" data-act="bkExport">${I("download")}${t("set_export")}</button><label class="btn">${I("upload")}${t("set_import")}<input type="file" id="bkfile" accept=".tbibi,.json,application/json" hidden></label><span class="right"></span><button class="btn" data-act="bkDemo">${t("set_reset")}</button><button class="btn danger" data-act="bkWipe">${I("trash")}${t("set_wipe")}</button></div>
    <div class="muted mt" style="font-size:12.5px">${t("shortcuts")} : <kbd>Ctrl K</kbd> / <kbd>/</kbd> ${t("sc_search")} · <kbd>Alt N</kbd> ${t("sc_new")} · <kbd>Ctrl S</kbd> ${t("save_visit")} · <kbd>Esc</kbd> ${t("close")}<span class="right" style="float:right">${APP} v${typeof APP_VERSION!=="undefined"?APP_VERSION:"dev"}</span></div></div></div>
  </div>`;
  const tarifs=JSON.parse(JSON.stringify(S.settings.tarifs));
  function drawT(){$("#ttb").innerHTML=tarifs.map((x,i)=>`<tr><td style="width:90px"><input class="in" data-ti="${i}" data-k="code" value="${esc(x.code)}" style="height:30px"></td><td><input class="in" data-ti="${i}" data-k="label" value="${esc(x.label)}" style="height:30px"></td><td style="width:110px"><input class="in num" data-ti="${i}" data-k="price" value="${x.price}" style="height:30px;text-align:right"></td><td style="width:44px"><button class="iconbtn" data-tr="${i}" style="width:30px;height:30px">${I("x")}</button></td></tr>`).join("");
    $$("[data-ti]").forEach(x=>x.oninput=()=>tarifs[+x.dataset.ti][x.dataset.k]=x.dataset.k==="price"?num(x.value):x.value);
    $$("[data-tr]").forEach(x=>x.onclick=()=>{tarifs.splice(+x.dataset.tr,1);drawT()})}
  drawT();$("#tadd").onclick=()=>{tarifs.push({code:"",label:"",price:0});drawT()};
  const collect=()=>{const g=id=>$("#"+id).value.trim();
    Object.assign(S.settings.doctor,{name:g("sn"),spe:g("ss"),addr:g("sa"),city:g("sc"),phone:g("sp"),email:g("se"),cnam:g("scn"),mf:g("smf"),hours:g("sh")});
    S.settings.tarifs=tarifs.filter(x=>x.code);S.settings.agenda={start:g("as")||"08:00",end:g("ae")||"18:00",slot:+g("asl")||30};
    S.settings.doctors=g("sdocs").split("\n").map(x=>x.trim()).filter(Boolean);if(!S.settings.doctors.length)S.settings.doctors=[S.settings.doctor.name];
    if($("#alk"))S.settings.autolock=+$("#alk").value;
    S.settings.doctor.autoStamp=$("#sauto").checked;
    S.settings.consultMin=+$("#qmin").value;S.settings.screenNames=$("#qnames").value;S.settings.queueUrl=$("#qurl").value.trim();S.settings.autoTicket=$("#qauto").checked;};
  ACT.openScreen=()=>openWaitingScreen();
  ACT.qTest=()=>{collect();save();const url=patientPageUrl(queueSnapshot(todayQueue().waiting[0]&&todayQueue().waiting[0].ticket));
    openModal(mh(t("set_queue_test"),"","qr")+`<div class="mb" style="text-align:center"><div style="width:220px;margin:0 auto">${qrSvg(url,{ecl:"L",border:2})}</div><p class="muted" style="font-size:12.5px;word-break:break-all;margin:12px 0 0">${esc(url.length>110?url.slice(0,110)+"…":url)}</p></div><div class="mf"><a class="btn pri" href="${esc(url)}" target="_blank" rel="noopener">${I("right")}${t("set_queue_open")}</a></div>`,{cls:"sm"})};
  /* every change is saved right away */
  let asvT;pg.addEventListener("change",e=>{if(e.target.type==="file"||e.target.id==="bkfile")return;collect();save();const a=$("#asv");if(a){a.classList.add("on");clearTimeout(asvT);asvT=setTimeout(()=>a.classList.remove("on"),1800)}});
  const pickImg=(inputId,key,maxW,maxH)=>{$("#"+inputId).onchange=async e=>{const f=e.target.files[0];if(!f)return;
    if(f.size>8*1024*1024){toast(t("set_img_big"),true);return}
    try{S.settings.doctor[key]=await shrinkImage(f,maxW,maxH);save();toast(t("saved"));render()}catch(err){toast(t("set_img_err"),true)}}};
  pickImg("lgf","logo",600,240);pickImg("stf","stamp",700,420);
  $("#lgx")&&($("#lgx").onclick=()=>{delete S.settings.doctor.logo;save();render()});
  $("#stx")&&($("#stx").onclick=()=>{delete S.settings.doctor.stamp;save();render()});
  storageUsage().then(async u=>{const el=$("#stor");if(!el)return;const pers=await storagePersisted();
    const mb=x=>(x/1048576).toFixed(x<10485760?1:0);
    el.innerHTML=u?`<div class="row" style="justify-content:space-between;font-size:12.5px"><span>${I("download").replace("<svg","<svg style='width:14px;color:var(--pri)'")} ${t("store_used").replace("{u}",mb(u.used)).replace("{q}",(u.quota/1073741824).toFixed(1))}</span><span class="pill ${pers?"green":"amber"}">${pers?t("store_persist_on"):t("store_persist_off")}</span></div><div class="pwbar" style="--w:${Math.max(1,Math.min(100,u.used/u.quota*100))}%;margin-top:6px" data-s="4"></div>`:"";});
  ACT.setSave=()=>{collect();save();toast(t("set_saved"));render()};
  ACT.setPreview=()=>{collect();const p=S.patients[0];pdfRx(p,{date:todayISO(),rx:S.templates[0]?S.templates[0].rx:[]})};
  ACT.bkExport=()=>openBackupExport();
  $("#bkfile").onchange=e=>{const file=e.target.files[0];if(!file)return;const rd=new FileReader();rd.onload=()=>importBackupText(rd.result);rd.readAsText(file);e.target.value=""};
  ACT.secOn=()=>openEnableEncryption();ACT.secChange=()=>openChangePassword();ACT.secLock=()=>lockNow();
  ACT.secOff=()=>askPassword(t("sec_disable"),t("sec_disable_text"),async pw=>{if(!await verifyPassword(pw))return false;await disableEncryption();toast(t("sec_disabled"));render()});
  $("#alk")&&($("#alk").onchange=e=>{S.settings.autolock=+e.target.value;save()});
  ACT.bkDemo=()=>confirmBox(t("set_reset")+" ?",()=>{S=buildDemo();save();render()});
  ACT.bkWipe=()=>confirmBox(t("wipe_confirm"),()=>{const st=S.settings;S={version:1,settings:st,patients:[],visits:[],meds:S.meds,templates:S.templates,rdv:[],payments:[]};save();render()},{yes:t("set_wipe")});
}

/* resize an uploaded image (logo, stamp) so the data stays small */
function shrinkImage(file,maxW,maxH){
  return new Promise((res,rej)=>{const rd=new FileReader();rd.onerror=rej;rd.onload=()=>{const img=new Image();img.onerror=rej;img.onload=()=>{
    const k=Math.min(1,maxW/img.width,maxH/img.height),w=Math.round(img.width*k),h=Math.round(img.height*k);
    const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(img,0,0,w,h);
    res(file.type==="image/jpeg"?c.toDataURL("image/jpeg",.88):c.toDataURL("image/png"))};img.src=rd.result};rd.readAsDataURL(file)});
}
