/* =========================================================
   STATS
   ========================================================= */
/* [from,to] of the selected period and of the period just before it */
function statsRange(per,td){
  const y=+td.slice(0,4),m=+td.slice(5,7),d=+td.slice(8,10);
  if(per==="month"){const from=td.slice(0,8)+"01";const pm=new Date(y,m-2,1),pe=new Date(y,m-2,Math.min(d,new Date(y,m-1,0).getDate()));return{from,to:td,pfrom:isoDate(pm),pto:isoDate(pe),vs:t("s_vs_month")}}
  if(per==="d30")return{from:addDays(td,-29),to:td,pfrom:addDays(td,-59),pto:addDays(td,-30),vs:t("s_vs_30")};
  if(per==="year")return{from:y+"-01-01",to:td,pfrom:(y-1)+"-01-01",pto:(y-1)+td.slice(4),vs:t("s_vs_year")};
  return{from:"0000",to:td,pfrom:null,pto:null,vs:""};
}
function statsFigures(from,to){
  const vs=S.visits.filter(v=>v.date>=from&&v.date<=to);
  const ca=vs.reduce((s,v)=>s+num(v.honoraires),0),recu=vs.reduce((s,v)=>s+num(v.recu),0);
  const pay=S.payments.filter(x=>x.date>=from&&x.date<=to).reduce((s,x)=>s+num(x.amount),0);
  return{vs,n:vs.length,ca,rc:recu+pay,unpaid:ca-recu,avg:vs.length?ca/vs.length:0,coll:ca?Math.min(100,(recu+pay)/ca*100):0,newP:S.patients.filter(p=>p.createdAt>=from&&p.createdAt<=to).length};
}
function kpiTile({l,v,unit="",icon,cur,prev,goodUp=true,spark,neg=false,vsLabel}){
  let delta="";
  if(prev!=null&&isFinite(prev)){
    if(prev===0&&cur===0)delta=`<span class="delta flat">— ${esc(vsLabel)}</span>`;
    else if(prev===0)delta=`<span class="delta up good">${I("up")}${t("s_new")} ${esc(vsLabel)}</span>`;
    else{const pc=Math.round((cur-prev)/Math.abs(prev)*100),up=pc>0,good=pc===0?null:(up===goodUp);
      delta=`<span class="delta ${pc===0?"flat":up?"up":"down"} ${good===null?"":good?"good":"bad"}">${pc===0?"=":I(up?"up":"down")}${Math.abs(pc)} % <span class="muted">${esc(vsLabel)}</span></span>`}
  }
  return`<div class="card kpi stat ${neg?"neg":""}"><div class="ki">${I(icon)}</div><div style="min-width:0;flex:1"><div class="l">${l}</div><div class="v">${v}${unit?`<small>${unit}</small>`:""}</div>${delta}</div>${spark||""}</div>`;
}
function vStats(pg){
  const per=UI.statsPeriod,td=todayISO(),R=statsRange(per,td),F=statsFigures(R.from,td),PF=R.pfrom?statsFigures(R.pfrom,R.pto):null;
  const vs=F.vs;
  /* buckets: days for month / 30 days, months otherwise */
  const daily=per==="month"||per==="d30";
  let keys=[];
  if(daily){let d=R.from;while(d<=td){keys.push(d);d=addDays(d,1)}}
  else{const first=per==="year"?R.from:(S.visits.reduce((m,v)=>v.date<m?v.date:m,td));let y=+first.slice(0,4),m=+first.slice(5,7);const ey=+td.slice(0,4),em=+td.slice(5,7);
    while(y<ey||(y===ey&&m<=em)){keys.push(y+"-"+pad(m));m++;if(m>12){m=1;y++}}keys=keys.slice(-24)}
  const kOf=v=>daily?v.date:v.date.slice(0,7);
  const avec={},sans={},cnt={},paid={};keys.forEach(k=>{avec[k]=0;sans[k]=0;cnt[k]=0;paid[k]=0});
  vs.forEach(v=>{const k=kOf(v);if(!(k in cnt))return;cnt[k]++;paid[k]+=num(v.recu);if(v.bs==="sans")sans[k]+=num(v.honoraires);else avec[k]+=num(v.honoraires)});
  const mlbl=k=>new Date(k+"-01T00:00:00").toLocaleDateString(loc(),{month:"short"})+(per==="all"?" "+k.slice(2,4):"");
  const lbls=keys.map(k=>daily?String(+k.slice(8)):mlbl(k));
  const tipL=keys.map(k=>daily?new Date(k+"T00:00:00").toLocaleDateString(loc(),{weekday:"short",day:"numeric",month:"long"}):new Date(k+"-01T00:00:00").toLocaleDateString(loc(),{month:"long",year:"numeric"}));
  const dt=x=>money(x)+" "+t("tnd");
  const revCfg={type:"bars",h:260,labels:lbls,tipLabels:tipL,fmt:dt,labelMax:true,
    series:[{name:t("avec_bs"),c:"--s1",values:keys.map(k=>avec[k])},{name:t("sans_bs"),c:"--s2",values:keys.map(k=>sans[k])}],
    legend:[{n:t("avec_bs"),c:"--s1"},{n:t("sans_bs"),c:"--s2"}],
    table:{head:[daily?t("date"):t("s_month"),t("avec_bs"),t("sans_bs"),t("total")],rows:keys.map((k,i)=>[tipL[i],money(avec[k]),money(sans[k]),money(avec[k]+sans[k])])}};
  /* visits per month, always the last 12 months */
  const months=[];{const d=new Date();for(let i=11;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);months.push(x.getFullYear()+"-"+pad(x.getMonth()+1))}}
  const mc={};S.visits.forEach(v=>{const k=v.date.slice(0,7);mc[k]=(mc[k]||0)+1});
  const visCfg={type:"line",h:230,zero:true,endLabel:true,labels:months.map(k=>new Date(k+"-01T00:00:00").toLocaleDateString(loc(),{month:"short"})),tipLabels:months.map(k=>new Date(k+"-01T00:00:00").toLocaleDateString(loc(),{month:"long",year:"numeric"})),
    series:[{name:t("k_consult"),c:"--s1",values:months.map(k=>mc[k]||0)}],fmt:v=>String(v),
    table:{head:[t("s_month"),t("k_consult")],rows:months.map(k=>[new Date(k+"-01T00:00:00").toLocaleDateString(loc(),{month:"long",year:"numeric"}),mc[k]||0])}};
  /* busy times: weekday × hour */
  const dn=[1,2,3,4,5,6].map(i=>new Date(2024,0,i).toLocaleDateString(loc(),{weekday:"short"}));// 1 Jan 2024 = Monday
  const hours=[];for(let h=8;h<=18;h++)hours.push(h);
  const heat=dn.map(()=>hours.map(()=>0));
  vs.forEach(v=>{const wd=(new Date(v.date+"T00:00:00").getDay()+6)%7,h=+String(v.time||"0").slice(0,2);if(wd<6&&h>=8&&h<=18)heat[wd][h-8]++});
  const heatCfg={type:"heat",h:6*32+34,rows:dn,cols:hours.map(h=>h+"h"),values:heat,unit:t("k_consult").toLowerCase(),
    table:{head:["",...hours.map(h=>h+"h")],rows:dn.map((d,i)=>[d,...heat[i]])}};
  const busiest=(()=>{let b=[0,0,0];heat.forEach((r,i)=>r.forEach((v,k)=>{if(v>b[2])b=[i,k,v]}));return b[2]?t("s_busiest").replace("{d}",dn[b[0]]).replace("{h}",hours[b[1]]+"h"):""})();
  const count=arr=>{const o={};arr.forEach(x=>{if(x)o[x]=(o[x]||0)+1});return Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([l,v])=>({l,v}))};
  const topDx=count(vs.map(v=>v.diagnostic)).slice(0,8),topMed=count(vs.flatMap(v=>(v.rx||[]).map(r=>r.nom))).slice(0,8);
  const pids=[...new Set(vs.map(v=>v.patientId))].map(P).filter(Boolean);
  const ages=[["0–15",0,15],["16–30",16,30],["31–45",31,45],["46–60",46,60],["61–75",61,75],["76+",76,200]].map(([l,a,b])=>({l,v:pids.filter(p=>{const x=ageY(p.dob);return x!=null&&x>=a&&x<=b}).length}));
  const fem=pids.filter(p=>p.sexe==="F").length;
  const sumA=Object.values(avec).reduce((a,b)=>a+b,0),sumS=Object.values(sans).reduce((a,b)=>a+b,0);
  const sm=soldeMap(),unpaid=S.patients.filter(p=>(sm[p.id]||0)>0.0005).sort((a,b)=>sm[b.id]-sm[a.id]).slice(0,6);
  const sp=k=>sparkline(keys.map(x=>k(x)));
  const V=R.vs;
  pg.innerHTML=`<div class="ph"><div><h1>${t("nav_stats")}</h1><div class="sub">${t("stats_sub")}</div></div><div class="actions"><div class="chips" role="tablist">${[["month","p_month"],["d30","p_30"],["year","p_year"],["all","p_all"]].map(x=>`<button class="chip ${per===x[0]?"on":""}" data-per="${x[0]}" role="tab" aria-selected="${per===x[0]}">${t(x[1])}</button>`).join("")}</div></div></div>
  <div class="grid statgrid">
    ${kpiTile({l:t("k_consult"),v:F.n.toLocaleString(loc()),icon:"stetho",cur:F.n,prev:PF&&PF.n,vsLabel:V,spark:sp(k=>cnt[k])})}
    ${kpiTile({l:t("k_ca"),v:compactMoney(F.ca),unit:t("tnd"),icon:"cash",cur:F.ca,prev:PF&&PF.ca,vsLabel:V,spark:sp(k=>avec[k]+sans[k])})}
    ${kpiTile({l:t("k_recette"),v:compactMoney(F.rc),unit:t("tnd"),icon:"wallet",cur:F.rc,prev:PF&&PF.rc,vsLabel:V,spark:sp(k=>paid[k])})}
    ${kpiTile({l:t("s_collect"),v:Math.round(F.coll),unit:"%",icon:"check",cur:Math.round(F.coll),prev:PF&&Math.round(PF.coll),vsLabel:V})}
    ${kpiTile({l:t("s_avg"),v:money(F.avg),unit:t("tnd"),icon:"stats",cur:F.avg,prev:PF&&PF.avg,vsLabel:V})}
    ${kpiTile({l:t("s_new_patients"),v:F.newP,icon:"userplus",cur:F.newP,prev:PF&&PF.newP,vsLabel:V})}
  </div>
  <div class="grid g2 mt">
    ${vizCard({title:daily?t("s_revenue_day"):t("s_revenue_month"),icon:"cash",cls:"span2",cfg:revCfg,sub:`${t("total")} ${dt(F.ca)}`})}
    ${vizCard({title:t("s_visits_month"),icon:"stats",cfg:visCfg,sub:t("s_last12")})}
    ${vizCard({title:t("s_busy"),icon:"clock",cfg:heatCfg,sub:busiest,extra:`<span class="heatkey hide-m" aria-hidden="true">${t("s_less")}<i></i>${t("s_more")}</span>`})}
    <div class="card"><div class="hd"><h3><span class="hi">${I("stetho")}</span>${t("s_top_diag")}</h3></div><div class="bd">${hbars(topDx)}</div></div>
    <div class="card"><div class="hd"><h3><span class="hi">${I("meds")}</span>${t("s_top_meds")}</h3></div><div class="bd">${hbars(topMed)}</div></div>
    <div class="card"><div class="hd"><h3><span class="hi">${I("patients")}</span>${t("s_patients_seen")}</h3><span class="muted" style="font-size:12.5px">${pids.length} ${t("nav_patients").toLowerCase()}</span></div><div class="bd">
      ${segBar([{n:t("female"),v:fem,c:"--s1"},{n:t("male"),v:pids.length-fem,c:"--s2"}],v=>String(v))}
      <div style="margin-top:18px">${hbars(ages)}</div></div></div>
    <div class="card"><div class="hd"><h3><span class="hi">${I("shield")}</span>${t("s_bs")}</h3></div><div class="bd">
      ${segBar([{n:t("avec_bs"),v:sumA,c:"--s1"},{n:t("sans_bs"),v:sumS,c:"--s2"}],v=>money(v)+" "+t("tnd"))}
      <div class="unpaidbox"><div class="row"><span class="ico" style="background:var(--danger-soft);color:var(--danger)">${I("wallet")}</span><div><div class="muted" style="font-size:12.5px">${t("k_impayes")}</div><b class="red" style="font-size:18px">${money(F.unpaid)} ${t("tnd")}</b></div></div>
      ${unpaid.map(p=>`<div class="urow" data-go="patient/${p.id}"><span>${esc(shortName(p))}</span><b class="num">${money(sm[p.id])}</b></div>`).join("")}</div>
    </div></div>
  </div>`;
  $$("[data-per]").forEach(b=>b.onclick=()=>{UI.statsPeriod=b.dataset.per;render()});
  mountViz(pg);
}
const compactMoney=n=>Math.abs(n)>=100000?compact(n):money(n);
