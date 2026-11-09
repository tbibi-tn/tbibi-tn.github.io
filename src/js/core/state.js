/* =========================================================
   TBIBI — app state & storage
   ========================================================= */
const APP="Tbibi",APP_AR="طبيبي";
const LS_PREF="tbibi.prefs.v1";
let S=null;
const UI={lang:"fr",theme:"light",route:["today"],jDate:null,jDoctor:"",pFilter:{q:"",chip:"all",sort:"nom",dir:1,limit:150},wkOffset:0,statsPeriod:"month",locked:false};

function loadPrefs(){
  try{const p=JSON.parse(localStorage.getItem(LS_PREF)||"{}");Object.assign(UI,{lang:p.lang||"fr",theme:p.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),secHint:!!p.secHint});}catch(e){}
}
/* returns false when the encrypted vault must be unlocked first */
async function loadData(){
  if(await readVault())return false;
  try{S=(await kvGet("data"))||null}catch(e){S=null}
  if(!S||!S.patients){S=buildDemo();save();}
  migrateData();
  return true;
}
/* bring older saved data up to the current shape */
function migrateData(){
  if(!S||!S.settings)return;
  delete S.settings.pin;
  ["payments","rdv","templates","meds"].forEach(k=>S[k]=S[k]||[]);
  S.settings.doctor=S.settings.doctor||{};
  if(S.settings.doctor.autoStamp===undefined)S.settings.doctor.autoStamp=true;
}
function save(){return persist()}
function savePrefs(){try{localStorage.setItem(LS_PREF,JSON.stringify({lang:UI.lang,theme:UI.theme,secHint:UI.secHint}))}catch(e){}}
