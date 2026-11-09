/* =========================================================
   MEDICATIONS
   ========================================================= */
function vMeds(pg){
  const use={};S.visits.forEach(v=>(v.rx||[]).forEach(r=>use[r.medId]=(use[r.medId]||0)+1));
  pg.innerHTML=`<div class="ph"><div><h1>${t("nav_meds")}</h1><div class="sub">${S.meds.length} · ${t("meds_sub")}</div></div><div class="actions"><button class="btn pri" data-act="medNew">${I("plus")}${t("add")}</button></div></div>
  <div class="card"><div class="toolbar"><div class="inicon">${I("search")}<input class="in" id="mq" placeholder="${t("m_nom")}, ${t("m_dci")}, ${t("m_classe")}…"></div></div>
  <div class="tablewrap"><table class="t"><thead><tr><th>${t("m_nom")}</th><th>${t("m_dci")}</th><th>${t("m_classe")}</th><th class="hide-m">${t("m_forme")}</th><th class="hide-m">${t("posologie")}</th><th class="num">${t("m_pvp")}</th><th>${t("m_remb")}</th><th class="num">℞</th></tr></thead><tbody id="mb"></tbody></table></div></div>`;
  function draw(q){const tk=norm(q).split(/\s+/).filter(Boolean);
    $("#mb").innerHTML=S.meds.filter(m=>tk.every(x=>norm(m.nom+" "+m.dci+" "+m.classe+" "+m.forme).includes(x))).sort((a,b)=>(use[b.id]||0)-(use[a.id]||0)).map(m=>`<tr class="click" data-m="${m.id}"><td class="b">${hl(m.nom,tk)}</td><td>${hl(m.dci,tk)}</td><td class="muted">${hl(m.classe,tk)}</td><td class="hide-m">${esc(m.forme)}</td><td class="hide-m muted" style="font-size:12.5px">${esc((m.posologies||[])[0]||"")}</td><td class="num">${money(m.pvp)}</td><td>${m.remb?`<span class="pill green">✓</span>`:`<span class="pill">—</span>`}</td><td class="num">${use[m.id]||0}</td></tr>`).join("")||`<tr><td colspan="8" class="empty">${t("search_none")}</td></tr>`;
    $$("#mb tr[data-m]").forEach(tr=>tr.onclick=()=>openMedForm(tr.dataset.m))}
  $("#mq").oninput=e=>draw(e.target.value);draw("");
  ACT.medNew=()=>openMedForm();
}
function openMedForm(id){
  const ex=id?S.meds.find(m=>m.id===id):null;const m0=ex||{nom:"",dci:"",classe:"",forme:"Comprimé",pvp:0,remb:true,posologies:[],ci:"",garde:""};
  const m=openModal(mh(ex?esc(ex.nom):t("add"))+`<div class="mb form">
   <label class="field c6"><span>${t("m_nom")}</span><input class="in" id="mn" value="${esc(m0.nom)}"></label>
   <label class="field c6"><span>${t("m_dci")}</span><input class="in" id="md" value="${esc(m0.dci)}"></label>
   <label class="field c5"><span>${t("m_classe")}</span><input class="in" id="mc" value="${esc(m0.classe)}"></label>
   <label class="field c3"><span>${t("m_forme")}</span><input class="in" id="mf" value="${esc(m0.forme)}" list="mfl"><datalist id="mfl">${["Comprimé","Gélule","Sirop","Sachet","Crème","Pommade","Collyre","Ampoule buvable","Injectable","Suppositoire","Inhalateur","Suspension"].map(x=>`<option>${x}</option>`).join("")}</datalist></label>
   <label class="field c2"><span>${t("m_pvp")}</span><input class="in num" id="mp" value="${m0.pvp}"></label>
   <label class="field c2"><span>${t("m_remb")}</span><select class="in" id="mr"><option value="1" ${m0.remb?"selected":""}>${t("yes")}</option><option value="0" ${!m0.remb?"selected":""}>${t("no")}</option></select></label>
   <label class="field c12"><span>${t("m_poso")}</span><textarea class="in" id="mpo">${esc((m0.posologies||[]).join("\n"))}</textarea></label>
   <label class="field c6"><span>${t("m_ci")}</span><textarea class="in" id="mci">${esc(m0.ci)}</textarea></label>
   <label class="field c6"><span>${t("m_garde")}</span><textarea class="in" id="mg">${esc(m0.garde)}</textarea></label>
  </div><div class="mf">${ex?`<button class="btn danger" id="mdel" style="margin-right:auto">${I("trash")}</button>`:""}<button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="mok">${I("check")}${t("save")}</button></div>`);
  m.querySelector("#mok").onclick=()=>{const g=i=>m.querySelector(i).value.trim();if(!g("#mn"))return;
    const o={nom:g("#mn"),dci:g("#md"),classe:g("#mc"),forme:g("#mf"),pvp:num(g("#mp")),remb:g("#mr")==="1",posologies:g("#mpo").split("\n").map(x=>x.trim()).filter(Boolean),ci:g("#mci"),garde:g("#mg")};
    if(ex)Object.assign(ex,o);else S.meds.push({id:uid("m"),...o});save();closeModal();toast(t("saved"));if(UI.route[0]==="meds")render()};
  ex&&(m.querySelector("#mdel").onclick=()=>confirmBox(t("confirm_delete"),()=>{S.meds=S.meds.filter(x=>x.id!==ex.id);save();closeModal();render()}));
}
