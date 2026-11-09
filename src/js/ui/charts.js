/* =========================================================
   CHARTS — small SVG chart engine, no library
   Charts are drawn at their real pixel width (text never
   scales), redrawn on resize, with a hover tooltip and a
   table view for every chart.
   Series colors: --s1 (green), --s2 (blue), validated for
   colour-blind separation in light and dark mode.
   ========================================================= */
const VIZ={reg:{},seq:0,ro:null};
const vizId=cfg=>{const id="v"+(++VIZ.seq);VIZ.reg[id]=cfg;return id};
const compact=n=>{const a=Math.abs(n);if(a>=1e6)return(n/1e6).toLocaleString(loc(),{maximumFractionDigits:1})+"M";if(a>=1e4)return(n/1e3).toLocaleString(loc(),{maximumFractionDigits:1})+"K";return Math.round(n).toLocaleString(loc())};
function niceTicks(max,count=4){
  if(max<=0)return[0,1];const raw=max/count,mag=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/mag;
  const step=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*mag;const top=Math.ceil(max/step)*step;
  const r=[];for(let v=0;v<=top+step/2;v+=step)r.push(+v.toFixed(6));return r;
}
const textW=(s,px=11)=>String(s).length*px*0.6;

/* placeholder; the chart is drawn by mountViz once the element has a size */
function vizBox(cfg){const id=vizId(cfg);return`<div class="viz" data-viz="${id}" style="height:${cfg.h||240}px" role="img" aria-label="${esc(cfg.title||"")}"></div>`}
function vizCard({title,icon,sub,cfg,cls="",extra=""}){
  const id=vizId(cfg);
  return`<div class="card ${cls}"><div class="hd"><h3><span class="hi">${I(icon)}</span><span>${title}${sub?`<small class="hsub">${sub}</small>`:""}</span></h3><div class="r">${extra}${cfg.table?`<button class="btn xs ghost" data-vtab="${id}" aria-pressed="false">${I("csv")}${t("s_table")}</button>`:""}</div></div>
   ${cfg.legend?`<div class="legend vlegend">${cfg.legend.map(l=>`<span><i style="background:var(${l.c})"></i>${esc(l.n)}</span>`).join("")}</div>`:""}
   <div class="bd chart"><div class="viz" data-viz="${id}" style="height:${cfg.h||240}px" role="img" aria-label="${esc(title)}"></div><div class="vtable" id="vt-${id}" hidden></div></div></div>`;
}
function mountViz(root=document){
  if(!VIZ.ro&&window.ResizeObserver)VIZ.ro=new ResizeObserver(es=>es.forEach(e=>{const el=e.target;if(el.isConnected&&Math.abs((el._w||0)-el.clientWidth)>4)drawViz(el)}));
  $$(".viz[data-viz]",root).forEach(el=>{drawViz(el);VIZ.ro&&VIZ.ro.observe(el)});
  $$("[data-vtab]",root).forEach(b=>b.onclick=()=>{const id=b.dataset.vtab,cfg=VIZ.reg[id],box=$("#vt-"+id),viz=$(`.viz[data-viz="${id}"]`);const on=box.hidden;
    if(on&&!box.innerHTML)box.innerHTML=`<div class="tablewrap" style="max-height:320px"><table class="t"><thead><tr>${cfg.table.head.map((h,i)=>`<th class="${i?"num":""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${cfg.table.rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i?"num":""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    box.hidden=!on;viz.hidden=on;b.setAttribute("aria-pressed",String(on));b.classList.toggle("on",on)});
  bindChartTips(root);
}
function drawViz(el){const cfg=VIZ.reg[el.dataset.viz];if(!cfg)return;const w=el.clientWidth||600;el._w=w;
  el.innerHTML=({bars:svgBars,line:svgLine,heat:svgHeat}[cfg.type])(cfg,w);
  if(cfg.type!=="heat")bindHover(el,cfg)}

/* ---------- stacked / single columns ---------- */
function svgBars(c,W){
  const H=c.h||240,n=c.labels.length,tot=c.labels.map((_,i)=>c.series.reduce((s,x)=>s+(x.values[i]||0),0));
  const ticks=niceTicks(Math.max(...tot,0)),top=ticks[ticks.length-1]||1;
  const ml=Math.max(...ticks.map(v=>textW(compact(v))))+12,mr=8,mt=18,mb=26,pw=W-ml-mr,ph=H-mt-mb;
  const band=pw/n,bw=Math.max(2,Math.min(24,band*0.62)),Y=v=>mt+ph*(1-v/top);
  let g=ticks.map(v=>`<line class="gl" x1="${ml}" x2="${W-mr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${ml-8}" y="${Y(v)+4}" text-anchor="end">${compact(v)}</text>`).join("");
  const every=Math.max(1,Math.ceil(n*Math.max(...c.labels.map(l=>textW(l)))/(pw*0.8)));
  const hiI=tot.indexOf(Math.max(...tot));
  let marks="";
  c.labels.forEach((l,i)=>{const x=ml+band*i+(band-bw)/2;let y0=Y(0);const segs=c.series.map((s,k)=>({v:s.values[i]||0,k})).filter(s=>s.v>0);
    segs.forEach((s,j)=>{const h=Y(0)-Y(s.v),isTop=j===segs.length-1,y=y0-h,yt=isTop?y:Math.min(y0,y+2);const r=isTop?Math.min(4,y0-yt,bw/2):0;
      marks+=`<path class="m" style="fill:var(${c.series[s.k].c})" d="M${x},${y0}V${yt+r}${r?`Q${x},${yt} ${x+r},${yt}H${x+bw-r}Q${x+bw},${yt} ${x+bw},${yt+r}`:`H${x+bw}`}V${y0}Z"/>`;
      y0=y;});
    if(c.labelMax&&i===hiI&&tot[i]>0)marks+=`<text class="vlab" x="${x+bw/2}" y="${Y(tot[i])-6}" text-anchor="middle">${esc(c.fmt?c.fmt(tot[i]):compact(tot[i]))}</text>`;
    if(i%every===0)marks+=`<text x="${ml+band*i+band/2}" y="${H-8}" text-anchor="middle">${esc(l)}</text>`;
  });
  const hits=c.labels.map((_,i)=>`<rect class="hit" data-i="${i}" x="${ml+band*i}" y="${mt}" width="${band}" height="${ph}"/>`).join("");
  return`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect class="band" x="0" y="${mt}" width="${band}" height="${ph}" visibility="hidden"/>${g}<line class="axis" x1="${ml}" x2="${W-mr}" y1="${Y(0)}" y2="${Y(0)}"/>${marks}${hits}</svg>`;
}
/* ---------- lines (+ area for a single series) ---------- */
function svgLine(c,W){
  const H=c.h||220,n=c.labels.length;const all=c.series.flatMap(s=>s.values.filter(v=>v!=null));
  if(!all.length)return emptyState("chart",t("no_data"),c.empty||"");
  let lo=c.zero?0:Math.min(...all),hi=Math.max(...all);if(!c.zero){const p=(hi-lo)*.2||1;lo=Math.max(0,lo-p);hi+=p}
  const ticks=c.zero?niceTicks(hi):(()=>{const r=[],st=(hi-lo)/3;for(let i=0;i<=3;i++)r.push(lo+st*i);return r})();
  const tlo=ticks[0],thi=ticks[ticks.length-1]||1,dec=c.dec||0,fmtT=v=>c.zero?compact(v):v.toFixed(dec);
  const ml=Math.max(...ticks.map(v=>textW(fmtT(v))))+12,mr=c.endLabel?44:14,mt=16,mb=26,pw=W-ml-mr,ph=H-mt-mb;
  const X=i=>n===1?ml+pw/2:ml+pw*i/(n-1),Y=v=>mt+ph*(1-(v-tlo)/(thi-tlo||1));
  let g=ticks.map(v=>`<line class="gl" x1="${ml}" x2="${W-mr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${ml-8}" y="${Y(v)+4}" text-anchor="end">${fmtT(v)}</text>`).join("");
  const every=Math.max(1,Math.ceil(n*Math.max(...c.labels.map(l=>textW(l)))/(pw*0.8)));
  const lw=Math.max(...c.labels.map(l=>textW(l)))+10;let lastX=-1e9;
  c.labels.forEach((l,i)=>{const x=Math.min(Math.max(X(i),ml+textW(l)/2),W-4-textW(l)/2);if((i%every===0||i===n-1)&&x-lastX>=lw){g+=`<text x="${x}" y="${H-8}" text-anchor="middle">${esc(l)}</text>`;lastX=x}});
  let marks="";
  c.series.forEach(s=>{const pts=s.values.map((v,i)=>v==null?null:[X(i),Y(v)]).filter(Boolean);if(!pts.length)return;
    const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join("");
    if(c.series.length===1&&pts.length>1)marks+=`<path class="area" style="fill:var(${s.c})" d="${d}L${pts[pts.length-1][0]} ${Y(tlo)}L${pts[0][0]} ${Y(tlo)}Z"/>`;
    marks+=`<path class="ln" style="stroke:var(${s.c})${s.dash?";stroke-dasharray:5 4":""}" d="${d}"/>`;
    if(pts.length<=24)pts.forEach(p=>marks+=`<circle class="dot" style="fill:var(${s.c})" r="4" cx="${p[0]}" cy="${p[1]}"/>`);
    else{const p=pts[pts.length-1];marks+=`<circle class="dot" style="fill:var(${s.c})" r="4" cx="${p[0]}" cy="${p[1]}"/>`}
    if(c.endLabel){const li=s.values.map((v,i)=>v==null?-1:i).filter(i=>i>=0).pop();marks+=`<text class="vlab" x="${X(li)+8}" y="${Y(s.values[li])+4}">${esc(c.fmt?c.fmt(s.values[li]):compact(s.values[li]))}</text>`}
  });
  const step=n>1?pw/(n-1):pw;
  const hits=c.labels.map((_,i)=>`<rect class="hit" data-i="${i}" x="${X(i)-step/2}" y="${mt}" width="${step}" height="${ph}"/>`).join("");
  return`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}<line class="cross" x1="0" x2="0" y1="${mt}" y2="${mt+ph}" visibility="hidden"/>${marks}${hits}</svg>`;
}
/* ---------- heatmap (weekday × hour) ---------- */
function svgHeat(c,W){
  const rows=c.rows.length,cols=c.cols.length,ml=48,mt=8,mb=24,H=c.h||220;
  const cw=Math.max(14,(W-ml-4)/cols),ch=Math.min(32,(H-mt-mb)/rows),mx=Math.max(1,...c.values.flat());
  let s="";
  c.values.forEach((row,r)=>{s+=`<text x="${ml-8}" y="${mt+ch*r+ch/2+4}" text-anchor="end">${esc(c.rows[r])}</text>`;
    row.forEach((v,k)=>{const pct=v?Math.round(14+86*v/mx):0;
      s+=`<rect class="cell" x="${ml+cw*k+1}" y="${mt+ch*r+1}" width="${cw-2}" height="${ch-2}" rx="4" style="fill:${v?`color-mix(in srgb,var(--s1) ${pct}%,var(--surface))`:"var(--soft)"}" data-tip="${esc(c.rows[r]+" "+c.cols[k]+" : "+v+" "+c.unit)}"/>`})});
  const every=Math.max(1,Math.ceil(cols*28/(W-ml)));
  c.cols.forEach((l,k)=>{if(k%every===0)s+=`<text x="${ml+cw*k+cw/2}" y="${mt+ch*rows+16}" text-anchor="middle">${esc(l)}</text>`});
  return`<svg width="${W}" height="${mt+ch*rows+mb}" viewBox="0 0 ${W} ${mt+ch*rows+mb}">${s}</svg>`;
}
/* ---------- hover tooltip with crosshair / band ---------- */
function bindHover(el,c){
  const svg=$("svg",el);if(!svg)return;const band=$(".band",svg),cross=$(".cross",svg);
  $$(".hit",svg).forEach(r=>{
    r.addEventListener("mousemove",e=>{const i=+r.dataset.i;
      if(band){band.setAttribute("x",r.getAttribute("x"));band.setAttribute("width",r.getAttribute("width"));band.setAttribute("visibility","visible")}
      if(cross){const x=+r.getAttribute("x")+ +r.getAttribute("width")/2;cross.setAttribute("x1",x);cross.setAttribute("x2",x);cross.setAttribute("visibility","visible")}
      const rows=c.series.filter(s=>s.values[i]!=null).map(s=>`<div class="trow"><i style="background:var(${s.c})"></i><span>${esc(s.name||"")}</span><b>${esc(c.fmt?c.fmt(s.values[i]):compact(s.values[i]))}</b></div>`).join("");
      const tot=c.type==="bars"&&c.series.length>1?`<div class="trow tot"><span>${t("total")}</span><b>${esc(c.fmt?c.fmt(c.series.reduce((a,s)=>a+(s.values[i]||0),0)):"")}</b></div>`:"";
      showTip(e,`<div class="tt">${esc(c.tipLabels?c.tipLabels[i]:c.labels[i])}</div>${rows}${tot}`)});
    r.addEventListener("mouseleave",()=>{hideTip();band&&band.setAttribute("visibility","hidden");cross&&cross.setAttribute("visibility","hidden")});
  });
}
let TIP=null;
function showTip(e,html){if(!TIP){TIP=document.createElement("div");TIP.className="tip";document.body.appendChild(TIP)}TIP.innerHTML=html;
  const w=TIP.offsetWidth,h=TIP.offsetHeight;let x=e.clientX+14,y=e.clientY-h-10;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y<8)y=e.clientY+16;TIP.style.left=x+"px";TIP.style.top=y+"px"}
function hideTip(){if(TIP){TIP.remove();TIP=null}}
function bindChartTips(root){
  $$("[data-tip]",root).forEach(el=>{if(el._tip)return;el._tip=1;el.addEventListener("mousemove",e=>showTip(e,esc(el.dataset.tip)));el.addEventListener("mouseleave",hideTip)});
}

/* ---------- HTML pieces ---------- */
function hbars(rows,fmt=v=>v){const mx=Math.max(...rows.map(r=>r.v),1);return rows.length?`<div class="hbars">${rows.map(r=>`<div class="hbar" data-tip="${esc(r.l)} : ${esc(fmt(r.v))}"><div class="lb" title="${esc(r.l)}">${esc(r.l)}</div><div class="tr"><i style="width:${Math.max(1,r.v/mx*100)}%"></i></div><div class="vl">${esc(fmt(r.v))}</div></div>`).join("")}</div>`:emptyState("chart",t("no_data"),"")}
function sparkline(vals,{w=88,h=28}={}){if(!vals.length||vals.every(v=>!v))return"";const mx=Math.max(...vals),mn=Math.min(...vals),X=i=>2+(w-6)*i/(vals.length-1||1),Y=v=>h-3-(h-6)*((v-mn)/((mx-mn)||1));
  const d=vals.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)).join("");return`<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}"/><circle r="3" cx="${X(vals.length-1)}" cy="${Y(vals[vals.length-1])}"/></svg>`}
