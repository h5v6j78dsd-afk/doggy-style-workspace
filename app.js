/* =========================================================
   Doggy Style Workspace – FINAL VERSION
   Offline · iPad · iPhone · Pflichtfelder · PDF · Hunde/Kunden
========================================================= */

const LS_KEY = "ds_workspace_final";

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

/* =========================================================
   TEMPLATES (2B – mehrere Dokumente)
========================================================= */
const templates = [
  {
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
          { key:"hund_alter", label:"Alter / Geburtsdatum", type:"text", required:true }
        ]
      },
      {
        title: "Angaben zum Halter",
        fields: [
          { key:"halter_name", label:"Name", type:"text", required:true },
          { key:"halter_adresse", label:"Adresse", type:"textarea", required:true },
          { key:"halter_tel", label:"Telefon", type:"text", required:true }
        ]
      },
      {
        title: "Gesundheit & Verhalten",
        fields: [
          { key:"impfung", label:"Impfschutz vollständig", type:"checkbox", required:true },
          { key:"krankheiten", label:"Krankheiten / Besonderheiten", type:"textarea" }
        ]
      },
      {
        title: "Haftung & Vereinbarung",
        fields: [
          { key:"haftung", label:"Angaben wahrheitsgemäß", type:"checkbox", required:true },
          { key:"agb", label:"AGB akzeptiert", type:"checkbox", required:true }
        ]
      }
    ],
    meta: [
      { key:"ort_datum", label:"Ort / Datum", type:"text", required:true }
    ]
  },

  {
    id: "tagesbetreuung",
    name: "Tagesbetreuung",
    dsGvoNote: "Datenschutz gemäß DSGVO.",
    sections: [
      {
        title: "Betreuungsdaten",
        fields: [
          { key:"datum", label:"Datum", type:"text", required:true },
          { key:"uhrzeit", label:"Uhrzeit", type:"text", required:true }
        ]
      }
    ],
    meta: [{ key:"ort_datum", label:"Ort / Datum", type:"text", required:true }]
  },

  {
    id: "urlaubsbetreuung",
    name: "Urlaubsbetreuung",
    dsGvoNote: "Datenschutz gemäß DSGVO.",
    sections: [
      {
        title: "Zeitraum",
        fields: [
          { key:"von", label:"Von", type:"text", required:true },
          { key:"bis", label:"Bis", type:"text", required:true }
        ]
      }
    ],
    meta: [{ key:"ort_datum", label:"Ort / Datum", type:"text", required:true }]
  },

  {
    id: "notfall",
    name: "Notfall- & Tierarzt-Einwilligung",
    dsGvoNote: "Datenschutz gemäß DSGVO.",
    sections: [
      {
        title: "Notfall",
        fields: [
          { key:"tierarzt", label:"Tierarzt / Klinik", type:"textarea", required:true },
          { key:"einwilligung", label:"Behandlung im Notfall erlaubt", type:"checkbox", required:true }
        ]
      }
    ],
    meta: [{ key:"ort_datum", label:"Ort / Datum", type:"text", required:true }]
  }
];

/* =========================================================
   Navigation
========================================================= */
function showPanel(id){
  $$(".panel").forEach(p => p.classList.remove("is-active"));
  $("#" + id)?.classList.add("is-active");
}

$$(".tab").forEach(btn=>{
  btn.onclick = () => {
    $$(".tab").forEach(b=>b.classList.remove("is-active"));
    btn.classList.add("is-active");
    showPanel(btn.dataset.tab);
    if(btn.dataset.tab==="documents") renderDocs();
    if(btn.dataset.tab==="dogs") renderDogs();
  };
});

/* =========================================================
   Templates Select
========================================================= */
function initTemplates(){
  $("#templateSelect").innerHTML =
    templates.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
}

/* =========================================================
   Hunde / Kunden
========================================================= */
$("#btnAddDog").onclick = () => {
  const name = prompt("Name des Hundes:");
  if(!name) return;
  const owner = prompt("Name Halter:");
  const phone = prompt("Telefon:");
  state.dogs.push({ id: uid(), name, owner, phone });
  saveState();
  renderDogs();
};

function renderDogs(){
  const list = $("#dogList");
  list.innerHTML = "";
  if(!state.dogs.length){
    list.innerHTML = "<div class='muted'>Noch keine Hunde/Kunden angelegt.</div>";
    return;
  }
  state.dogs.forEach(d=>{
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <strong>${d.name}</strong>
        <small>${d.owner||""} · ${d.phone||""}</small>
      </div>
      <div class="actions">
        <button class="smallbtn">✏️</button>
        <button class="smallbtn">🗑️</button>
      </div>`;
    el.querySelectorAll("button")[0].onclick = ()=>{
      d.name = prompt("Name", d.name) || d.name;
      d.owner = prompt("Halter", d.owner) || d.owner;
      d.phone = prompt("Telefon", d.phone) || d.phone;
      saveState(); renderDogs();
    };
    el.querySelectorAll("button")[1].onclick = ()=>{
      if(confirm("Wirklich löschen?")){
        state.dogs = state.dogs.filter(x=>x.id!==d.id);
        saveState(); renderDogs();
      }
    };
    list.appendChild(el);
  });
}

/* =========================================================
   Dokumente
========================================================= */
let currentDoc = null;
let sig = null;
let dirty = false;

$("#btnNewDoc").onclick = () => {
  const tid = $("#templateSelect").value;
  const t = templates.find(x=>x.id===tid);
  const doc = {
    id: uid(),
    templateId: t.id,
    title: t.name,
    dogId: "",
    fields: {},
    meta: {},
    signature: "",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.docs.unshift(doc);
  saveState();
  openDoc(doc.id);
};

function renderDocs(){
  const list = $("#docList");
  list.innerHTML = "";
  if(!state.docs.length){
    list.innerHTML = "<div class='muted'>Noch keine Dokumente.</div>";
    return;
  }
  state.docs.forEach(d=>{
    const dt = new Date(d.updatedAt).toLocaleString("de-DE");
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div><strong>${d.title}</strong><small>Zuletzt: ${dt}</small></div>
      <div class="actions">
        <button class="smallbtn">Öffnen</button>
        <button class="smallbtn">🗑️</button>
      </div>`;
    el.querySelectorAll("button")[0].onclick=()=>openDoc(d.id);
    el.querySelectorAll("button")[1].onclick=()=>{
      if(confirm("Dokument löschen?")){
        state.docs=state.docs.filter(x=>x.id!==d.id);
        saveState(); renderDocs();
      }
    };
    list.appendChild(el);
  });
}

