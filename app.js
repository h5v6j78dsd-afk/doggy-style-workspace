/* =========================================================
   Doggy Style Workspace – app.js (Signature FINAL)
   Master-sicher: NUR Unterschrift-Logik angepasst
========================================================= */

const LS_KEY = "doggy_style_workspace_master";

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let state = JSON.parse(localStorage.getItem(LS_KEY)) || {
  dogs: [],
  documents: []
};

let currentDoc = null;
let sigPad = null;
let sigCtx = null;
let drawing = false;

/* ================= STATE ================= */

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/* ================= PANEL ================= */

function activatePanel(id) {
  $$(".panel").forEach(p => p.classList.remove("is-active"));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add("is-active");
}

/* ================= NAV ================= */

$$(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    activatePanel(tab.dataset.tab);
    if (tab.dataset.tab === "documents") renderDocuments();
    if (tab.dataset.tab === "dogs") renderDogs();
  });
});

/* ================= START ================= */

$("#btnNewDoc")?.addEventListener("click", () => {
  const doc = {
    id: Date.now().toString(),
    type: "Hundeannahme / Betreuungsvertrag",
    data: {},
    signature: {
      dataUrl: null,
      locked: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  state.documents.unshift(doc);
  saveState();
  openDocument(doc.id);
});

/* ================= DOKUMENTE ================= */

function renderDocuments() {
  const list = $("#docList");
  if (!list) return;
  list.innerHTML = "";

  state.documents.forEach(doc => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div>
        <strong>${doc.type}</strong>
        <small>${new Date(doc.updatedAt).toLocaleString("de-DE")}</small>
      </div>
      <button class="smallbtn">Öffnen</button>
    `;
    item.querySelector("button").onclick = () => openDocument(doc.id);
    list.appendChild(item);
  });
}

/* ================= EDITOR ================= */

function openDocument(id) {
  const doc = state.documents.find(d => d.id === id);
  if (!doc) return;

  currentDoc = doc;

  $("#editorTitle").textContent = doc.type;
  $("#docName").value = doc.type;

  activatePanel("editor");
  setupSignature();
}

/* ================= SIGNATUR ================= */

function setupSignature() {
  sigPad = $("#sigPad");
  if (!sigPad) return;

  sigCtx = sigPad.getContext("2d");
  sigCtx.lineWidth = 2;
  sigCtx.lineCap = "round";
  sigCtx.strokeStyle = "#000";

  resizeCanvas();

  // bestehende Unterschrift laden
  if (currentDoc.signature?.dataUrl) {
    const img = new Image();
    img.onload = () => sigCtx.drawImage(img, 0, 0, sigPad.width, sigPad.height);
    img.src = currentDoc.signature.dataUrl;
  }

  // wenn gesperrt → KEINE Events
  if (currentDoc.signature?.locked) return;

  sigPad.addEventListener("pointerdown", startDraw);
  sigPad.addEventListener("pointermove", draw);
  sigPad.addEventListener("pointerup", endDraw);
  sigPad.addEventListener("pointerleave", endDraw);
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  sigPad.width  = sigPad.offsetWidth * ratio;
  sigPad.height = sigPad.offsetHeight * ratio;
  sigCtx.scale(ratio, ratio);
}

function startDraw(e) {
  drawing = true;
  sigCtx.beginPath();
  sigCtx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {
  if (!drawing) return;
  sigCtx.lineTo(e.offsetX, e.offsetY);
  sigCtx.stroke();
}

function endDraw() {
  drawing = false;
}

/* ================= SPEICHERN ================= */

$("#btnSave")?.addEventListener("click", () => {
  if (!currentDoc) return;

  if (!currentDoc.signature.locked) {
    currentDoc.signature.dataUrl = sigPad.toDataURL("image/png");
    currentDoc.signature.locked = true;
  }

  currentDoc.updatedAt = Date.now();
  saveState();

  alert("Dokument gespeichert – Unterschrift ist jetzt gesperrt.");
});

/* ================= SCHLIESSEN ================= */

$("#btnClose")?.addEventListener("click", () => {
  currentDoc = null;
  activatePanel("documents");
  renderDocuments();
});

/* ================= HUNDE ================= */

$("#btnAddDog")?.addEventListener("click", () => {
  const name = prompt("Name des Hundes:");
  if (!name) return;

  const owner = prompt("Halter:");
  const phone = prompt("Telefon:");

  state.dogs.push({
    id: Date.now().toString(),
    name,
    owner,
    phone
  });

  saveState();
  renderDogs();
});

function renderDogs() {
  const list = $("#dogList");
  if (!list) return;
  list.innerHTML = "";

  state.dogs.forEach(d => {
    const item = document.createElement("div");
    item.className = "item";
    item.textContent = `${d.name} – ${d.owner}`;
    list.appendChild(item);
  });
}

/* ================= INIT ================= */

activatePanel("home");
renderDocuments();
renderDogs();