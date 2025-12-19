/* =========================================================
   Doggy Style Workspace – STUFE 2
   Dokument + Hund/Kunde-Zuordnung
========================================================= */

const LS_KEY = "ds_stage2_state";

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let state = JSON.parse(localStorage.getItem(LS_KEY)) || {
  dogs: [],
  docs: []
};

function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/* ================= NAVIGATION ================= */
$$(".tab").forEach(btn=>{
  btn.onclick=()=>{
    $$(".tab").forEach(b=>b.classList.remove("is-active"));
    btn.classList.add("is-active");
    $$(".panel").forEach(p=>p.classList.remove("is-active"));
    document.getElementById(btn.dataset.tab).classList.add("is-active");

    if(btn.dataset.tab==="documents") renderDocs();
    if(btn.dataset.tab==="dogs") renderDogs();
  };
});

/* ================= START ================= */
$("#templateSelect").innerHTML = `
  <option value="simple">Einfaches Dokument</option>
`;

$("#btnNewDoc").onclick = ()=>{
  const doc = {
    id: Date.now().toString(),
    title: "Neues Dokument",
    text: "",
    dogId: "",
    updatedAt: Date.now()
  };
  state.docs.unshift(doc);
  save();
  openDoc(doc.id);
};

/* ================= HUNDE / KUNDEN ================= */
$("#btnAddDog").onclick = ()=>{
  const name = prompt("Name des Hundes:");
  if(!name) return;
  const owner = prompt("Name Halter:");
  const phone = prompt("Telefon:");

  state.dogs.push({
    id: Date.now().toString(),
    name,
    owner,
    phone
  });

  save();
  renderDogs();
};

function renderDogs(){
  const list = $("#dogList");
  list.innerHTML = "";

  if(!state.dogs.length){
    list.innerHTML = "<div class='muted'>Noch keine Hunde/Kunden.</div>";
    return;
  }

  state.dogs.forEach(d=>{
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <strong>${d.name}</strong>
        <small>${d.owner || ""} · ${d.phone || ""}</small>
      </div>
    `;
    list.appendChild(el);
  });
}

/* ================= DOKUMENTE ================= */
function renderDocs(){
  const list = $("#docList");
  list.innerHTML = "";

  if(!state.docs.length){
    list.innerHTML = "<div class='muted'>Noch keine Dokumente.</div>";
    return;
  }

  state.docs.forEach(d=>{
    const dog = state.dogs.find(x=>x.id===d.dogId);
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <strong>${d.title}</strong>
        <small>
          ${dog ? "🐕 " + dog.name + " · " : ""}
          ${new Date(d.updatedAt).toLocaleString("de-DE")}
        </small>
      </div>
      <div class="actions">
        <button class="smallbtn">Öffnen</button>
      </div>
    `;
    el.querySelector("button").onclick = ()=>openDoc(d.id);
    list.appendChild(el);
  });
}

/* ================= EDITOR ================= */
let currentDoc = null;

function openDoc(id){
  currentDoc = state.docs.find(d=>d.id===id);
  if(!currentDoc) return;

  $("#editorTitle").textContent = currentDoc.title;
  $("#editorMeta").textContent = "Einfaches Dokument";
  $("#docName").value = currentDoc.title;

  const root = $("#formRoot");
  root.innerHTML = "";

  // Hund/Kunde Auswahl
  const dogCard = document.createElement("div");
  dogCard.className = "card";
  dogCard.innerHTML = "<h2>Hund / Kunde</h2>";

  const sel = document.createElement("select");
  sel.innerHTML =
    `<option value="">– bitte auswählen –</option>` +
    state.dogs.map(d=>`<option value="${d.id}">${d.name} (${d.owner||""})</option>`).join("");
  sel.value = currentDoc.dogId;
  sel.onchange = ()=>{
    currentDoc.dogId = sel.value;
  };

  dogCard.appendChild(sel);
  root.appendChild(dogCard);

  // Dokumentinhalt
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>Inhalt</h2>
    <textarea id="docText" placeholder="Text eingeben...">${currentDoc.text || ""}</textarea>
  `;
  root.appendChild(card);

  showPanel("editor");
}

/* ================= SPEICHERN ================= */
$("#btnSave").onclick = ()=>{
  if(!currentDoc) return;

  currentDoc.title = $("#docName").value || currentDoc.title;
  currentDoc.text = $("#docText").value;
  currentDoc.updatedAt = Date.now();

  save();
  alert("Gespeichert ✅");
};

/* ================= SCHLIESSEN ================= */
$("#btnClose").onclick = ()=>{
  showPanel("documents");
  renderDocs();
};

/* ================= PRINT (Dummy) ================= */
$("#btnPrint").onclick = ()=>{
  alert("PDF/Druck kommt später 🙂");
};

/* ================= INIT ================= */
function showPanel(id){
  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  document.getElementById(id).classList.add("is-active");
}

showPanel("home");
renderDogs();
renderDocs();