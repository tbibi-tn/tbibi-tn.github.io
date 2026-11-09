/* =========================================================
   INIT
   ========================================================= */
function start(){parseHash();render()}
loadPrefs();
document.documentElement.dataset.theme=UI.theme;
(async()=>{
  await storageInit();
  if(await loadData())start();else{UI.locked=true;showUnlock()}
})();
window.addEventListener("hashchange",()=>{if(!S)return;parseHash();if(modalStack.length)while(modalStack.length)closeModal();render();window.scrollTo(0,0)});
setInterval(()=>{if(S&&UI.route[0]==="agenda"&&!modalStack.length&&!VE.open){const nl=$(".nowline");if(nl)render()}},60000);
let _wasMobile=matchMedia("(max-width:820px)").matches;
window.addEventListener("resize",()=>{const now=matchMedia("(max-width:820px)").matches;if(now!==_wasMobile){_wasMobile=now;if(S&&UI.route[0]==="agenda")render()}});
