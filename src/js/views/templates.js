/* =========================================================
   TEMPLATES
   ========================================================= */
function vTemplates(pg){
  pg.innerHTML=`<div class="ph"><div><h1>${t("nav_templates")}</h1><div class="sub">${t("tpl_sub")}</div></div><div class="actions"><button class="btn pri" data-act="tplNew">${I("plus")}${t("tpl_new")}</button></div></div>
  <div class="grid g3">${S.templates.map(tp=>`<div class="card" style="cursor:pointer" data-tp="${tp.id}"><div class="hd"><h3><span class="hi">${I("meds")}</span>${esc(tp.name)}</h3><span class="pill right">${tp.rx.length} ${t("tpl_lines")}</span></div><div class="bd">${tp.rx.map((r,i)=>`<div style="padding:3px 0;font-size:13px"><b>${i+1}. ${esc(r.nom)}</b><div class="muted" style="font-size:12px">${esc(r.posologie)}${r.duree?" · "+esc(r.duree):""}</div></div>`).join("")}</div></div>`).join("")||`<div class="card" style="grid-column:1/-1">${emptyState("rx",t("no_data"),t("tpl_sub"))}</div>`}</div>`;
  $$("[data-tp]").forEach(c=>c.onclick=()=>openTplForm(c.dataset.tp));
  ACT.tplNew=()=>openTplForm();
}
function openTplForm(id){
  const ex=id?S.templates.find(x=>x.id===id):null;const tp=ex?JSON.parse(JSON.stringify(ex)):{name:"",rx:[]};
  const m=openModal(mh(ex?esc(ex.name):t("tpl_new"))+`<div class="mb"><label class="field"><span>${t("template_name")}</span><input class="in" id="tn" value="${esc(tp.name)}"></label><div class="mt"><input class="in" id="tm" placeholder="${t("add_med")}"></div><div id="tl" class="mt"></div></div><div class="mf">${ex?`<button class="btn danger" id="tdel" style="margin-right:auto">${I("trash")}</button>`:""}<button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="tok">${I("check")}${t("save")}</button></div>`,{cls:"wide"});
  function draw(){const b=m.querySelector("#tl");b.innerHTML=tp.rx.map((r,i)=>`<div class="rx-line" style="grid-template-columns:24px minmax(0,1.4fr) minmax(0,1.6fr) 70px minmax(0,1fr) 34px"><div class="n">${i+1}</div><div class="nm">${esc(r.nom)}</div><input class="in" data-i="${i}" data-k="posologie" value="${esc(r.posologie)}"><input class="in num" data-i="${i}" data-k="qte" value="${r.qte||1}"><input class="in" data-i="${i}" data-k="duree" value="${esc(r.duree||"")}" placeholder="${t("duree")}"><button class="iconbtn" data-rm="${i}">${I("x")}</button></div>`).join("")||`<div class="empty">${t("rx_empty")}</div>`;
    b.querySelectorAll("[data-i]").forEach(x=>x.oninput=()=>tp.rx[+x.dataset.i][x.dataset.k]=x.dataset.k==="qte"?(+x.value||1):x.value);
    b.querySelectorAll("[data-rm]").forEach(x=>x.onclick=()=>{tp.rx.splice(+x.dataset.rm,1);draw()})}
  attachAC(m.querySelector("#tm"),{source:medSource,render:medRender,onPick:(it,inp)=>{inp.value="";tp.rx.push({medId:it.m.id,nom:it.m.nom,posologie:(it.m.posologies||[])[0]||"",qte:1,duree:""});draw()}});
  draw();
  m.querySelector("#tok").onclick=()=>{tp.name=m.querySelector("#tn").value.trim();if(!tp.name)return;if(ex)Object.assign(ex,tp);else S.templates.push({id:uid("t"),...tp});save();closeModal();toast(t("saved"));render()};
  ex&&(m.querySelector("#tdel").onclick=()=>confirmBox(t("confirm_delete"),()=>{S.templates=S.templates.filter(x=>x.id!==ex.id);save();closeModal();render()}));
}
