/* =========================================================
   Doggy Style Workspace – FINAL STABLE VERSION
   Offline · iPad · iPhone · Rechtssicher
========================================================= */

const LS_KEY = "ds_workspace_v2";

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

function loadState(){
  try{
    return JSON.parse(localStorage.getItem(LS_KEY)) || { dogs: [], docs: [] };
  }catch{
    return { dogs: [], docs: [] };
  }
}
function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}
const state = loadState();

/* ---------- Template: GROSSE HUNDEANNAHME ---------- */
const templates = [{
  id: "hundeannahme",
  name: "Hundeannahme / Betreuungsvertrag",
  dsGvoNote:
`Ich willige ein, dass meine personenbezogenen Daten gemäß DSGVO
zum Zweck der Betreuung meines Hundes verarbeitet und gespeichert werden.`,
  sections: [
    {
      title: "Angaben zum Hund",
      fields: [
        { key:"hund_name", label:"Name des Hundes", type:"text", required:true },
        { key:"hund_rasse", label:"Rasse", type:"text", required:true },
        { key:"hund_geb", label:"Geburtsdatum / Alter", type:"text", required:true },
        { key:"hund_geschlecht", label:"Geschlecht", type:"text", required:true },
        { key:"hund_kastriert", label:"Kastriert", type:"checkbox" }
      ]
    },
    {
      title: "Angaben zum Hundehalter",
      fields: [
        { key:"halter_name", label:"Name", type:"text", required:true },
        { key:"halter_adresse", label:"Adresse", type:"textarea", required:true },
        { key:"halter_tel", label:"Telefon", type:"text", required:true },
        { key:"halter_email", label:"E-Mail", type:"text" }
      ]
    },
    {
      title: "Gesundheit & Impfstatus",
      fields: [
        { key:"impfung_voll", label:"Impfschutz vollständig", type:"checkbox", required:true },
        { key:"entwurmt", label:"Regelmäßig entwurmt", type:"checkbox", required:true },
        { key:"parasitenfrei", label:"Frei von Parasiten", type:"checkbox", required:true },
        { key:"krankheiten", label:"Bekannte Krankheiten / Allergien", type:"textarea" }
      ]
    },
    {
      title: "Verhalten & Besonderheiten",
      fields: [
        { key:"vertraeglich_hunde", label:"Verträglich mit anderen Hunden", type:"checkbox" },
        { key:"vertraeglich_menschen", label:"Verträglich mit Menschen", type:"checkbox" },
        { key:"laeufigkeit", label:"Bei Hündinnen: läufig", type:"checkbox" },
        { key:"besonderheiten", label:"Besonderheiten / Hinweise", type:"textarea" }
      ]
    },
    {
      title: "Notfall & Tierarzt",
      fields: [
        { key:"tierarzt", label:"Tierarzt / Klinik", type:"textarea", required:true },
        { key:"notfall_erlaubnis", label:"Einwilligung zur tierärztlichen Behandlung im Notfall", type:"checkbox", required:true }
      ]
    },
    {
      title: "Haftung & Vereinbarung",
      fields: [
        { key:"haftung", label:"Ich bestätige die Richtigkeit aller Angaben", type:"checkbox", required:true },
        { key:"agb", label:"AGB gelesen und akzeptiert", type:"checkbox", required:true }
      ]
    }
  ],
  meta: [
    { key:"ort_datum", label:"Ort / Datum", type:"text", required:true }
  ]
}];

/* ---------- Navigation ---------- */
function showPanel(id){
  $$(".panel").forEach(p => p.classList.remove("is-active"));
  $("#" + id)?.classList.add("is-active");
}
$$(".tab").forEach(btn=>{
  btn.onclick=()=>{
    $$(".tab").forEach(b=>b.classList.remove("is-active"));
    btn.classList.add("is-active");
    showPanel(btn.dataset.tab);
    if(btn.dataset.tab==="documents") renderDocs();
    if(btn.dataset.tab==="dogs") renderDogs();
  };
});

/* ---------- Templates ---------- */
function initTemplates(){
  $("#templateSelect").innerHTML =
    templates.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
}

/* ---------- Dogs ---------- */
$("#btnAddDog").onclick=()=>{
  const name = prompt("Name des Hundes:");
  if(!name) return;
  const owner = prompt("Name Halter:");
  const phone = prompt("Telefon:");
  state.dogs.push({id:uid(), name, owner, phone});
  saveState(); renderDogs();
};