function openDoc(id){
  currentDoc = state.docs.find(d=>d.id===id);
  const t = templates.find(x=>x.id===currentDoc.templateId);

  $("#editorTitle").textContent = currentDoc.title;
  $("#editorMeta").textContent = t.name;
  $("#docName").value = currentDoc.title;

  renderForm(t);
  initSig();
  if(currentDoc.signature) sig.from(currentDoc.signature);
  $("#dsGvoText").textContent = t.dsGvoNote;

  showPanel("editor");
}

/* =========================================================
   Formular
========================================================= */
function renderForm(t){
  const root = $("#formRoot");
  root.innerHTML = "";

  // Hund/Kunde Pflichtfeld
  const dogCard = document.createElement("div");
  dogCard.className="card";
  dogCard.innerHTML="<h2>Hund / Kunde *</h2>";
  const sel = document.createElement("select");
  sel.innerHTML = `<option value="">– bitte auswählen –</option>` +
    state.dogs.map(d=>`<option value="${d.id}">${d.name} (${d.owner||""})</option>`).join("");
  sel.value = currentDoc.dogId;
  sel.onchange = ()=>{ currentDoc.dogId = sel.value; dirty=true; };
  dogCard.appendChild(sel);
  root.appendChild(dogCard);

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
      else{ i=document.createElement("input"); i.type="text"; }
      i.dataset.key=f.key;
      if(f.type==="checkbox") i.checked=!!currentDoc.fields[f.key];
      else i.value=currentDoc.fields[f.key]||"";
      i.oninput=()=>dirty=true;
      i.onchange=()=>dirty=true;
      l.appendChild(i); c.appendChild(l);
    });
    root.appendChild(c);
  });

  const meta=document.createElement("div");
  meta.className="card";
  meta.innerHTML="<h2>Ort / Datum *</h2>";
  const mInp=document.createElement("input");
  mInp.value=currentDoc.meta.ort_datum||"";
  mInp.oninput=()=>dirty=true;
  mInp.dataset.key="ort_datum";
  meta.appendChild(mInp);
  root.appendChild(meta);
}

/* =========================================================
   Validierung + Speichern
========================================================= */
$("#btnSave").onclick = ()=>{
  const t = templates.find(x=>x.id===currentDoc.templateId);
  const missing=[];

  if(!currentDoc.dogId) missing.push("Hund/Kunde");

  $$("#formRoot [data-key]").forEach(i=>{
    if(i.type==="checkbox"){
      if(i.required && !i.checked) missing.push(i.previousSibling.textContent);
      currentDoc.fields[i.dataset.key]=i.checked;
    }else if(i.dataset.key==="ort_datum"){
      if(!i.value) missing.push("Ort / Datum");
      currentDoc.meta.ort_datum=i.value;
    }else{
      if(i.required && !i.value) missing.push(i.previousSibling.textContent);
      currentDoc.fields[i.dataset.key]=i.value;
    }
  });

  if(!currentDoc.signature) missing.push("Unterschrift");

  if(missing.length){
    alert("Bitte noch ausfüllen:\n\n• " + [...new Set(missing)].join("\n• "));
    return;
  }

  currentDoc.title = $("#docName").value || currentDoc.title;
  currentDoc.updatedAt = Date.now();
  saveState();
  dirty=false;
  alert("Gespeichert ✅");
};

/* =========================================================
   Signature (iOS SAFE)
========================================================= */
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
  c.onpointerup=()=>{draw=false; currentDoc.signature=c.toDataURL()};
  sig={
    data:()=>currentDoc.signature,
    from:u=>{const i=new Image();i.onload=()=>{resize();ctx.drawImage(i,0,0,c.width,c.height)};i.src=u},
    clear:()=>{resize();currentDoc.signature="";}
  };
  $("#btnSigClear").onclick=()=>sig.clear();
}

/* =========================================================
   PDF / Drucken & Schließen
========================================================= */
$("#btnPrint").onclick = () => window.print();
$("#btnClose").onclick = () => {
  if(dirty && !confirm("Änderungen verwerfen?")) return;
  showPanel("documents");
  renderDocs();
};

/* =========================================================
   Einstellungen
========================================================= */
$("#btnWipe").onclick = ()=>{
  if(confirm("Alle lokalen Daten löschen?")){
    localStorage.removeItem(LS_KEY);
    location.reload();
  }
};

/* =========================================================
   Export
========================================================= */
$("#btnExportAll").onclick = ()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="DoggyStyle_Backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

/* =========================================================
   Init
========================================================= */
initTemplates();
showPanel("home");