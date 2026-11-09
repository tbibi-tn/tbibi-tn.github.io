/* ---------- certificates modal ---------- */
function openCert(type,p,d){
  const today=todayISO();
  const F={
    repos:`<label class="field c4"><span>${t("cert_days")}</span><input class="in" id="cd" type="number" min="1" value="3"></label><label class="field c8"><span>${t("cert_from")}</span><input class="in" id="cf" type="date" value="${today}"></label>`,
    med:`<label class="field c12"><span>${t("cert_text")}</span><textarea class="in" id="ct" style="min-height:120px">certifie avoir examiné ce jour ${fullName(p)} et constaté : </textarea></label>`,
    aptitude:`<label class="field c8"><span>${t("cert_sport")}</span><input class="in" id="cs" value="Football"></label><label class="field c4"><span>&nbsp;</span><select class="in" id="cc"><option>en compétition</option><option>en loisir</option><option>scolaire</option></select></label>`,
    bonne:"",
    presence:`<label class="field c6"><span>${t("rdv_time")}</span><input class="in" id="ch1" type="time" value="${d.time||nowHM()}"></label><label class="field c6"><span>→</span><input class="in" id="ch2" type="time" value="${nowHM()}"></label>`,
    accomp:`<label class="field c12"><span>${t("cert_accomp_name")}</span><input class="in" id="ca"></label>`,
    permis:`<label class="field c12"><span>Catégorie</span><select class="in" id="cp"><option>B</option><option>A</option><option>A1</option><option>C</option><option>D</option><option>B+E</option><option>C+E</option></select></label>`,
    lettre:`<label class="field c6"><span>${t("lettre_to")}</span><input class="in" id="lt" placeholder="Dr …"></label><label class="field c6"><span>${t("lettre_spe")}</span><input class="in" id="ls" placeholder="Cardiologue"></label><label class="field c12"><span>${t("lettre_body")}</span><textarea class="in" id="lb" style="min-height:110px">Je vous adresse ${fullName(p)}, âgé(e) de ${ageStr(p.dob)}, pour avis et prise en charge.\n\nMotif : ${d.motif||""}\nDiagnostic évoqué : ${d.diagnostic||""}</textarea></label>`,
  };
  const names={repos:"doc_cert_repos",med:"doc_cert_med",aptitude:"doc_aptitude",bonne:"doc_bonne_sante",presence:"doc_presence",accomp:"doc_accomp",permis:"doc_permis",lettre:"doc_lettre"};
  openModal(mh(t(names[type]),"","cert")+`<div class="mb form">${F[type]||""}<div class="c12 muted" style="font-size:12.5px">${esc(fullName(p))} · ${fmtD(d.date)}</div></div><div class="mf"><button class="btn" data-close>${t("cancel")}</button><button class="btn pri" id="cgo">${I("pdf")}${t("generate")}</button></div>`,{cls:"sm",onMount:m=>{
    const g=id=>{const x=m.querySelector("#"+id);return x?x.value:""};
    m.querySelector("#cgo").onclick=()=>{pdfCert(type,p,d,{days:g("cd"),from:g("cf"),text:g("ct"),sport:g("cs"),cadre:g("cc"),h1:g("ch1"),h2:g("ch2"),acc:g("ca"),cat:g("cp"),to:g("lt"),spe:g("ls"),body:g("lb")});closeModal()};
  }});
}
