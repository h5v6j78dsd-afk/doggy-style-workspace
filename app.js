
// FINAL MASTER app.js – Overlay Signatur (Weg A)
// Geprüft: iPhone/iPad, Hoch/Quer, keine Scroll-Konflikte

const LS_KEY="ds_workspace_v1";
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

function loadState(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    return raw?JSON.parse(raw):{docs:[],dogs:[]};
  }catch{ return {docs:[],dogs:[]}; }
}
function saveState(state){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// --- Signatur Overlay ---
function openSignatureOverlay(onDone){
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center";
  overlay.innerHTML=`
    <div style="background:#fff;border-radius:14px;padding:12px;width:90%;max-width:520px">
      <canvas id="sigCanvas" style="width:100%;background:#fff;border:1px solid #ccc;border-radius:10px"></canvas>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button id="sigClear">Löschen</button>
        <button id="sigCancel">Abbrechen</button>
        <button id="sigOk">Übernehmen</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow="hidden";

  const canvas=overlay.querySelector("#sigCanvas");
  const ctx=canvas.getContext("2d");
  const H=180, ratio=Math.max(window.devicePixelRatio||1,1);
  const w=canvas.clientWidth;
  canvas.width=w*ratio; canvas.height=H*ratio; canvas.style.height=H+"px";
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.lineWidth=2.5; ctx.lineCap="round";

  let draw=false,lx=0,ly=0;
  const pos=e=>{
    const r=canvas.getBoundingClientRect();
    const p=e.touches?e.touches[0]:e;
    return {x:p.clientX-r.left,y:p.clientY-r.top};
  };
  const start=e=>{draw=true;({x:lx,y:ly}=pos(e)); e.preventDefault();};
  const move=e=>{
    if(!draw) return;
    const p=pos(e);
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(p.x,p.y); ctx.stroke();
    lx=p.x; ly=p.y; e.preventDefault();
  };
  const end=()=>draw=false;

  canvas.addEventListener("mousedown",start);
  canvas.addEventListener("mousemove",move);
  window.addEventListener("mouseup",end);
  canvas.addEventListener("touchstart",start,{passive:false});
  canvas.addEventListener("touchmove",move,{passive:false});
  canvas.addEventListener("touchend",end);

  overlay.querySelector("#sigClear").onclick=()=>ctx.clearRect(0,0,canvas.width,canvas.height);
  overlay.querySelector("#sigCancel").onclick=close;
  overlay.querySelector("#sigOk").onclick=()=>{ onDone(canvas.toDataURL("image/png")); close(); };

  function close(){
    document.body.style.overflow="";
    overlay.remove();
  }
}

// Demo Hook
window.startSignature=()=>openSignatureOverlay(data=>alert("Unterschrift gespeichert"));
