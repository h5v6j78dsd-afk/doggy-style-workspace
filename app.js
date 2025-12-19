/* =========================================================
   Doggy Style Workspace – CORE APP (RESET VERSION)
   passend zur neuen index.html
========================================================= */

const LS_KEY = "ds_workspace_core_v1";

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

/* ---------- State ---------- */
function loadState(){
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || { dogs: [], docs: [] };
  } catch (e) {
    return { dogs: [], docs: [] };
  }
}

/* =========================================================
   TEMPLATES (große Hundeannahme + Urlaub)
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
          { key:"hund_geb", label:"Geburtsdatum / Alter", type:"date", required:true }
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
      { key:"ort_datum", label:"Ort / Datum", type:"date", required:true }
    ]
  },

  {
    id: "urlaubsbetreuung",
    name: "Urlaubsbetreuung",
    dsGvoNote: "Datenschutz gemäß DSGVO.",
    sections: [
      {
        title: "Betreuungszeitraum",
        fields: [
          { key:"von", label:"Von", type:"date", required:true },
          { key:"bis", label:"Bis", type:"date", required:true }
        ]
      }
    ],
    meta: [
      { key:"ort_datum", label:"Ort / Datum", type:"date", required:true }
    ]
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
    $$(".tab").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    showPanel(btn.dataset.tab);

    if(btn.dataset.tab === "documents") renderDocs();
    if(btn.dataset.tab === "dogs") renderDogs();
  };
});

/* =========================================================
   Template-Auswahl
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
    const docs = state.docs.filter(doc => doc.dogId === d.id);
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <strong>${d.name}</strong>
        <small>${d.owner || ""} · ${d.phone || ""}</small>
        ${docs.length ? `<div class="muted">Dokumente:</div>` : ""}
        ${docs.map(doc => `
          <div class="muted">
            📄 <a href="#" data-doc="${doc.id}">${doc.title}</a>
          </div>
        `).join("")}
      </div>
      <div class="actions">
        <button class="smallbtn" data-edit>✏️</button>
        <button class="smallbtn" data-del>🗑️</button>
      </div>
    `;

    el.querySelectorAll("[data-doc]").forEach(a=>{
      a.onclick = e => {
        e.preventDefault();
        openDoc(a.dataset.doc);
      };
    });

    el.querySelector("[data-edit]").onclick = ()=>{
      d.name = prompt("Name", d.name) || d.name;
      d.owner = prompt("Halter", d.owner) || d.owner;
      d.phone = prompt("Telefon", d.phone) || d.phone;
      saveState(); renderDogs();
    };

    el.querySelector("[data-del]").onclick = ()=>{
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
    const dog = state.dogs.find(x=>x.id===d.dogId);
    const dt = new Date(d.updatedAt).toLocaleString("de-DE");

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <strong>${d.title}</strong>
        <small>${dog ? dog.name + " · " : ""}${dt}</small>
      </div>
      <div class="actions">
        <button class="smallbtn" data-open>Öffnen</button>
        <button class="smallbtn" data-del>🗑️</button>
      </div>
    `;

    el.querySelector("[data-open]").onclick = ()=>openDoc(d.id);
    el.querySelector("[data-del]").onclick = ()=>{
      if(confirm("Dokument löschen?")){
        state.docs = state.docs.filter(x=>x.id!==d.id);
        saveState(); renderDocs();
      }
    };

    list.appendChild(el);
  });
}

/* =========================================================
   Dokument öffnen
========================================================= */
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
   Formular rendern
