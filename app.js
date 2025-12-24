// ===== gekürzter Kopf unverändert =====
const LS_KEY="ds_workspace_v1";
const state=loadState();
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

// … (alles bis openDoc bleibt UNVERÄNDERT)

// -----------------------------
// openDoc – bereinigt
// -----------------------------
function openDoc(id){
  currentDoc=(state.docs||[]).find(d=>d.id===id);
  if(!currentDoc) return;

  $("#editorTitle").textContent=currentDoc.title||"Dokument";
  $("#editorMeta").textContent=currentDoc.templateName;
  $("#docName").value=currentDoc.title||"";
  syncDogSelect();
  $("#dogSelect").value=currentDoc.dogId||state.dogs?.[0]?.id||"";

  renderForm(currentDoc);

  $("#dsGvoText").textContent =
    getTemplate(currentDoc.templateId)?.dsGvoNote || "";

  dirty=false;
  showPanel("editor");
  window.scrollTo({top:0,behavior:"smooth"});
}

// -----------------------------
// Formular + Signatur-Button
// -----------------------------
function renderForm(docObj){
  const root=$("#formRoot");
  root.innerHTML="";

  const t=getTemplate(docObj.templateId);

  t.sections.forEach(sec=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<h2>${escapeHtml(sec.title)}</h2>`;
    sec.fields.forEach(f=>card.appendChild(renderField(f, docObj.fields[f.key])));
    root.appendChild(card);
  });

  const meta=document.createElement("div");
  meta.className="card";
  meta.innerHTML="<h2>Ort / Datum</h2>";
  t.meta.forEach(f=>meta.appendChild(renderField(f, docObj.meta[f.key])));
  root.appendChild(meta);

  // ⭐ NEU: Signatur-Button
  const sigCard=document.createElement("div");
  sigCard.className="card";
  sigCard.innerHTML=`
    <h2>Unterschrift</h2>
    <button id="btnSignatureOpen" class="primary">
      ✍️ Unterschrift erfassen
    </button>
  `;
  root.appendChild(sigCard);
}

// -----------------------------
// Overlay-Signatur (Weg A)
// -----------------------------
function openSignatureOverlay(onDone){
  const overlay=document.createElement("div");
  overlay.style.cssText=
    "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;"+
    "display:flex;align-items:center;justify-content:center";

  overlay.innerHTML=`
    <div style="background:#fff;border-radius:14px;padding:12px;
                width:92%;max-width:560px">
      <canvas id="sigCanvas"
        style="width:100%;height:180px;
               background:#fff;border:1px solid #ccc;border-radius:10px">
      </canvas>
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
  const ratio=Math.max(window.devicePixelRatio||1,1);
  const w=canvas.clientWidth, h=canvas.clientHeight;

  canvas.width=w*ratio;
  canvas.height=h*ratio;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.lineWidth=2.5;
  ctx.lineCap="round";

  let draw=false,lx=0,ly=0;
  const pos=e=>{
    const r=canvas.getBoundingClientRect();
    const p=e.touches?e.touches[0]:e;
    return {x:p.clientX-r.left,y:p.clientY-r.top};
  };

  const start=e=>{draw=true;({x:lx,y:ly}=pos(e));e.preventDefault();};
  const move=e=>{
    if(!draw) return;
    const p=pos(e);
    ctx.beginPath();
    ctx.moveTo(lx,ly);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
    lx=p.x; ly=p.y;
    e.preventDefault();
  };
  const end=()=>draw=false;

  canvas.addEventListener("mousedown",start);
  canvas.addEventListener("mousemove",move);
  window.addEventListener("mouseup",end);
  canvas.addEventListener("touchstart",start,{passive:false});
  canvas.addEventListener("touchmove",move,{passive:false});
  canvas.addEventListener("touchend",end);

  overlay.querySelector("#sigClear").onclick=
    ()=>ctx.clearRect(0,0,canvas.width,canvas.height);

  overlay.querySelector("#sigCancel").onclick=close;

  overlay.querySelector("#sigOk").onclick=()=>{
    onDone(canvas.toDataURL("image/png"));
    close();
  };

  function close(){
    document.body.style.overflow="";
    overlay.remove();
  }
}

// -----------------------------
// Button → Overlay
// -----------------------------
document.addEventListener("click",e=>{
  if(e.target?.id==="btnSignatureOpen"){
    e.preventDefault();
    openSignatureOverlay(data=>{
      if(currentDoc){
        currentDoc.signatureDataUrl=data;
        dirty=true;
      }
    });
  }
});

// ===== Rest (Save / Print / Export / Boot) bleibt UNVERÄNDERT =====