/* one whole split into parts (tall segmented bar) */
function segBar(parts,fmt=v=>v){const tot=parts.reduce((s,p)=>s+p.v,0)||1;
  return`<div class="segbar" role="img" aria-label="${esc(parts.map(p=>p.n+" "+Math.round(p.v/tot*100)+"%").join(", "))}">${parts.filter(p=>p.v>0).map(p=>{const pc=p.v/tot*100;return`<div style="flex:${p.v};background:var(${p.c})" data-tip="${esc(p.n)} : ${esc(fmt(p.v))} (${Math.round(pc)} %)">${pc>=14?`<span>${Math.round(pc)} %</span>`:""}</div>`}).join("")}</div>
  <div class="legend" style="margin-top:10px">${parts.map(p=>`<span><i style="background:var(${p.c})"></i>${esc(p.n)} <b>${esc(fmt(p.v))}</b></span>`).join("")}</div>`}

/* legacy API used by the patient vitals tab */
function lineChart(series,{h=200,dec=0}={}){
  const xs=[...new Set(series.flatMap(s=>s.pts.map(p=>p.x)))].sort();
  if(!xs.length)return emptyState("chart",t("no_data"),t("vitals_empty_hint"));
  const cfg={type:"line",h,dec,labels:xs.map(x=>fmtD(x).slice(0,5)+"/"+x.slice(2,4)),tipLabels:xs.map(fmtD),
    series:series.map((s,i)=>({name:s.name||"",c:s.c||(i?"--s2":"--s1"),dash:false,values:xs.map(x=>{const p=s.pts.find(q=>q.x===x);return p?p.y:null})})),fmt:v=>(+v).toFixed(dec)};
  return vizBox(cfg);
}
const barChart=(data,{fmt}={})=>vizBox({type:"bars",labels:data.map(d=>d.l),series:[{name:"",c:"--s1",values:data.map(d=>d.v)}],fmt});