========================================================= */
function renderForm(t){
  const root = $("#formRoot");
  root.innerHTML = "";

  /* Hund/Kunde Pflicht */
  const dogCard = document.createElement("div");
  dogCard.className = "card";
  dogCard.innerHTML = "<h2>Hund / Kunde *</h2>";
  const sel = document.createElement("select");
  sel.innerHTML = `<option value="">– bitte auswählen –</option>` +
    state.dogs.map(d=>`<option value="${d.id}">${d.name} (${d.owner||""})</option>`).join("");
  sel.value = currentDoc.dogId;
  sel.onchange = ()=>{ currentDoc.dogId = sel.value; dirty = true; };
  dogCard.appendChild(sel);
  root.appendChild(dogCard);

  t.sections.forEach(sec=>{
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `<h2>${sec.title}</h2>`;

    sec.fields.forEach(f=>{
      const l = document.createElement("label");
      l.className = "field";
      l.innerHTML = `<span>${f.label}${f.required?" *":""}</span>`;
      let i;
      if(f.type === "textarea") i = document.createElement("textarea");
      else{
        i = document.createElement("input");
        i.type = f.type || "text";
      }
      i.dataset.key = f.key;
      i.required = !!f.required;

      if(f.type === "checkbox") i.checked = !!currentDoc.fields[f.key];
      else i.value = currentDoc.fields[f.key] || "";

      i.oninput = ()=>dirty = true;
      i.onchange = ()=>dirty = true;

      l.appendChild(i);
      c.appendChild(l);
    });

    root.appendChild(c);
  });

  const meta = document.createElement("div");
  meta.className = "card";
  meta.innerHTML = "<h2>Ort / Datum *</h2>";
  const m = document.createElement("input");
  m.type = "date";
  m.value = currentDoc.meta.ort_datum || "";
  m.oninput = ()=>dirty = true;
  m.dataset.key = "ort_datum";
  m.required = true;
  meta.appendChild(m);
  root.appendChild(meta);
}

/* =========================================================
   Speichern + Validierung
========================================================= */
$("#btnSave").onclick = ()=>{
  const missing = [];

  if(!currentDoc.dogId) missing.push("Hund / Kunde");

  $$("#formRoot [data-key]").forEach(i=>{
    if(i.type === "checkbox"){
      currentDoc.fields[i.dataset.key] = i.checked;
      if(i.required && !i.checked) missing.push(i.previousSibling.textContent);
    }else{
      currentDoc.fields[i.dataset.key] = i.value;
      if(i.required && !i.value) missing.push(i.previousSibling.textContent);
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
  dirty = false;
  alert("Gespeichert ✅");
};

/* =========================================================
   Unterschrift (stabil)
========================================================= */
function initSig(){
  const c = $("#sigPad");
  const ctx = c.getContext("2d");

  function resize(){
    const r = c.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    c.width = r.width * d;
    c.height = r.height * d;
    ctx.setTransform(d,0,0,d,0,0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,r.width,r.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }

  resize();
  let draw = false, last = null;

  const pos = e => {
    const b = c.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };

  c.onpointerdown = e=>{
    c.setPointerCapture(e.pointerId);
    draw = true;
    last = pos(e);
    dirty = true;
  };
  c.onpointermove = e=>{
    if(!draw) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
    last = p;
  };
  c.onpointerup = ()=>{
    draw = false;
    currentDoc.signature = c.toDataURL("image/png");
  };

  sig = {
    from: url=>{
      const img = new Image();
      img.onload = ()=>{
        resize();
        ctx.drawImage(img,0,0,c.width/(window.devicePixelRatio||1),c.height/(window.devicePixelRatio||1));
      };
      img.src = url;
    },
    clear: ()=>{
      resize();
      currentDoc.signature = "";
    }
  };

  $("#btnSigClear").onclick = ()=>sig.clear();
}

/* =========================================================
   Drucken / Schließen
========================================================= */
$("#btnPrint").onclick = ()=>window.print();
$("#btnClose").onclick = ()=>{
  if(dirty && !confirm("Änderungen verwerfen?")) return;
  showPanel("documents");
  renderDocs();
};

/* =========================================================
   Einstellungen & Export
========================================================= */
$("#btnWipe").onclick = ()=>{
  if(confirm("Alle lokalen Daten löschen?")){
    localStorage.removeItem(LS_KEY);
    location.reload();
  }
};

$("#btnExportAll").onclick = ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "DoggyStyle_Backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

/* =========================================================
   Init
========================================================= */
initTemplates();
showPanel("home");