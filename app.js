const LS_KEY="ds_workspace_v1";
const state=loadState();
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

function showPanel(id){
  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  const el=document.getElementById(id);
  if(el) el.classList.add("is-active");
}

$$(".tab").forEach(b=>b.addEventListener("click",()=>{
  $$(".tab").forEach(x=>x.classList.toggle("is-active",x===b));
  showPanel(b.dataset.tab);
}));

let templates=[];
async function loadTemplates(){
  const res=await fetch("templates/hundeannahme.json");
  templates=[await res.json()];
  $("#templateSelect").innerHTML=templates.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
}
const getTemplate=id=>templates.find(t=>t.id===id);

function uid(){return Math.random().toString(16).slice(2)+Date.now().toString(16);}
function escapeHtml(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function loadState(){try{const raw=localStorage.getItem(LS_KEY);return raw?JSON.parse(raw):{dogs:[],docs:[]};}catch{return {dogs:[],docs:[]};}}
function saveState(){localStorage.setItem(LS_KEY,JSON.stringify(state));}

function ensureDefaultDog(){
  if(!state.dogs || state.dogs.length===0){
    state.dogs=[{id:uid(),name:"— Bitte auswählen —",owner:"",phone:"",isPlaceholder:true}];
  }
}
function syncDogSelect(){
  ensureDefaultDog();
  $("#dogSelect").innerHTML=state.dogs.map(d=>{
    const label=d.isPlaceholder?d.name:`${d.owner?d.owner+" – ":""}${d.name}`;
    return `<option value="${d.id}">${escapeHtml(label)}</option>`;
  }).join("");
}
function renderDogs(){
  ensureDefaultDog();
  const list=$("#dogList");
  list.innerHTML="";
  const dogs=state.dogs.filter(d=>!d.isPlaceholder);
  dogs.forEach(d=>{
    const el=document.createElement("div");
    el.className="item";
    el.innerHTML=`<div><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(d.owner||"")} · ${escapeHtml(d.phone||"")}</small></div>
      <div class="actions"><button class="smallbtn" data-e="1">Bearbeiten</button><button class="smallbtn" data-d="1">Löschen</button></div>`;
    el.querySelector('[data-e="1"]').onclick=()=>editDog(d.id);
    el.querySelector('[data-d="1"]').onclick=()=>{
      if(confirm("Hund/Kunde wirklich löschen?")){
        state.dogs=state.dogs.filter(x=>x.id!==d.id);
        saveState(); renderDogs();
      }
    };
    list.appendChild(el);
  });
  if(!dogs.length) list.innerHTML=`<div class="muted">Noch keine Hunde/Kunden angelegt.</div>`;
  syncDogSelect();
}
$("#btnAddDog").addEventListener("click",()=>{
  const name=prompt("Name Hund (z.B. Bello):");
  if(!name) return;
  const owner=prompt("Name Halter (z.B. Müller):")||"";
  const phone=prompt("Telefon Halter:")||"";
  state.dogs.push({id:uid(),name,owner,phone,note:""});
  saveState(); renderDogs();
});
function editDog(id){
  const d=state.dogs.find(x=>x.id===id);
  if(!d) return;
  d.name=prompt("Name Hund:",d.name) ?? d.name;
  d.owner=prompt("Name Halter:",d.owner||"") ?? (d.owner||"");
  d.phone=prompt("Telefon:",d.phone||"") ?? (d.phone||"");
  saveState(); renderDogs();
}

function renderDocs(){
  const list=$("#docList");
  list.innerHTML="";
  const docs=(state.docs||[]).slice().sort((a,b)=>b.updatedAt-a.updatedAt);
  docs.forEach(d=>list.appendChild(docItem(d)));
  if(!docs.length) list.innerHTML=`<div class="muted">Noch keine Dokumente erstellt.</div>`;
  renderRecent();
}
function renderRecent(){
  const list=$("#recentList");
  const docs=(state.docs||[]).slice().sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,3);
  list.innerHTML="";
  docs.forEach(d=>list.appendChild(docItem(d)));
  if(!docs.length) list.innerHTML=`<div class="muted">Noch keine Dokumente.</div>`;
}
function docItem(d){
  const el=document.createElement("div");
  el.className="item";
  const dt=new Date(d.updatedAt).toLocaleString("de-DE");
  el.innerHTML=`<div><strong>${escapeHtml(d.title||"Dokument")}</strong><small>${escapeHtml(d.templateName)} · zuletzt: ${dt}</small></div>
    <div class="actions"><button class="smallbtn" data-o="1">Öffnen</button><button class="smallbtn" data-p="1">PDF</button><button class="smallbtn" data-x="1">Löschen</button></div>`;
  el.querySelector('[data-o="1"]').onclick=()=>openDoc(d.id);
  el.querySelector('[data-p="1"]').onclick=()=>{openDoc(d.id); setTimeout(()=>printDoc(),150);};
  el.querySelector('[data-x="1"]').onclick=()=>{
    if(confirm("Dokument wirklich löschen?")){
      state.docs=state.docs.filter(x=>x.id!==d.id);
      saveState(); renderDocs();
    }
  };
  return el;
}

