/* =========================================================
   JOURNAL
   ========================================================= */
function vJournal(pg){
  const d=UI.jDate||todayISO(),doc=UI.jDoctor;const tot=dayTotals(d,doc);
  const rows=tot.vs.sort((a,b)=>a.time.localeCompare(b.time));
  pg.innerHTML=`
  <div class="ph"><div><h1>${t("nav_journal")}</h1><div class="sub">${t("journal_sub")}</div></div>
   <div class="actions"><button class="btn" data-act="jcsv">${I("csv")}${t("export_csv")}</button><button class="btn pri" data-act="jpdf">${I("pdf")}${t("export_pdf")}</button></div></div>
  <div class="card" style="margin-bottom:16px"><div class="toolbar" style="border:0">
    <button class="iconbtn" data-act="jprev" title="${t("prev_day")}">${I("left")}</button>
    <input type="date" class="in" id="jd" value="${d}" style="width:170px">
    <button class="iconbtn" data-act="jnext" title="${t("next_day")}">${I("right")}</button>
    <button class="btn sm" data-act="jtoday">${t("today_btn")}</button>
    <b style="margin-left:6px">${longDate(d)}</b>
    <div class="right row"><span class="muted">${t("doctor")}</span><select class="in" id="jdoc" style="width:160px"><option value="">${t("all")}</option>${S.settings.doctors.map(x=>`<option ${x===doc?"selected":""}>${esc(x)}</option>`).join("")}</select></div>
  </div></div>
  <div class="grid g4" style="grid-template-columns:repeat(6,minmax(0,1fr))">
   ${kpi(t("k_consult"),rows.length)}${kpi(t("k_ca"),money(tot.ca),t("tnd"))}${kpi(t("k_recette"),money(tot.recette),t("tnd"))}${kpi(t("k_impayes"),money(tot.impayes),t("tnd"),tot.impayes>0)}${kpi(t("avec_bs"),money(tot.avec),t("tnd"))}${kpi(t("sans_bs"),money(tot.sans),t("tnd"))}
  </div>
  <div class="card mt"><div class="toolbar"><div class="inicon">${I("search")}<input class="in" id="jq" placeholder="${t("search_in_list")}"></div></div>
   <div class="tablewrap"><table class="t" id="jt"><thead><tr><th>${t("col_time")}</th><th>${t("col_dossier")}</th><th>${t("col_nom")}</th><th>${t("col_prenom")}</th><th class="hide-m">${t("col_dob")}</th><th>${t("col_diag")}</th><th>${t("code")}</th><th>${t("col_bs")}</th><th class="num">${t("col_hon")}</th><th class="num">${t("col_recu")}</th><th class="num">${t("col_doit")}</th></tr></thead>
   <tbody>${rows.map(v=>{const p=P(v.patientId)||{};const reste=num(v.honoraires)-num(v.recu);return`<tr class="click" data-v="${v.id}" data-s="${esc(norm([p.nom,p.prenom,p.dossier,p.tel,v.diagnostic].join(" ")))}"><td class="num">${v.time}</td><td class="num">${esc(p.dossier)}</td><td class="b">${esc((p.titre||"")+" "+(p.nom||""))}</td><td>${esc(p.prenom)}</td><td class="hide-m num">${fmtD(p.dob)}</td><td>${esc(v.diagnostic)}</td><td>${esc(v.code)}</td><td>${bsPill(v.bs)}</td><td class="num">${money(v.honoraires)}</td><td class="num">${money(v.recu)}</td><td class="num ${reste>0?"red b":""}">${money(reste)}</td></tr>`}).join("")||`<tr><td colspan="11" class="empty">${t("no_visits_day")}</td></tr>`}</tbody>
   ${rows.length?`<tfoot><tr><td colspan="8">${t("total")} · ${rows.length} ${t("k_consult").toLowerCase()}</td><td class="num">${money(tot.ca)}</td><td class="num">${money(tot.recu)}</td><td class="num">${money(tot.impayes)}</td></tr></tfoot>`:""}</table></div></div>
  ${tot.pay.length?`<div class="card mt"><div class="hd"><h3>${t("payment")}s</h3></div><table class="t"><tbody>${tot.pay.map(x=>{const p=P(x.patientId)||{};return`<tr><td>${esc(shortName(p))}</td><td class="num b">${money(x.amount)} ${t("tnd")}</td></tr>`}).join("")}</tbody></table></div>`:""}`;
  const setD=v=>{UI.jDate=v;render()};
  ACT.jprev=()=>setD(addDays(d,-1));ACT.jnext=()=>setD(addDays(d,1));ACT.jtoday=()=>setD(todayISO());
  $("#jd").onchange=e=>e.target.value&&setD(e.target.value);
  $("#jdoc").onchange=e=>{UI.jDoctor=e.target.value;render()};
  $("#jq").oninput=e=>{const tk=norm(e.target.value).split(/\s+/).filter(Boolean);$$("#jt tbody tr[data-s]").forEach(tr=>tr.style.display=tk.every(x=>tr.dataset.s.includes(x))?"":"none")};
  $$("#jt tr[data-v]").forEach(tr=>tr.onclick=()=>openVisitView(tr.dataset.v));
  ACT.jcsv=()=>{const head=["Heure","Dossier","Nom","Prénom","Né le","Diagnostic","Code","BS","Honoraires","Reçu","Reste"];
    const lines=rows.map(v=>{const p=P(v.patientId)||{};return[v.time,p.dossier,(p.titre||"")+" "+p.nom,p.prenom,fmtD(p.dob),v.diagnostic,v.code,v.bs,num(v.honoraires).toFixed(3),num(v.recu).toFixed(3),(num(v.honoraires)-num(v.recu)).toFixed(3)]});
    downloadCSV("journal_"+d+".csv",[head,...lines])};
  ACT.jpdf=()=>pdfJournal(d,doc);
}
const bsPill=b=>b==="sans"?`<span class="pill">${t("sans_bs")}</span>`:b==="compl"?`<span class="pill dark">${t("bs_compl")}</span>`:`<span class="pill dark">${t("avec_bs")}</span>`;
function downloadCSV(name,rows){const csv="﻿"+rows.map(r=>r.map(c=>{c=String(c==null?"":c);return/[;"\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(";")).join("\r\n");download(name,csv,"text/csv;charset=utf-8")}
function download(name,content,type){const b=new Blob([content],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
