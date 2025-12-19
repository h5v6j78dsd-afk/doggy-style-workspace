/* =========================================================
   Doggy Style Workspace – STUFE 1
   Dokument öffnen · bearbeiten · speichern · erneut öffnen
========================================================= */

const LS_KEY = "ds_stage1_state";

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let state = JSON.parse(localStorage.getItem(LS_KEY)) || {
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
    updatedAt: Date.now()
  };
  state.docs.unshift(doc);
  save();
  openDoc(doc.id);
};

/* ================= DOKUMENTE ================= */
function renderDocs(){
  const list = $("#docList");
  list.innerHTML = "";

  if(!state.docs.length){
    list.innerHTML = "<div class='muted'>Noch keine Dokumente.</div>";
    return;
  }

  state.docs.forEach(d=>{
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <strong>${d.title}</strong>
        <small>${new Date(d.updatedAt).toLocaleString("de-DE")}</small>
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
  alert("PDF/Druck kommt in Stufe 5 🙂");
};

/* ================= INIT ================= */
function showPanel(id){
  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  document.getElementById(id).classList.add("is-active");
}

showPanel("home");
renderDocs();