$("#btnNewDoc").addEventListener("click",()=>createDoc($("#templateSelect").value));
function createDoc(tid){
  const t=getTemplate(tid);
  if(!t) return;
  const now=Date.now();
  const docObj={id:uid(),templateId:t.id,templateName:t.name,title:t.name,dogId:state.dogs?.[0]?.id||"",fields:{},signatureDataUrl:"",meta:{ort_datum:""},createdAt:now,updatedAt:now};
  state.docs=state.docs||[];
  state.docs.unshift(docObj);
  saveState();
  openDoc(docObj.id);
}

let currentDoc=null, sig=null, dirty=false;

function openDoc(id){
  currentDoc=(state.docs||[]).find(d=>d.id===id);
  if(!currentDoc) return;
  $("#editorTitle").textContent=currentDoc.title||"Dokument";
  $("#editorMeta").textContent=currentDoc.templateName;
  $("#docName").value=currentDoc.title||"";
  syncDogSelect();
  $("#dogSelect").value=currentDoc.dogId||state.dogs?.[0]?.id||"";
  renderForm(currentDoc);
  initSig();
  if(currentDoc.signatureDataUrl) sig.from(currentDoc.signatureDataUrl);
  $("#dsGvoText").textContent=getTemplate(currentDoc.templateId)?.dsGvoNote||"";
  dirty=false;
  showPanel("editor");
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderForm(docObj){
  const root=$("#formRoot"); root.innerHTML="";
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
  meta.innerHTML=`<h2>Ort / Datum</h2>`;
  t.meta.forEach(f=>meta.appendChild(renderField(f, docObj.meta[f.key])));
  root.appendChild(meta);
}
function renderField(f,value){
  const wrap=document.createElement("label");
  wrap.className="field"; wrap.style.minWidth="260px";
  wrap.innerHTML=`<span>${escapeHtml(f.label)}${f.required?" *":""}</span>`;
  let input;
  if(f.type==="textarea"){ input=document.createElement("textarea"); input.value=value||""; }
  else if(f.type==="select"){ input=document.createElement("select"); input.innerHTML=(f.options||[]).map(o=>`<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join(""); input.value=value||(f.options?.[0]||""); }
  else if(f.type==="checkbox"){ input=document.createElement("input"); input.type="checkbox"; input.checked=!!value; input.style.width="22px"; input.style.height="22px"; }
  else { input=document.createElement("input"); input.type=f.type||"text"; input.value=value||""; }
  input.dataset.key=f.key; input.dataset.ftype=f.type;
  input.oninput=()=>dirty=true; input.onchange=()=>dirty=true;
  wrap.appendChild(input);
  return wrap;
}

$("#docName").addEventListener("input",()=>dirty=true);
$("#dogSelect").addEventListener("change",()=>dirty=true);

$("#btnSave").addEventListener("click",()=>saveCurrent(true));
$("#btnClose").addEventListener("click",()=>{
  if(dirty && !confirm("Änderungen sind nicht gespeichert. Schließen?")) return;
  $$(".tab").forEach((t,i)=>t.classList.toggle("is-active", i===0));
  showPanel("home");
  renderDocs();
});

function collectForm(){
  const t=getTemplate(currentDoc.templateId);
  const fields={}, meta={};
  $$("#formRoot [data-key]").forEach(inp=>{
    const key=inp.dataset.key, type=inp.dataset.ftype;
    const val=(type==="checkbox")?inp.checked:inp.value;
    if(t.meta.some(m=>m.key===key)) meta[key]=val; else fields[key]=val;
  });
  return {fields, meta};
}
function validate(docObj,t){
  const errs=[];
  t.sections.forEach(sec=>sec.fields.forEach(f=>{
    if(!f.required) return;
    const v=docObj.fields[f.key];
    if(f.type==="checkbox"){ if(!v) errs.push(f.label); }
    else { if(!v || String(v).trim()==="") errs.push(f.label); }
  }));
  t.meta.forEach(f=>{ if(f.required){const v=docObj.meta[f.key]; if(!v||String(v).trim()==="") errs.push(f.label);} });
  if(!docObj.signatureDataUrl || docObj.signatureDataUrl.length<800) errs.push("Unterschrift");
  return errs;
}
function saveCurrent(alertOk){
  if(!currentDoc) return false;
  const t=getTemplate(currentDoc.templateId);
  const {fields, meta}=collectForm();
  currentDoc.title=$("#docName").value.trim()||currentDoc.templateName;
  currentDoc.dogId=$("#dogSelect").value;
  currentDoc.fields=fields;
  currentDoc.meta=meta;
  currentDoc.signatureDataUrl=sig?.data() || currentDoc.signatureDataUrl;
  currentDoc.updatedAt=Date.now();
  const errs=validate(currentDoc,t);
  if(errs.length){
    alert("Bitte noch ausfüllen/abhaken:\n\n• "+errs.join("\n• "));
    return false;
  }
  saveState();
  dirty=false;
  $("#editorTitle").textContent=currentDoc.title;
  if(alertOk) alert("Gespeichert ✅");
  renderDocs();
  return true;
}

function initSig(){
  const canvas = document.getElementById("sigPad");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const HEIGHT = 140; // <<< schmaler Block wie gewünscht
  const ratio = Math.max(window.devicePixelRatio || 1, 1);

  // feste Größe – KEIN Resize bei Scroll!
  const width = canvas.offsetWidth;
  canvas.width  = Math.floor(width * ratio);
  canvas.height = Math.floor(HEIGHT * ratio);
  canvas.style.height = HEIGHT + "px";

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, HEIGHT);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";

  let drawing = false;
  let lastX = 0, lastY = 0;

  function pos(e){
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  }

  function down(e){
    e.preventDefault();
    const p = pos(e);
    drawing = true;
    lastX = p.x;
    lastY = p.y;
  }

  function move(e){
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
  }

  function up(){
    drawing = false;
  }

  // Touch + Maus (bewusst KEINE PointerEvents)
  canvas.addEventListener("touchstart", down, { passive:false });
  canvas.addEventListener("touchmove",  move, { passive:false });
  canvas.addEventListener("touchend",   up);

  canvas.addEventListener("mousedown", down);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup",   up);

  // API für bestehende Logik
  window.sig = {
    clear(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="#fff";
      ctx.fillRect(0,0,width,HEIGHT);
    },
    data(){
      return canvas.toDataURL("image/png");
    }
  };

  const btn = document.getElementById("btnSigClear");
  if (btn) btn.onclick = () => window.sig.clear();
}

  resize();

  let drawing = false;

  function pos(e){
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }

  function down(e){
    e.preventDefault();
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e){
    if(!drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function up(e){
    drawing = false;
  }

  canvas.addEventListener("mousedown", down);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", up);
  canvas.addEventListener("mouseleave", up);

  canvas.addEventListener("touchstart", down, { passive:false });
  canvas.addEventListener("touchmove", move, { passive:false });
  canvas.addEventListener("touchend", up);
  canvas.addEventListener("touchcancel", up);

  window.sig = {
    clear(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="#fff";
      ctx.fillRect(0,0,canvas.width/ratio,HEIGHT);
    },
    data(){
      return canvas.toDataURL("image/png");
    }
  };

  const btn = document.getElementById("btnSigClear");
  if(btn) btn.onclick = ()=>window.sig.clear();
}

$("#btnPrint").addEventListener("click",()=>printDoc());
function printDoc(){
  if(!currentDoc) return;
  if(!saveCurrent(false)) return;
  const t=getTemplate(currentDoc.templateId);
  const dog=state.dogs.find(d=>d.id===currentDoc.dogId) || null;
  const html=buildPrintHtml(currentDoc,t,dog);
  const win=window.open("","_blank");
  if(!win){ alert("Popup blockiert. Bitte Popups erlauben."); return; }
  win.document.open(); win.document.write(html); win.document.close();
  win.focus();
  setTimeout(()=>win.print(),300);
}

function buildPrintHtml(docObj,t,dog){
  const dt=new Date(docObj.updatedAt).toLocaleString("de-DE");
  const dogLine=dog && !dog.isPlaceholder ? `${dog.owner?escapeHtml(dog.owner)+" – ":""}${escapeHtml(dog.name)}` : "—";
  const sigImg=docObj.signatureDataUrl?`<img class="sig" src="${docObj.signatureDataUrl}" alt="Unterschrift" />`:"";
  let out=`<div class="head"><div><h1>${escapeHtml(docObj.title||t.name)}</h1><div class="meta">Hund/Kunde: ${dogLine} · Stand: ${dt}</div></div><img class="logo" src="assets/logo.png" /></div>`;
  t.sections.forEach(sec=>{
    out+=`<h2>${escapeHtml(sec.title)}</h2><table>`;
    sec.fields.forEach(f=>{
      let v=docObj.fields[f.key];
      if(f.type==="checkbox") v=v?"Ja":"Nein";
      out+=`<tr><td class="k">${escapeHtml(f.label)}</td><td class="v">${escapeHtml(String(v??""))}</td></tr>`;
    });
    out+=`</table>`;
  });
  out+=`<h2>Ort / Datum</h2><table><tr><td class="k">Ort / Datum</td><td class="v">${escapeHtml(docObj.meta.ort_datum||"")}</td></tr></table>`;
  out+=`<h2>Unterschrift Hundehalter</h2><div class="sigbox">${sigImg}</div>`;
  out+=`<h2>Datenschutz (DSGVO)</h2><p class="note">${escapeHtml(t.dsGvoNote||"")}</p>`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(docObj.title||"Dokument")}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,sans-serif;margin:28px;color:#111}
.head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:18px}
.logo{height:44px}
h1{margin:0;font-size:20px}
.meta{color:#555;font-size:12px;margin-top:2px}
h2{margin:18px 0 8px;font-size:14px}
table{width:100%;border-collapse:collapse;font-size:12px}
td{padding:8px 10px;border:1px solid #ddd;vertical-align:top}
td.k{width:38%;background:#fafafa;font-weight:700}
.sigbox{border:1px solid #ddd;border-radius:12px;height:120px;display:flex;align-items:center;justify-content:center;background:#fff}
.sig{max-height:105px;max-width:95%}
.note{font-size:11px;color:#444;line-height:1.35}
@media print{body{margin:16mm}}
</style></head><body>${out}</body></html>`;
}

$("#btnExportAll").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  const stamp=new Date().toISOString().slice(0,10);
  a.href=URL.createObjectURL(blob);
  a.download=`DoggyStyleWorkspace_Backup_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#btnWipe").addEventListener("click",()=>{
  if(!confirm("Wirklich alle lokalen Daten löschen?")) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
});

(async function boot(){
  await loadTemplates();
  ensureDefaultDog();
  saveState();
  renderDogs();
  renderDocs();
  showPanel("home");
})();