function renderDogs(){
  const list=$("#dogList"); list.innerHTML="";
  if(!state.dogs.length){
    list.innerHTML="<div class='muted'>Noch keine Hunde angelegt.</div>";
    return;
  }
  state.dogs.forEach(d=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<div><strong>${d.name}</strong><small>${d.owner||""} · ${d.phone||""}</small></div>
      <div class="actions">
        <button class="smallbtn">✏️</button>
        <button class="smallbtn">🗑️</button>
      </div>`;
    div.querySelectorAll("button")[0].onclick=()=>{
      d.name=prompt("Name",d.name)||d.name;
      d.owner=prompt("Halter",d.owner)||d.owner;
      d.phone=prompt("Telefon",d.phone)||d.phone;
      saveState(); renderDogs();
    };
    div.querySelectorAll("button")[1].onclick=()=>{
      if(confirm("Wirklich löschen?")){
        state.dogs=state.dogs.filter(x=>x.id!==d.id);
        saveState(); renderDogs();
      }
    };
    list.appendChild(div);
  });
}

/* ---------- Documents ---------- */
let currentDoc=null, sig=null, dirty=false;

$("#btnNewDoc").onclick=()=>{
  const t=templates[0];
  const doc={
    id:uid(),
    templateId:t.id,
    title:t.name,
    fields:{},
    meta:{},
    signature:"",
    createdAt:Date.now(),
    updatedAt:Date.now()
  };
  state.docs.unshift(doc);
  saveState();
  openDoc(doc.id);
};

function openDoc(id){
  currentDoc=state.docs.find(d=>d.id===id);
  if(!currentDoc) return;
  const t=templates[0];
  $("#editorTitle").textContent=currentDoc.title;
  $("#editorMeta").textContent=t.name;
  $("#docName").value=currentDoc.title;
  renderForm(t);
  initSig();
  if(currentDoc.signature) sig.from(currentDoc.signature);
  $("#dsGvoText").textContent=t.dsGvoNote;
  showPanel("editor");
}

function renderDocs(){
  const list=$("#docList"); list.innerHTML="";
  if(!state.docs.length){
    list.innerHTML="<div class='muted'>Noch keine Dokumente.</div>";
    return;
  }
  state.docs.forEach(d=>{
    const div=document.createElement("div");
    const dt=new Date(d.updatedAt).toLocaleString("de-DE");
    div.className="item";
    div.innerHTML=`<div><strong>${d.title}</strong><small>Zuletzt: ${dt}</small></div>
      <div class="actions">
        <button class="smallbtn">Öffnen</button>
        <button class="smallbtn">🗑️</button>
      </div>`;
    div.querySelectorAll("button")[0].onclick=()=>openDoc(d.id);
    div.querySelectorAll("button")[1].onclick=()=>{
      if(confirm("Dokument löschen?")){
        state.docs=state.docs.filter(x=>x.id!==d.id);
        saveState(); renderDocs();
      }
    };
    list.appendChild(div);
  });
}

/* ---------- Form ---------- */
function renderForm(t){
  const root=$("#formRoot"); root.innerHTML="";
  t.sections.forEach(sec=>{
    const c=document.createElement("div");
    c.className="card";
    c.innerHTML=`<h2>${sec.title}</h2>`;
    sec.fields.forEach(f=>{
      const l=document.createElement("label");
      l.className="field";
      l.innerHTML=`<span>${f.label}${f.required?" *":""}</span>`;
      let i;
      if(f.type==="textarea") i=document.createElement("textarea");
      else if(f.type==="checkbox"){ i=document.createElement("input"); i.type="checkbox"; }
      else{ i=document.createElement("input"); i.type=f.type; }
      i.dataset.key=f.key;
      if(f.type==="checkbox") i.checked=!!currentDoc.fields[f.key];
      else i.value=currentDoc.fields[f.key]||"";
      i.oninput=()=>dirty=true;
      i.onchange=()=>dirty=true;
      l.appendChild(i); c.appendChild(l);
    });
    root.appendChild(c);
  });
  const m=document.createElement("div");
  m.className="card"; m.innerHTML="<h2>Ort / Datum</h2>";
  const inp=document.createElement("input");
  inp.value=currentDoc.meta.ort_datum||"";
  inp.oninput=()=>dirty=true;
  inp.dataset.key="ort_datum";
  m.appendChild(inp); root.appendChild(m);
}

/* ---------- Save ---------- */
$("#btnSave").onclick=()=>{
  if(!currentDoc) return;
  $$("#formRoot [data-key]").forEach(i=>{
    if(i.type==="checkbox") currentDoc.fields[i.dataset.key]=i.checked;
    else if(i.dataset.key==="ort_datum") currentDoc.meta.ort_datum=i.value;
    else currentDoc.fields[i.dataset.key]=i.value;
  });
  currentDoc.title=$("#docName").value||currentDoc.title;
  currentDoc.signature=sig?.data()||"";
  currentDoc.updatedAt=Date.now();
  saveState();
  dirty=false;
  alert("Gespeichert ✅");
};

/* ---------- Signature ---------- */
function initSig(){
  const c=$("#sigPad"),ctx=c.getContext("2d");
  const resize=()=>{
    const r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;
    c.width=r.width*d; c.height=r.height*d;
    ctx.setTransform(d,0,0,d,0,0);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,r.width,r.height);
    ctx.strokeStyle="#111"; ctx.lineWidth=2.5; ctx.lineCap="round";
  };
  resize();
  let draw=false,last=null;
  const pos=e=>{const b=c.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top}};
  c.onpointerdown=e=>{c.setPointerCapture(e.pointerId);draw=true;last=pos(e);dirty=true};
  c.onpointermove=e=>{if(!draw)return;const p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p};
  c.onpointerup=()=>draw=false;
  sig={
    data:()=>c.toDataURL(),
    from:u=>{const i=new Image();i.onload=()=>{resize();ctx.drawImage(i,0,0,c.width,c.height)};i.src=u},
    clear:()=>resize()
  };
  $("#btnSigClear").onclick=()=>sig.clear();
}

/* ---------- Settings ---------- */
$("#btnWipe").onclick=()=>{
  if(confirm("Alle lokalen Daten löschen?")){
    localStorage.removeItem(LS_KEY);
    location.reload();
  }
};

/* ---------- Export ---------- */
$("#btnExportAll").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="DoggyStyle_Backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

/* ---------- Init ---------- */
initTemplates();
showPanel("home");