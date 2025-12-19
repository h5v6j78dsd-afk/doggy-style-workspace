/* =========================================================
   Doggy Style Workspace – FINAL app.js
   Offline · iOS · iPad · PWA SAFE
========================================================= */

const LS_KEY = "ds_workspace_v1";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ===================== TEMPLATE (EINGEBETTET) ===================== */
const templates = [
  {
    id: "hundeannahme",
    name: "Hundeannahme",
    dsGvoNote:
      "Ich willige ein, dass meine personenbezogenen Daten zum Zweck der Betreuung meines Hundes gespeichert und verarbeitet werden.",
    sections: [
      {
        title: "Angaben zum Hund",
        fields: [
          { key: "hund_name", label: "Name des Hundes", type: "text", required: true },
          { key: "hund_rasse", label: "Rasse", type: "text", required: true },
          { key: "hund_alter", label: "Alter", type: "text", required: true }
        ]
      },
      {
        title: "Angaben zum Halter",
        fields: [
          { key: "halter_name", label: "Name Halter", type: "text", required: true },
          { key: "halter_tel", label: "Telefon", type: "text", required: true }
        ]
      },
      {
        title: "Betreuung",
        fields: [
          { key: "zeitraum", label: "Betreuungszeitraum", type: "text", required: true },
          { key: "besonderheiten", label: "Besonderheiten", type: "textarea" },
          { key: "agb", label: "AGB akzeptiert", type: "checkbox", required: true }
        ]
      }
    ],
    meta: [
      { key: "ort_datum", label: "Ort / Datum", type: "text", required: true }
    ]
  }
];

/* ===================== STATE ===================== */
function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

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

/* ===================== UI HELPERS ===================== */
function showPanel(id){
  $$(".panel").forEach(p => p.classList.remove("is-active"));
  $("#" + id)?.classList.add("is-active");
}

$$(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    showPanel(btn.dataset.tab);
  });
});

/* ===================== TEMPLATE SELECT ===================== */
function initTemplates(){
  const sel = $("#templateSelect");
  sel.innerHTML = templates
    .map(t => `<option value="${t.id}">${t.name}</option>`)
    .join("");
}

/* ===================== DOCUMENTS ===================== */
let currentDoc = null;
let sig = null;
let dirty = false;

$("#btnNewDoc").addEventListener("click", () => {
  const tid = $("#templateSelect").value;
  const t = templates.find(x => x.id === tid);
  if(!t) return;

  const now = Date.now();
  const doc = {
    id: uid(),
    templateId: t.id,
    title: t.name,
    fields: {},
    meta: {},
    signatureDataUrl: "",
    createdAt: now,
    updatedAt: now
  };

  state.docs.unshift(doc);
  saveState();
  openDoc(doc.id);
});

function openDoc(id){
  currentDoc = state.docs.find(d => d.id === id);
  if(!currentDoc) return;

  const t = templates.find(x => x.id === currentDoc.templateId);

  $("#editorTitle").textContent = currentDoc.title;
  $("#editorMeta").textContent = t.name;
  $("#docName").value = currentDoc.title;

  renderForm(t);
  initSig();
  if(currentDoc.signatureDataUrl) sig.from(currentDoc.signatureDataUrl);

  $("#dsGvoText").textContent = t.dsGvoNote;
  showPanel("editor");
}

function renderForm(t){
  const root = $("#formRoot");
  root.innerHTML = "";

  t.sections.forEach(sec => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h2>${sec.title}</h2>`;

    sec.fields.forEach(f => {
      const label = document.createElement("label");
      label.className = "field";
      label.innerHTML = `<span>${f.label}${f.required ? " *" : ""}</span>`;

      let input;
      if(f.type === "textarea"){
        input = document.createElement("textarea");
      }else if(f.type === "checkbox"){
        input = document.createElement("input");
        input.type = "checkbox";
      }else{
        input = document.createElement("input");
        input.type = f.type || "text";
      }

      input.dataset.key = f.key;
      input.dataset.type = f.type;
      input.value = currentDoc.fields[f.key] || "";
      input.oninput = () => dirty = true;
      input.onchange = () => dirty = true;

      label.appendChild(input);
      card.appendChild(label);
    });

    root.appendChild(card);
  });

  const meta = document.createElement("div");
  meta.className = "card";
  meta.innerHTML = `<h2>Ort / Datum</h2>`;

  t.meta.forEach(f => {
    const label = document.createElement("label");
    label.className = "field";
    label.innerHTML = `<span>${f.label}</span>`;
    const input = document.createElement("input");
    input.value = currentDoc.meta[f.key] || "";
    input.dataset.key = f.key;
    input.oninput = () => dirty = true;
    label.appendChild(input);
    meta.appendChild(label);
  });

  root.appendChild(meta);
}

/* ===================== SAVE ===================== */
$("#btnSave").addEventListener("click", saveCurrent);

function saveCurrent(){
  if(!currentDoc) return;

  $$("#formRoot [data-key]").forEach(inp => {
    const key = inp.dataset.key;
    if(inp.type === "checkbox"){
      currentDoc.fields[key] = inp.checked;
    }else{
      currentDoc.fields[key] = inp.value;
    }
  });

  currentDoc.title = $("#docName").value || currentDoc.title;
  currentDoc.signatureDataUrl = sig?.data() || "";
  currentDoc.updatedAt = Date.now();

  saveState();
  dirty = false;
  alert("Gespeichert ✅");
}

/* ===================== SIGNATURE ===================== */
function initSig(){
  const canvas = $("#sigPad");
  const ctx = canvas.getContext("2d");

  function resize(){
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,r.width,r.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }

  resize();
  window.addEventListener("resize", resize);

  let draw = false;
  let last = null;

  const pos = e => {
    const b = canvas.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };

  canvas.onpointerdown = e => {
    canvas.setPointerCapture(e.pointerId);
    draw = true;
    last = pos(e);
    dirty = true;
  };

  canvas.onpointermove = e => {
    if(!draw) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  };

  canvas.onpointerup = () => draw = false;
  canvas.onpointercancel = () => draw = false;

  sig = {
    clear(){ resize(); dirty = true; },
    data(){ return canvas.toDataURL("image/png"); },
    from(url){
      const img = new Image();
      img.onload = () => {
        resize();
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
      };
      img.src = url;
    }
  };

  $("#btnSigClear").onclick = () => sig.clear();
}

/* ===================== INIT ===================== */
initTemplates();
showPanel("home");