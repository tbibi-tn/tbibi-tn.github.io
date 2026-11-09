/* ---------- toast / modal ---------- */
/* toast with an "Undo" button, shown longer */
function toastUndo(msg,undo,ms=9000){
  let w=$(".toasts");if(!w){w=document.createElement("div");w.className="toasts";document.body.appendChild(w)}
  const d=document.createElement("div");d.className="toast";d.innerHTML=`<i>✓</i><span></span><button class="tbtn">${I("undo")}${t("undo")}</button>`;
  d.querySelector("span").textContent=msg;w.appendChild(d);
  const tm=setTimeout(()=>d.remove(),ms);
  d.querySelector("button").onclick=()=>{clearTimeout(tm);d.remove();undo()};
}
function toast(msg,warn){if(/^⚠/.test(msg)){warn=true;msg=msg.replace(/^⚠\s*/,"")}let w=$(".toasts");if(!w){w=document.createElement("div");w.className="toasts";document.body.appendChild(w)}const d=document.createElement("div");d.className="toast"+(warn?" warn":"");d.innerHTML=`<i>${warn?"!":"✓"}</i><span></span>`;d.querySelector("span").textContent=msg;w.appendChild(d);setTimeout(()=>d.remove(),2600)}
const modalStack=[];
function openModal(html,{cls="",onMount}={}){
  const ov=document.createElement("div");ov.className="overlay";ov.innerHTML=`<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  ov.addEventListener("mousedown",e=>{if(e.target===ov)closeModal()});
  document.body.appendChild(ov);modalStack.push(ov);
  const m=ov.firstElementChild;if(onMount)onMount(m);
  const f=m.querySelector("[autofocus]")||m.querySelector("input:not([type=checkbox]):not([type=radio]),textarea,select");if(f){f.focus();setTimeout(()=>f.focus(),30)}
  return m}
function closeModal(){const ov=modalStack.pop();if(ov)ov.remove()}
function confirmBox(text,onYes,{danger=true,yes}={}){
  openModal(`<div class="mh"><h2>${esc(text)}</h2></div><div class="mf"><button class="btn" data-x>${t("cancel")}</button><button class="btn ${danger?"pri":"pri"}" data-y>${esc(yes||t("yes"))}</button></div>`,{cls:"sm",onMount:m=>{
    m.querySelector("[data-x]").onclick=closeModal;m.querySelector("[data-y]").onclick=()=>{closeModal();onYes()};}})}
const mh=(title,extra="",icon)=>`<div class="mh">${icon?`<div class="hi">${I(icon)}</div>`:""}<h2>${title}</h2>${extra}<button class="iconbtn right" data-close aria-label="${t("close")}">${I("x")}</button></div>`;

/* ---------- autocomplete ---------- */
function attachAC(input,{source,onPick,render,keepOpenOnEmpty=false}){
  let list=null,items=[],act=0;
  const wrap=input.parentElement;wrap.classList.add("ac");
  function close(){if(list){list.remove();list=null}}
  function draw(){
    const q=input.value.trim();if(!q&&!keepOpenOnEmpty){close();return}
    items=source(q).slice(0,12);act=0;
    if(!items.length){close();return}
    if(!list){list=document.createElement("div");list.className="ac-list";wrap.appendChild(list)}
    list.innerHTML=items.map((it,i)=>`<div class="ac-item ${i===act?"act":""}" data-i="${i}">${render?render(it,q):esc(it.label)}</div>`).join("");
    list.querySelectorAll(".ac-item").forEach(el=>el.addEventListener("mousedown",e=>{e.preventDefault();choose(+el.dataset.i)}));
  }
  function choose(i){const it=items[i];if(!it)return;close();onPick(it,input)}
  input.addEventListener("input",draw);
  input.addEventListener("focus",()=>{if(keepOpenOnEmpty||input.value.trim())draw()});
  input.addEventListener("blur",()=>setTimeout(close,120));
  input.addEventListener("keydown",e=>{
    if(!list)return;const els=list.querySelectorAll(".ac-item");
    if(e.key==="ArrowDown"){e.preventDefault();act=Math.min(act+1,items.length-1)}
    else if(e.key==="ArrowUp"){e.preventDefault();act=Math.max(act-1,0)}
    else if(e.key==="Enter"){e.preventDefault();choose(act);return}
    else if(e.key==="Escape"){e.stopPropagation();close();return}else return;
    els.forEach((el,i)=>el.classList.toggle("act",i===act));els[act]&&els[act].scrollIntoView({block:"nearest"});
  });
}
function patientSource(q){const tk=norm(q).split(/\s+/).filter(Boolean);
  return S.patients.filter(p=>{const h=norm([p.nom,p.prenom,p.dossier,p.tel,p.cin].join(" "));return tk.every(x=>h.includes(x))}).slice(0,12)
  .map(p=>({p,label:fullName(p)}))}
const patientRender=(it,q)=>{const tk=norm(q).split(/\s+/).filter(Boolean),p=it.p;return`<div class="avatar ${p.sexe==="F"?"f":""}">${initials(p)}</div><div><div class="b">${hl(shortName(p),tk)}</div><small>${t("dossier")} ${hl(p.dossier,tk)} · ${ageStr(p.dob)} · ${hl(p.tel||"",tk)}</small></div>`};
function medSource(q){const tk=norm(q).split(/\s+/).filter(Boolean);
  return S.meds.filter(m=>{const h=norm(m.nom+" "+m.dci+" "+m.classe);return tk.every(x=>h.includes(x))}).slice(0,12).map(m=>({m,label:m.nom}))}
const medRender=(it,q)=>{const tk=norm(q).split(/\s+/).filter(Boolean),m=it.m;return`<div class="ico">${I("meds")}</div><div><div class="b">${hl(m.nom,tk)}</div><small>${hl(m.dci,tk)} · ${esc(m.classe)} · ${esc(m.forme)}</small></div>`};
