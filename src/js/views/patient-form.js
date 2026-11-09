/* ---------- patient form ---------- */
function openPatientForm(id,{prefill={},onSaved}={}){
  const ex=id?P(id):null;
  const p=ex?JSON.parse(JSON.stringify(ex)):Object.assign({titre:"Mr.",nom:"",prenom:"",nomJF:"",sexe:"M",dob:"",etat:"cel",enfants:0,cin:"",adresse:"",ville:"",tel:"",tel2:"",profession:"",adrPar:"",groupe:"",allergies:[],cnam:{caisse:"CNAM",regime:"public",qualite:"assure",idu:"",rang:0,apci:""},ant:{},remarques:""},prefill);
  const sel=(name,val,opts)=>`<select class="in" name="${name}">${opts.map(o=>`<option value="${esc(o[0])}" ${String(val)===String(o[0])?"selected":""}>${esc(o[1])}</option>`).join("")}</select>`;
  const fld=(c,lab,inner)=>`<label class="field ${c}"><span>${t(lab)}</span>${inner}</label>`;
  const inp=(name,val,type="text",extra="")=>`<input class="in" name="${name}" type="${type}" value="${esc(val||"")}" ${extra}>`;
  const sec=(k,ic)=>`<div class="fsec"><span class="hi">${I(ic)}</span>${t(k)}</div>`;
  const m=openModal(mh(ex?fullName(ex):t("new_patient"),ex?`<span class="pill">${t("dossier")} ${esc(ex.dossier)}</span>`:"",ex?"edit":"userplus")+`<form class="mb form" id="pf" autocomplete="off">
    ${sec("p_identity","user")}
    ${fld("c2","f_titre",sel("titre",p.titre,[["Mr.","Mr."],["Mme.","Mme."],["Mlle.","Mlle."],["Enf.","Enf."]]))}
    ${fld("c4","f_nom",inp("nom",p.nom,"text","autofocus required"))}
    ${fld("c4","f_prenom",inp("prenom",p.prenom,"text","required"))}
    ${fld("c2","f_sexe",sel("sexe",p.sexe,[["M","M"],["F","F"]]))}
    ${fld("c3","f_dob",inp("dob",p.dob,"date"))}
    ${fld("c3","f_etat",sel("etat",p.etat,[["cel",t("et_cel")],["mar",t("et_mar")],["div",t("et_div")],["veuf",t("et_veuf")]]))}
    ${fld("c2","f_enfants",inp("enfants",p.enfants,"number","min=0"))}
    ${fld("c4","f_nomjf",inp("nomJF",p.nomJF))}
    ${sec("p_contact","phone")}
    ${fld("c3","f_tel",inp("tel",p.tel,"tel"))}
    ${fld("c3","f_tel2",inp("tel2",p.tel2,"tel"))}
    ${fld("c3","f_cin",inp("cin",p.cin))}
    ${fld("c3","f_ville",inp("ville",p.ville))}
    ${fld("c6","f_adresse",inp("adresse",p.adresse))}
    ${fld("c3","f_profession",inp("profession",p.profession))}
    ${fld("c3","f_adrpar",inp("adrPar",p.adrPar))}
    ${sec("p_cnam","shield")}
    ${fld("c3","f_caisse",sel("caisse",p.cnam.caisse,[["",t("none")],["CNAM","CNAM"],["CNRPS","CNRPS"],["CNSS","CNSS"],["Assurance privée","Assurance privée"]]))}
    ${fld("c3","f_regime",sel("regime",p.cnam.regime,[["public",t("r_public")],["prive",t("r_prive")],["remb",t("r_remb")],["none",t("r_none")]]))}
    ${fld("c3","f_qualite",sel("qualite",p.cnam.qualite,[["assure",t("q_assure")],["conjoint",t("q_conjoint")],["enfant",t("q_enfant")],["ascendant",t("q_ascendant")]]))}
    ${fld("c3","f_rang",inp("rang",p.cnam.rang,"number","min=0"))}
    ${fld("c4","f_idu",inp("idu",p.cnam.idu))}
    ${fld("c8","f_apci",inp("apci",p.cnam.apci))}
    ${sec("p_medical","heart")}
    ${fld("c2","f_groupe",sel("groupe",p.groupe,[["","—"],["A+","A+"],["A-","A-"],["B+","B+"],["B-","B-"],["AB+","AB+"],["AB-","AB-"],["O+","O+"],["O-","O-"]]))}
    ${fld("c10","f_allergies",inp("allergies",(p.allergies||[]).join(", "),"text",`placeholder="${t("f_allergies_ph")}"`))}
    ${fld("c12","f_remarques",`<textarea class="in" name="remarques" style="min-height:56px">${esc(p.remarques)}</textarea>`)}
  </form><div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="pfs">${I("check")}${t("save")}</button></div>`,{cls:"wide"});
  const f=m.querySelector("#pf");
  f.titre.onchange=()=>{if(f.titre.value==="Mme."||f.titre.value==="Mlle.")f.sexe.value="F";else if(f.titre.value==="Mr.")f.sexe.value="M"};
  const submit=()=>{
    const g=n=>f[n].value.trim();
    if(!g("nom")||!g("prenom")){toast(t("required"),true);return}
    Object.assign(p,{titre:g("titre"),nom:g("nom").replace(/\b\w/g,c=>c.toUpperCase()),prenom:g("prenom").replace(/(^|\s|-)\S/g,c=>c.toUpperCase()),nomJF:g("nomJF"),sexe:g("sexe"),dob:g("dob"),etat:g("etat"),enfants:+g("enfants")||0,cin:g("cin"),adresse:g("adresse"),ville:g("ville"),tel:g("tel"),tel2:g("tel2"),profession:g("profession"),adrPar:g("adrPar"),groupe:g("groupe"),allergies:g("allergies").split(",").map(x=>x.trim()).filter(Boolean),remarques:g("remarques")});
    p.cnam={caisse:g("caisse"),regime:g("regime"),qualite:g("qualite"),idu:g("idu"),rang:+g("rang")||0,apci:g("apci")};
    const commit=()=>{
      if(ex){Object.assign(ex,p)}else{p.id=uid("p");p.dossier=nextDossier();p.createdAt=todayISO();S.patients.push(p)}
      save();closeModal();toast(t("saved"));
      if(onSaved)onSaved(ex||p);else if(!ex)go("patient/"+p.id);else render();
    };
    if(!ex){
      const n1=norm(p.nom),n2=norm(p.prenom);
      const dups=S.patients.filter(x=>(norm(x.nom)===n1&&norm(x.prenom)===n2)||(p.tel&&x.tel===p.tel)||(p.cin&&x.cin===p.cin)||(p.dob&&x.dob===p.dob&&norm(x.nom)===n1));
      if(dups.length){
        openModal(mh(t("dup_title"))+`<div class="mb"><p class="muted" style="margin-top:0">${t("dup_text")}</p>${dups.slice(0,5).map(d=>`<div class="q-item" style="border:1px solid var(--line);border-radius:9px;margin-bottom:6px;cursor:pointer" data-dup="${d.id}"><div class="avatar">${initials(d)}</div><div class="tx"><b>${esc(fullName(d))}</b><small>${t("dossier")} ${esc(d.dossier)} · ${fmtD(d.dob)} · ${esc(d.tel||"")}</small></div><span class="btn xs">${t("open_file")}</span></div>`).join("")}</div><div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="dupok">${t("create_anyway")}</button></div>`,{cls:"sm",onMount:mm=>{
          mm.querySelector("#dupok").onclick=()=>{closeModal();commit()};
          mm.querySelectorAll("[data-dup]").forEach(el=>el.onclick=()=>{closeModal();closeModal();const d=P(el.dataset.dup);if(onSaved)onSaved(d);else go("patient/"+d.id)});
        }});return}
    }
    commit();
  };
  m.querySelector("#pfs").onclick=submit;
  f.addEventListener("submit",e=>{e.preventDefault();submit()});
  f.addEventListener("keydown",e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey))submit()});
}
function openPayment(p){
  const s=solde(p.id);
  openModal(mh(t("encaisser")+" — "+esc(shortName(p)),"","cash")+`<div class="mb form"><label class="field c6"><span>${t("amount")} (${t("tnd")})</span><input class="in num" id="pa" value="${s.toFixed(3)}" inputmode="decimal"></label><label class="field c6"><span>${t("date")}</span><input class="in" type="date" id="pd" value="${todayISO()}"></label><div class="c12 muted">${t("solde_due")} : <b class="red">${money(s)} ${t("tnd")}</b></div></div><div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="pok">${I("cash")}${t("encaisser")}</button></div>`,{cls:"sm",onMount:m=>{
    m.querySelector("#pok").onclick=()=>{const a=num(m.querySelector("#pa").value);if(a<=0)return;S.payments.push({id:uid("pay"),patientId:p.id,date:m.querySelector("#pd").value||todayISO(),amount:a});save();closeModal();toast(t("payment_ok"));render()}}});
}
