/* =========================================================
   PATIENTS LIST
   ========================================================= */
function vPatients(pg){
  const F=UI.pFilter;
  pg.innerHTML=`
  <div class="ph"><div><h1>${t("nav_patients")}</h1><div class="sub"><span id="pcount"></span></div></div>
   <div class="actions"><button class="btn" data-act="pcsv">${I("csv")}${t("export_csv")}</button><button class="btn pri" data-act="newPatient">${I("userplus")}${t("new_patient")}</button></div></div>
  <div class="card"><div class="toolbar"><div class="inicon">${I("search")}<input class="in" id="pq" value="${esc(F.q)}" placeholder="${t("search_in_list")}"></div>
   <div class="chips" id="pchips">${[["all","filter_all"],["M","male"],["F","female"],["debt","filter_debt"],["cnam","filter_cnam"],["chronic","filter_chronic"]].map(c=>`<button class="chip ${F.chip===c[0]?"on":""}" data-c="${c[0]}">${t(c[1])}</button>`).join("")}</div></div>
   <div class="tablewrap"><table class="t"><thead><tr>${[["dossier","col_dossier"],["nom","col_nom"],["prenom","col_prenom"],["age","col_age"],["tel","col_tel"],["last","col_last"],["count","visits_n"],["solde","col_solde"]].map(c=>`<th class="sort ${["age","count","solde"].includes(c[0])?"num":""}" data-sort="${c[0]}">${t(c[1])}${F.sort===c[0]?(F.dir>0?" ↑":" ↓"):""}</th>`).join("")}<th class="num" style="width:56px"><span class="sr">${t("actions")}</span></th></tr></thead><tbody id="pbody"></tbody></table></div>
   <div id="pmore"></div></div>`;
  const sm=soldeMap(),lv=lastVisitMap();
  function draw(){
    const tk=norm(F.q).split(/\s+/).filter(Boolean);
    let arr=S.patients.filter(p=>{
      if(tk.length){const h=norm([p.nom,p.prenom,p.nomJF,p.dossier,p.tel,p.tel2,p.cin,p.cnam.idu,p.ville].join(" "));if(!tk.every(x=>h.includes(x)))return false}
      if(F.chip==="M"||F.chip==="F")return p.sexe===F.chip;
      if(F.chip==="debt")return(sm[p.id]||0)>0.0005;
      if(F.chip==="cnam")return p.cnam.regime&&p.cnam.regime!=="none";
      if(F.chip==="chronic")return!!p.cnam.apci;
      return true});
    const key={dossier:p=>+p.dossier||0,nom:p=>norm(p.nom+" "+p.prenom),prenom:p=>norm(p.prenom),age:p=>ageY(p.dob)||0,tel:p=>p.tel||"",last:p=>lv.last[p.id]||"",count:p=>lv.count[p.id]||0,solde:p=>sm[p.id]||0}[F.sort];
    arr.sort((a,b)=>{const x=key(a),y=key(b);return(x>y?1:x<y?-1:0)*F.dir});
    $("#pcount").textContent=arr.length+" / "+S.patients.length+" "+t("patients_sub");
    $("#pbody").innerHTML=arr.slice(0,F.limit).map(p=>{const s=sm[p.id]||0;return`<tr class="click" data-p="${p.id}"><td class="num">${hl(p.dossier,tk)}</td><td><div class="row"><div class="avatar" style="width:28px;height:28px;font-size:11px">${initials(p)}</div><b>${hl((p.titre?p.titre+" ":"")+p.nom,tk)}</b>${allergyList(p).length?`<span class="pill red" title="${t("allergy_alert")}">⚠</span>`:""}${p.cnam.apci?`<span class="pill" title="${t("chronic")}">APCI</span>`:""}</div></td><td>${hl(p.prenom,tk)}</td><td class="num">${ageStr(p.dob)}</td><td class="num">${hl(p.tel||"",tk)}</td><td class="num">${fmtD(lv.last[p.id])}</td><td class="num">${lv.count[p.id]||0}</td><td class="num ${s>0.0005?"red b":"muted"}">${money(s)}</td><td class="num"><button class="iconbtn sm ghost rowdel" data-del="${p.id}" title="${t("del_patient")}" aria-label="${t("del_patient")} ${esc(shortName(p))}">${I("trash")}</button></td></tr>`}).join("")||`<tr><td colspan="9" class="empty">${t("search_none")}</td></tr>`;
    $("#pmore").innerHTML=arr.length>F.limit?`<div style="padding:12px;text-align:center"><button class="btn sm" id="pm">+ ${arr.length-F.limit}</button></div>`:"";
    $("#pm")&&($("#pm").onclick=()=>{F.limit+=300;draw()});
    $$("#pbody tr[data-p]").forEach(tr=>tr.onclick=e=>{if(e.target.closest("[data-del]"))return;go("patient/"+tr.dataset.p)});
    $$("#pbody [data-del]").forEach(b=>b.onclick=e=>{e.stopPropagation();deletePatient(b.dataset.del)});
  }
  $("#pq").oninput=e=>{F.q=e.target.value;F.limit=150;draw()};
  $$("#pchips .chip").forEach(b=>b.onclick=()=>{F.chip=b.dataset.c;$$("#pchips .chip").forEach(x=>x.classList.toggle("on",x===b));draw()});
  $$("th[data-sort]").forEach(th=>th.onclick=()=>{const s=th.dataset.sort;if(F.sort===s)F.dir*=-1;else{F.sort=s;F.dir=["last","count","solde"].includes(s)?-1:1}vPatients(pg)});
  ACT.pcsv=()=>{const head=["Dossier","Titre","Nom","Prénom","Sexe","Né le","Téléphone","CIN","Ville","Caisse","Identifiant","APCI","Allergies","Dernière visite","Solde"];
    downloadCSV("patients.csv",[head,...S.patients.map(p=>[p.dossier,p.titre,p.nom,p.prenom,p.sexe,fmtD(p.dob),p.tel,p.cin,p.ville,p.cnam.caisse,p.cnam.idu,p.cnam.apci,allergyList(p).join(", "),fmtD(lv.last[p.id]),(sm[p.id]||0).toFixed(3)])])};
  draw();setTimeout(()=>{const i=$("#pq");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},0);
}
