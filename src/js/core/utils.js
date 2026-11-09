/* ---------- utils ---------- */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const t=k=>(I18N[UI.lang]&&I18N[UI.lang][k]!==undefined)?I18N[UI.lang][k]:(I18N.fr[k]!==undefined?I18N.fr[k]:k);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pad=n=>String(n).padStart(2,"0");
const isoDate=d=>{d=d?new Date(d):new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
const todayISO=()=>isoDate();
const nowHM=()=>{const d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())};
const addDays=(iso,n)=>{const d=new Date(iso+"T00:00:00");d.setDate(d.getDate()+n);return isoDate(d)};
const fmtD=iso=>{if(!iso)return"";const[y,m,d]=iso.split("-");return d+"/"+m+"/"+y};
const loc=()=>UI.lang==="fr"?"fr-FR":"en-GB";
const longDate=iso=>{const s=new Date(iso+"T00:00:00").toLocaleDateString(loc(),{weekday:"long",day:"numeric",month:"long",year:"numeric"});return s.charAt(0).toUpperCase()+s.slice(1)};
const money=n=>Number(n||0).toLocaleString(loc(),{minimumFractionDigits:3,maximumFractionDigits:3});
const num=v=>{const x=parseFloat(String(v).replace(",","."));return isNaN(x)?0:x};
function ageY(dob,ref){if(!dob)return null;const b=new Date(dob+"T00:00:00"),r=ref?new Date(ref+"T00:00:00"):new Date();let a=r.getFullYear()-b.getFullYear();if(r.getMonth()<b.getMonth()||(r.getMonth()===b.getMonth()&&r.getDate()<b.getDate()))a--;return a}
function ageStr(dob){const a=ageY(dob);if(a===null)return"";if(a<2){const b=new Date(dob),r=new Date();const m=(r.getFullYear()-b.getFullYear())*12+r.getMonth()-b.getMonth();return m+" "+t("months")}return a+" "+t("years")}
const initials=p=>((p.nom||"?")[0]+(p.prenom||"")[0]||"").toUpperCase();
const fullName=p=>p?[p.titre,p.nom,p.prenom].filter(Boolean).join(" "):"";
const shortName=p=>p?(p.nom+" "+p.prenom):"";
function hl(text,tokens){let s=esc(text);if(!tokens||!tokens.length)return s;
  const n=norm(text);const marks=[];tokens.forEach(tk=>{if(!tk)return;let i=n.indexOf(tk);while(i>-1){marks.push([i,i+tk.length]);i=n.indexOf(tk,i+tk.length)}});
  if(!marks.length)return s;marks.sort((a,b)=>a[0]-b[0]);const m=[];marks.forEach(x=>{if(m.length&&x[0]<=m[m.length-1][1])m[m.length-1][1]=Math.max(m[m.length-1][1],x[1]);else m.push(x)});
  let out="",last=0;m.forEach(([a,b])=>{out+=esc(text.slice(last,a))+"<mark>"+esc(text.slice(a,b))+"</mark>";last=b});return out+esc(text.slice(last))}

/* ---------- data helpers ---------- */
const P=id=>S.patients.find(p=>p.id===id);
const visitsOf=id=>S.visits.filter(v=>v.patientId===id).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
const paymentsOf=id=>S.payments.filter(x=>x.patientId===id);
function solde(id){let s=0;for(const v of S.visits)if(v.patientId===id)s+=num(v.honoraires)-num(v.recu);for(const x of S.payments)if(x.patientId===id)s-=num(x.amount);return Math.round(s*1000)/1000}
function soldeMap(){const m={};for(const v of S.visits)m[v.patientId]=(m[v.patientId]||0)+num(v.honoraires)-num(v.recu);for(const x of S.payments)m[x.patientId]=(m[x.patientId]||0)-num(x.amount);return m}
function lastVisitMap(){const m={},c={};for(const v of S.visits){if(!m[v.patientId]||m[v.patientId]<v.date)m[v.patientId]=v.date;c[v.patientId]=(c[v.patientId]||0)+1}return{last:m,count:c}}
function nextDossier(){let mx=0;S.patients.forEach(p=>{const n=parseInt(p.dossier);if(n>mx)mx=n});return String(mx+1)}
const allergyList=p=>(p.allergies||[]).filter(Boolean);

/* blood pressure as "130/80", or just "130" when only the systolic value is known */
const taStr=x=>x&&x.ta_s?String(x.ta_s)+(x.ta_d?"/"+x.ta_d:""):"";
