
/* ================================
   Doggy Style – saubere app.js
   Fix: Navigation + Signatur stabil
   ================================ */

const LS_KEY="ds_workspace_v1";
const state=loadState();
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

/* ---------- Panels & Tabs ---------- */
function showPanel(id){
  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  const el=document.getElementById(id);
  if(el) el.classList.add("is-active");
}
$$(".tab").forEach(b=>b.addEventListener("click",()=>{
  $$(".tab").forEach(x=>x.classList.toggle("is-active",x===b));
  showPanel(b.dataset.tab);
}));

/* ---------- Templates ---------- */
let templates=[];
async function loadTemplates(){
  const res=await fetch("templates/hundeannahme.json");
  templates=[await res.json()];
  $("#templateSelect").innerHTML=templates
    .map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
}
const getTemplate=id=>templates.find(t=>t.id===id);

/* ---------- State ---------- */
function uid(){return Math.random().toString(16).slice(2)+Date.now().toString(16);}
function escapeHtml(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function loadState(){try{const raw=localStorage.getItem(LS_KEY);return raw?JSON.parse(raw):{dogs:[],docs:[]};}catch{return {dogs:[],docs:[]};}}
function saveState(){localStorage.setItem(LS_KEY,JSON.stringify(state));}

/* ---------- Dogs ---------- */
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
    el.innerHTML=`<div><strong>${escapeHtml(d.name)}</strong>
      <small>${escapeHtml(d.owner||"")} · ${escapeHtml(d.phone||"")}</small></div>
      <div class="actions">
        <button class="smallbtn" data-e>Bearbeiten</button>
        <button class="smallbtn" data-d>Löschen</button>
      </div>`;
    el.querySelector("[data-e]").onclick=()=>editDog(d.id);
    el.querySelector("[data-d]").onclick=()=>{
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
  const name=prompt("Name Hund:");
  if(!name) return;
  const owner=prompt("Name Halter:")||"";
  const phone=prompt("Telefon:")||"";
  state.dogs.push({id:uid(),name,owner,phone});
  saveState(); renderDogs();
});
function editDog(id){
  const d=state.dogs.find(x=>x.id===id);
  if(!d) return;
  d.name=prompt("Name Hund:",d.name) ?? d.name;
  d.owner=prompt("Name Halter:",d.owner||"") ?? d.owner;
  d.phone=prompt("Telefon:",d.phone||"") ?? d.phone;
  saveState(); renderDogs();
}

/* ---------- Documents ---------- */
function renderDocs(){
  const list=$("#docList");
  list.innerHTML="";
  const docs=(state.docs||[]).slice().sort((a,b)=>b.updatedAt-a.updatedAt);
  docs.forEach(d=>list.appendChild(docItem(d)));
  if(!docs.length) list.innerHTML=`<div class="muted">Noch keine Dokumente.</div>`;
}
function docItem(d){
  const el=document.createElement("div");
  el.className="item";
  el.innerHTML=`<div><strong>${escapeHtml(d.title)}</strong></div>
    <div class="actions">
      <button class="smallbtn" data-o>Öffnen</button>
      <button class="smallbtn" data-x>Löschen</button>
    </div>`;
  el.querySelector("[data-o]").onclick=()=>openDoc(d.id);
  el.querySelector("[data-x]").onclick=()=>{
    if(confirm("Dokument löschen?")){
      state.docs=state.docs.filter(x=>x.id!==d.id);
      saveState(); renderDocs();
    }
  };
  return el;
}

$("#btnNewDoc").addEventListener("click",()=>createDoc($("#templateSelect").value));
function createDoc(tid){
  const t=getTemplate(tid); if(!t) return;
  const now=Date.now();
  const doc={id:uid(),templateId:t.id,templateName:t.name,title:t.name,fields:{},meta:{},signatureDataUrl:"",createdAt:now,updatedAt:now};
  state.docs.unshift(doc); saveState(); openDoc(doc.id);
}

/* ---------- Editor ---------- */
let currentDoc=null, dirty=false;

function openDoc(id){
  currentDoc=state.docs.find(d=>d.id===id); if(!currentDoc) return;
  $("#docName").value=currentDoc.title;
  renderForm(currentDoc);
  initSig();
  showPanel("editor");
}

/* ---------- Form ---------- */
function renderForm(doc){
  const root=$("#formRoot"); root.innerHTML="";
  const t=getTemplate(doc.templateId);
  t.sections.forEach(sec=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<h2>${sec.title}</h2>`;
    sec.fields.forEach(f=>{
      const i=document.createElement("input");
      i.value=doc.fields[f.key]||"";
      i.oninput=()=>{doc.fields[f.key]=i.value; dirty=true;};
      card.appendChild(i);
    });
    root.appendChild(card);
  });
}

/* ---------- Signature (STABIL) ---------- */
function initSig(){
  const canvas=document.getElementById("sigPad");
  if(!canvas) return;
  const ctx=canvas.getContext("2d");
  const H=140, ratio=Math.max(window.devicePixelRatio||1,1);
  const w=canvas.offsetWidth;
  canvas.width=w*ratio; canvas.height=H*ratio;
  canvas.style.height=H+"px";
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,H);
  ctx.strokeStyle="#111"; ctx.lineWidth=2.4; ctx.lineCap="round";
  let draw=false,lx=0,ly=0;
  const pos=e=>{
    const r=canvas.getBoundingClientRect();
    const p=e.touches?e.touches[0]:e;
    return {x:p.clientX-r.left,y:p.clientY-r.top};
  };
  canvas.onmousedown=e=>{draw=true;({x:lx,y:ly}=pos(e));};
  canvas.onmousemove=e=>{
    if(!draw) return;
    const p=pos(e);
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(p.x,p.y); ctx.stroke();
    lx=p.x; ly=p.y;
  };
  window.onmouseup=()=>draw=false;
  canvas.ontouchstart=e=>{draw=true;({x:lx,y:ly}=pos(e)); e.preventDefault();};
  canvas.ontouchmove=e=>{
    if(!draw) return;
    const p=pos(e);
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(p.x,p.y); ctx.stroke();
    lx=p.x; ly=p.y; e.preventDefault();
  };
  canvas.ontouchend=()=>draw=false;
  window.sig={ data:()=>canvas.toDataURL(), clear:()=>ctx.clearRect(0,0,w,H) };
}

/* ---------- Boot ---------- */
(async function(){
  await loadTemplates();
  ensureDefaultDog();
  renderDogs();
  renderDocs();
  showPanel("home");
})();
