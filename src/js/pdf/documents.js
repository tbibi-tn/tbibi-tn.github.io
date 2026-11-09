/* =========================================================
   PDF (print engine) — documents always printed in French
   ========================================================= */
const PDF_LOGO=`<svg viewBox="0 0 24 24" width="24" height="24"><path d="M9.2 3.5h5.6v5.7h5.7v5.6h-5.7v5.7H9.2v-5.7H3.5V9.2h5.7z" fill="#fff"/><path d="M6 12h3l1.4-2.4L13 14.6l1.4-2.6H18" stroke="#0f7b5f" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function printDoc(title,inner,{size="A5",filename,kicker}={}){
  const D=S.settings.doctor,A5=size==="A5",pad=A5?"11mm":"16mm";
  const css=`@page{size:${size} portrait;margin:0}
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  html,body{margin:0;padding:0}
  body{font-family:"IBM Plex Sans","Segoe UI",Arial,sans-serif;color:#13221d;font-size:${A5?"11px":"11.5px"};line-height:1.5}
  .sheet{position:relative;min-height:${A5?"209.5mm":"296.5mm"};display:flex;flex-direction:column;padding:0 ${pad};overflow:hidden}
  .sheet+.sheet{break-before:page;page-break-before:always}
  .pg{text-align:right;color:#5c7a70;font-size:.85em;margin:3mm 0 0}
  .logo.img{background:none;width:auto;max-width:${A5?"34mm":"42mm"}}.logo.img img{max-height:${A5?"14mm":"17mm"};max-width:100%;display:block}
  .sig .box{position:relative}.sig .box img{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);max-height:80%;max-width:85%;mix-blend-mode:multiply}
  .band{height:${A5?"5mm":"6mm"};margin:0 -${pad};background:#0f7b5f;position:relative}
  .band:after{content:"";position:absolute;left:0;right:0;bottom:-1.6mm;height:1.6mm;background:#6ee7b7}
  .sheet>.wm{position:absolute;left:50%;top:54%;width:${A5?"95mm":"130mm"};height:${A5?"95mm":"130mm"};transform:translate(-50%,-50%);opacity:.032;pointer-events:none;z-index:0}
  .sheet>*{position:relative;z-index:1}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:${A5?"7mm":"9mm"} 0 ${A5?"4mm":"5mm"};border-bottom:1px solid #cfe3da}
  .id{display:flex;gap:11px;align-items:center}
  .logo{width:${A5?"38px":"44px"};height:${A5?"38px":"44px"};border-radius:10px;background:#0f7b5f;display:flex;align-items:center;justify-content:center;flex:none}
  .dn{font-size:${A5?"17px":"20px"};font-weight:700;letter-spacing:-.3px;color:#0d2a21;line-height:1.15}
  .sp{color:#0f7b5f;font-weight:600;font-size:${A5?"11.5px":"12.5px"}}
  .cd{color:#62736d;font-size:.88em}
  .ra{text-align:right;font-size:.9em;color:#3e544c;line-height:1.55}
  .ra b{color:#0d2a21}
  .ttl{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:${A5?"6mm 0 3.5mm":"8mm 0 4mm"}}
  .ttl h1{margin:0;font-size:${A5?"21px":"24px"};color:#0f7b5f;letter-spacing:-.4px;font-weight:700;line-height:1}
  .ttl .k{font-size:.9em;color:#62736d;margin-bottom:3px}
  .ttl .rxs{font-family:Georgia,serif;font-size:${A5?"34px":"40px"};line-height:.8;color:#0f7b5f;font-style:italic}
  .ttl .dt{text-align:right;color:#3e544c;font-size:.95em}
  .pt{display:flex;flex-wrap:wrap;gap:4px 22px;background:#eef7f3;border-left:3px solid #0f7b5f;border-radius:0 7px 7px 0;padding:7px 12px;margin-bottom:${A5?"5mm":"6mm"}}
  .pt div{min-width:0}.pt .l{font-size:.78em;color:#5c7a70}.pt .v{font-weight:600;color:#0d2a21}
  .pt .al{color:#b4342a}
  .rx{list-style:none;margin:0;padding:0}
  .rx li{display:grid;grid-template-columns:22px 1fr;gap:9px;padding:${A5?"6px":"8px"} 0;border-bottom:1px solid #e3ece8;page-break-inside:avoid}
  .rx .n{width:20px;height:20px;border-radius:50%;background:#0f7b5f;color:#fff;font-weight:700;font-size:10px;display:flex;align-items:center;justify-content:center;margin-top:1px}
  .rx .m{font-weight:700;font-size:1.1em;color:#0d2a21}
  .rx .p{margin-top:1px}
  .rx .tg{display:inline-block;margin:3px 5px 0 0;font-size:.82em;color:#0b6a51;background:#e3f2ec;border-radius:10px;padding:0 7px}
  .ex{columns:2;column-gap:14px;list-style:none;margin:0;padding:0}
  .ex li{padding:4px 0 4px 16px;position:relative;break-inside:avoid;font-weight:600}
  .ex li:before{content:"";position:absolute;left:0;top:8px;width:8px;height:8px;border:1.5px solid #0f7b5f;border-radius:2px}
  .lead{font-size:1.1em;line-height:1.85;text-align:justify;margin:0 0 10px}
  p{margin:0 0 8px}
  table{width:100%;border-collapse:collapse;font-size:.95em}
  th{background:#0f7b5f;color:#fff;font-weight:600;text-align:left;padding:6px 7px;font-size:.88em}
  th:first-child{border-radius:6px 0 0 0}th:last-child{border-radius:0 6px 0 0}
  td{padding:5px 7px;border-bottom:1px solid #e3ece8}
  tbody tr:nth-child(even) td{background:#f5faf8}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  tfoot td{font-weight:700;background:#e3f2ec;color:#0b6a51;border-bottom:0}
  h3{font-size:12px;color:#0f7b5f;margin:7mm 0 3mm;padding-bottom:3px;border-bottom:1.5px solid #cfe3da}
  .kv{display:grid;grid-template-columns:${A5?"110px":"160px"} 1fr;gap:3px 12px}.kv b{color:#5c7a70;font-weight:500}
  .sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:5mm}
  .sum div{background:#eef7f3;border-radius:7px;padding:7px 10px}.sum .l{font-size:.8em;color:#5c7a70}.sum .v{font-size:1.2em;font-weight:700;color:#0d2a21}
  .sig{margin-top:auto;padding-top:${A5?"7mm":"10mm"};display:flex;justify-content:space-between;align-items:flex-end;gap:12px;page-break-inside:avoid}
  .sig .pl{color:#3e544c}
  .sig .box{width:52%;height:${A5?"25mm":"30mm"};border:1.5px dashed #9cc7b6;border-radius:9px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px;color:#5c7a70;font-size:.85em}
  .sig+.foot{margin-top:${A5?"5mm":"7mm"}}
  .foot{margin:auto -${pad} 0;padding:${A5?"2.6mm":"3.2mm"} ${pad};background:#0d2a21;color:#c9ddd5;font-size:.82em;display:flex;justify-content:space-between;gap:10px}
  .foot b{color:#6ee7b7;font-weight:600}`;
  const contact=[D.phone&&`Tél. <b>${esc(D.phone)}</b>`,D.email&&esc(D.email)].filter(Boolean).join("<br>");
  /* inner can be one page (string) or several pages (array); each page repeats header and footer */
  const pages=Array.isArray(inner)?inner:[inner];
  const logo=D.logo?`<div class="logo img"><img src="${D.logo}" alt=""></div>`:`<div class="logo">${PDF_LOGO}</div>`;
  const sheet=body=>`<div class="sheet">
  <svg class="wm" viewBox="0 0 24 24"><path d="M9.2 3.5h5.6v5.7h5.7v5.6h-5.7v5.7H9.2v-5.7H3.5V9.2h5.7z" fill="#0f7b5f"/></svg>
  <div class="band"></div>
  <div class="hdr"><div class="id">${logo}<div><div class="dn">${esc(D.name)}</div><div class="sp">${esc(D.spe)}</div>${D.cnam||D.mf?`<div class="cd">${[D.cnam&&"Code CNAM "+esc(D.cnam),D.mf&&"MF "+esc(D.mf)].filter(Boolean).join(" — ")}</div>`:""}</div></div>
  <div class="ra">${esc(D.addr)}<br>${esc(D.city)}${contact?"<br>"+contact:""}</div></div>
  ${body}
  <div class="foot"><span>${esc(D.hours||"")}</span><span>${esc(D.name)}${D.phone?" — "+esc(D.phone):""}</span></div>
  </div>`;
  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(filename||title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style></head><body>${pages.map(sheet).join("")}</body></html>`;
  const f=document.createElement("iframe");f.setAttribute("aria-hidden","true");
  f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(f);
  const w=f.contentWindow;w.document.open();w.document.write(html);w.document.close();
  const prevTitle=document.title;document.title=filename||title;
  let done=false;const go=()=>{if(done)return;done=true;try{w.focus();w.print()}catch(e){}document.title=prevTitle;setTimeout(()=>f.remove(),1500)};
  try{w.document.fonts.ready.then(()=>setTimeout(go,120))}catch(e){}
  setTimeout(go,1600);
  toast(t("pdf_hint"));
}
const docFile=(kind,p,date)=>`${kind}_${(p.nom+"_"+p.prenom).replace(/\s+/g,"-")}_${date||todayISO()}`;
const docTitle=(h1,date,{rx}={})=>`<div class="ttl"><div class="row" style="display:flex;align-items:flex-end;gap:10px">${rx?`<span class="rxs">Rx</span>`:""}<h1>${h1}</h1></div><div class="dt">${esc(S.settings.doctor.city||"")}, le <b>${fmtD(date)}</b></div></div>`;
const ptBlock=(p,date,{allergies}={})=>{const cn=p.cnam||{};const al=allergyList(p);
  return`<div class="pt"><div><div class="l">Patient</div><div class="v">${esc(fullName(p))}</div></div>${p.dob?`<div><div class="l">Âge</div><div class="v">${ageY(p.dob,date)} ans</div></div>`:""}<div><div class="l">Dossier</div><div class="v">${esc(p.dossier)}</div></div>${cn.idu?`<div><div class="l">${esc(cn.caisse||"Assurance")}</div><div class="v">${esc(cn.idu)}</div></div>`:""}${allergies&&al.length?`<div><div class="l">Allergies</div><div class="v al">${esc(al.join(", "))}</div></div>`:""}</div>`};
const sigBlock=date=>{const D=S.settings.doctor;return`<div class="sig"><div class="pl">Fait à ${esc(D.city||"")}, le ${fmtD(date||todayISO())}</div><div class="box">${D.stamp&&D.autoStamp!==false?`<img src="${D.stamp}" alt="">`:""}Cachet et signature du médecin</div></div>`};
const RX_PER_PAGE=7;
function pdfRx(p,v){
  const line=(r,i)=>`<li><span class="n">${i+1}</span><div><div class="m">${esc(r.nom)}</div><div class="p">${esc(r.posologie)}</div>${r.duree?`<span class="tg">Durée : ${esc(r.duree)}</span>`:""}<span class="tg">QSP : ${r.qte||1} boîte${(r.qte||1)>1?"s":""}</span></div></li>`;
  const chunks=[];for(let i=0;i<v.rx.length;i+=RX_PER_PAGE)chunks.push(v.rx.slice(i,i+RX_PER_PAGE));if(!chunks.length)chunks.push([]);
  const n=chunks.length;
  const pages=chunks.map((c,k)=>`${docTitle("Ordonnance",v.date,{rx:true})}${ptBlock(p,v.date,{allergies:true})}<ul class="rx">${c.map((r,j)=>line(r,k*RX_PER_PAGE+j)).join("")}</ul>${n>1?`<p class="pg">Page ${k+1}/${n}${k<n-1?" — suite au verso / page suivante":""}</p>`:""}${sigBlock(v.date)}`);
  printDoc("Ordonnance",pages,{size:"A5",filename:docFile("Ordonnance",p,v.date)});
}
function pdfExams(p,v,kind){
  const list=v[kind];const isA=kind==="analyses";
  printDoc(isA?"Demande d'analyses":"Demande d'imagerie",`${docTitle(isA?"Bilan biologique":"Demande d'examens",v.date)}${ptBlock(p,v.date)}<p>Prière de bien vouloir pratiquer ${isA?"les analyses":"le(s) examen(s)"} suivant(e)s :</p><ul class="ex">${list.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>${v.diagnostic?`<p style="margin-top:5mm"><span style="color:#5c7a70">Renseignements cliniques :</span> ${esc(v.diagnostic)}</p>`:""}${sigBlock(v.date)}`,{size:"A5",filename:docFile(isA?"Analyses":"Imagerie",p,v.date)});
}
function pdfCert(type,p,v,o){
  const D=S.settings.doctor,date=v.date||todayISO();
  const who=`<b>${esc(fullName(p))}</b>${p.dob?`, né(e) le ${fmtD(p.dob)}`:""}${p.cin?`, titulaire de la CIN n° ${esc(p.cin)}`:""}`;
  const je=`Je soussigné(e), <b>${esc(D.name)}</b>, ${esc(D.spe||"médecin")},`;
  const T={
   repos:["Certificat médical",`${je} certifie avoir examiné ce jour ${who}, et que son état de santé nécessite un <b>repos de ${esc(o.days)} jour(s)</b> à compter du <b>${fmtD(o.from)}</b>, sauf complications.`],
   med:["Certificat médical",`${je} ${esc(o.text).replace(/\n/g,"<br>")}`],
   aptitude:["Certificat d'aptitude",`${je} certifie avoir examiné ce jour ${who}, et qu'il/elle ne présente à ce jour <b>aucune contre-indication cliniquement décelable à la pratique du ${esc(o.sport)} ${esc(o.cadre)}</b>.`],
   bonne:["Certificat de bonne santé",`${je} certifie avoir examiné ce jour ${who}, et qu'il/elle est <b>en bonne santé apparente</b> et ne présente aucun signe clinique de maladie contagieuse.`],
   presence:["Certificat de présence",`${je} certifie que ${who} s'est présenté(e) à ma consultation ce jour, le ${fmtD(date)}, de <b>${esc(o.h1)}</b> à <b>${esc(o.h2)}</b>.`],
   accomp:["Certificat d'accompagnement",`${je} certifie que <b>${esc(o.acc)}</b> a accompagné ${who} à ma consultation ce jour, le ${fmtD(date)}.`],
   permis:["Certificat médical",`${je} certifie avoir examiné ce jour ${who}, et qu'il/elle ne présente <b>aucune affection incompatible avec l'obtention ou le maintien du permis de conduire de catégorie ${esc(o.cat)}</b>.`],
  }[type];
  if(type==="lettre"){
    const a=p.ant||{};
    const rows=[["Antécédents médicaux",a.med],["Antécédents chirurgicaux",a.chir],["Allergies",allergyList(p).join(", ")],["Traitement en cours",a.trait],["Constantes",v.vitals&&v.vitals.ta_s?`TA ${taStr(v.vitals)} mmHg${v.vitals.poids?", poids "+v.vitals.poids+" kg":""}${v.vitals.fc?", FC "+v.vitals.fc+" bpm":""}`:""]].filter(x=>x[1]);
    printDoc("Lettre de liaison",`${docTitle("Lettre de liaison",date)}${ptBlock(p,date)}<p>À l'attention de <b>${esc(o.to||"mon cher confrère")}</b>${o.spe?`, ${esc(o.spe)}`:""}</p><p>Cher(e) confrère,</p><p class="lead">${esc(o.body).replace(/\n/g,"<br>")}</p>${rows.length?`<h3>Éléments du dossier</h3><div class="kv">${rows.map(x=>`<b>${x[0]}</b><span>${esc(x[1])}</span>`).join("")}</div>`:""}<p style="margin-top:6mm">Je vous remercie de bien vouloir le/la recevoir. Bien confraternellement.</p>${sigBlock(date)}`,{size:"A4",filename:docFile("Lettre",p,date)});
    return}
  const sub={repos:"Arrêt / repos",permis:"Permis de conduire"}[type];
  printDoc(T[0],`${docTitle(T[0],date)}${sub?`<p style="margin:-2mm 0 4mm;color:#5c7a70">${sub}</p>`:""}${ptBlock(p,date)}<p class="lead">${T[1]}</p><p class="lead">Certificat établi à la demande de l'intéressé(e) et remis en main propre pour servir et valoir ce que de droit.</p>${sigBlock(date)}`,{size:"A5",filename:docFile("Certificat",p,date)});
}
function pdfNote(p,v){
  const tr=S.settings.tarifs.find(x=>x.code===v.code)||{label:""};const reste=num(v.honoraires)-num(v.recu);
  printDoc("Note d'honoraires",`${docTitle("Note d'honoraires",v.date)}${ptBlock(p,v.date)}<table><thead><tr><th>Date</th><th>Code</th><th>Désignation</th><th class="n">Montant (DT)</th></tr></thead><tbody><tr><td>${fmtD(v.date)}</td><td>${esc(v.code)}</td><td>${esc(tr.label)}</td><td class="n">${num(v.honoraires).toFixed(3)}</td></tr></tbody><tfoot><tr><td colspan="3">Total</td><td class="n">${num(v.honoraires).toFixed(3)}</td></tr></tfoot></table>
  <div class="sum"><div><div class="l">Montant</div><div class="v">${num(v.honoraires).toFixed(3)} DT</div></div><div><div class="l">Reçu</div><div class="v">${num(v.recu).toFixed(3)} DT</div></div><div><div class="l">Reste</div><div class="v">${reste.toFixed(3)} DT</div></div></div>
  <p style="margin-top:5mm">Arrêtée la présente note d'honoraires à la somme de <b>${num(v.honoraires).toFixed(3)} dinars</b>.</p>${sigBlock(v.date)}`,{size:"A5",filename:docFile("Note-honoraires",p,v.date)});
}
function pdfFiche(p){
  const vs=visitsOf(p.id),a=p.ant||{},cn=p.cnam||{};
  const kv=(k,v)=>v?`<b>${k}</b><span>${esc(v)}</span>`:"";
  printDoc("Fiche patient",`${docTitle("Fiche patient",todayISO())}${ptBlock(p,todayISO(),{allergies:true})}<div class="kv">${kv("Né(e) le",p.dob?fmtD(p.dob):"")}${kv("CIN",p.cin)}${kv("Téléphone",[p.tel,p.tel2].filter(Boolean).join(" / "))}${kv("Adresse",[p.adresse,p.ville].filter(Boolean).join(", "))}${kv("Profession",p.profession)}${kv("Groupe sanguin",p.groupe)}${kv("Caisse",[cn.caisse,cn.idu].filter(Boolean).join(", "))}${kv("APCI",cn.apci)}</div>
   <h3>Antécédents</h3><div class="kv">${kv("Médicaux",a.med)}${kv("Chirurgicaux",a.chir)}${kv("Gynéco-obstétrique",a.gyn)}${kv("Familiaux",a.fam)}${kv("Habitudes",a.hab)}${kv("Traitement",a.trait)}</div>
   <h3>Historique des consultations (${vs.length})</h3><table><thead><tr><th>Date</th><th>Motif</th><th>Diagnostic</th><th>Traitement</th></tr></thead><tbody>${vs.map(v=>`<tr><td>${fmtD(v.date)}</td><td>${esc(v.motif)}</td><td>${esc(v.diagnostic)}</td><td>${esc((v.rx||[]).map(r=>r.nom).join(", "))}</td></tr>`).join("")}</tbody></table>`,{size:"A4",filename:docFile("Fiche",p)});
}
function pdfJournal(d,doc){
  const tot=dayTotals(d,doc);const rows=tot.vs.sort((a,b)=>a.time.localeCompare(b.time));
  printDoc("Journal",`${docTitle("Journal de caisse",d)}${doc?`<p>Médecin : <b>${esc(doc)}</b></p>`:""}
  <div class="sum" style="margin:0 0 5mm"><div><div class="l">Consultations</div><div class="v">${rows.length}</div></div><div><div class="l">Chiffre d'affaires</div><div class="v">${tot.ca.toFixed(3)} DT</div></div><div><div class="l">Recette du jour</div><div class="v">${tot.recette.toFixed(3)} DT</div></div><div><div class="l">Avec BS (CNAM)</div><div class="v">${tot.avec.toFixed(3)} DT</div></div><div><div class="l">Sans BS</div><div class="v">${tot.sans.toFixed(3)} DT</div></div><div><div class="l">Impayés</div><div class="v" style="color:${tot.impayes>0?"#b4342a":"#0d2a21"}">${tot.impayes.toFixed(3)} DT</div></div></div>
  <table><thead><tr><th>Heure</th><th>Dossier</th><th>Patient</th><th>Né(e) le</th><th>BS</th><th class="n">Honoraires</th><th class="n">Reçu</th><th class="n">Reste</th></tr></thead><tbody>${rows.map(v=>{const p=P(v.patientId)||{};return`<tr><td>${v.time}</td><td>${esc(p.dossier)}</td><td>${esc(fullName(p))}</td><td>${fmtD(p.dob)}</td><td>${v.bs==="sans"?"Sans BS":"Avec BS"}</td><td class="n">${num(v.honoraires).toFixed(3)}</td><td class="n">${num(v.recu).toFixed(3)}</td><td class="n">${(num(v.honoraires)-num(v.recu)).toFixed(3)}</td></tr>`}).join("")}</tbody><tfoot><tr><td colspan="5">Total, ${rows.length} consultation(s)</td><td class="n">${tot.ca.toFixed(3)}</td><td class="n">${tot.recu.toFixed(3)}</td><td class="n">${tot.impayes.toFixed(3)}</td></tr></tfoot></table>
  ${tot.payT?`<p style="margin-top:4mm">Encaissements d'impayés antérieurs : <b>${tot.payT.toFixed(3)} DT</b></p>`:""}`,{size:"A4",filename:"Journal_"+d});
}
