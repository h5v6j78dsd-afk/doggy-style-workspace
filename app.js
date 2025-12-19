/* =========================================================
   Doggy Style Workspace – FINAL OPTION B (ENDGÜLTIG)
   ✔ Keine toten Dokumente
   ✔ Editor unabhängig von Tabs
========================================================= */

const LS_KEY = "ds_option_b_final";

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let state = JSON.parse(localStorage.getItem(LS_KEY)) || {
  dogs: [],
  docs: []
};

function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/* ================= NAVIGATION (NUR HAUPTSEITEN) ================= */
function activateTab(tabId){
  $$(".tab").forEach(b=>b.classList.remove("is-active"));
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if(btn) btn.classList.add("is-active");

  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  document.getElementById(tabId).classList.add("is-active");

  if(tabId==="documents") renderDocs();
  if(tabId==="dogs") renderDogs();
}

$$(".tab").forEach(btn=>{
  btn.onclick=()=>activateTab(btn.dataset.tab);
});

/* ================= EDITOR STEUERUNG ================= */
function showEditor(){
  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  document.getElementById("editor").classList.add("is-active");
}

function closeEditor(){
  currentDoc = null;
  activateTab("documents");
}

/* ================= START ================= */
$("#templateSelect").innerHTML = `
  <option value="hundeannahme">Hundeannahme / Betreuungsvertrag</option>
`;

$("#btnNewDoc").onclick = ()=>{
  const doc = {
    id: Date.now().toString(),
    title: "Hundeannahme / Betreuungsvertrag",
    dogId: "",
    fields: {},
    signature: "",
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  state.docs.unshift(doc);
  save();

  openDoc(doc.id);   // 👈 DIREKT IN DEN EDITOR
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
    const el=document.createElement("div");
    el.className="item";
    el.innerHTML=`<strong>${d.name}</strong><small>${d.owner} · ${d.phone}</small>`;
    list.appendChild(el);
  });
}

/* ================= DOKUMENTE ================= */
function renderDocs(){
  const list=$("#docList");
  list.innerHTML="";
  if(!state.docs.length){
    list.innerHTML="<div class='muted'>Noch keine Dokumente.</div>";
    return;
  }
  state.docs.forEach(d=>{
    const el=document.createElement("div");
    el.className="item";
    el.innerHTML=`
      <div>
        <strong>${d.title}</strong>
        <small>
          ${new Date(d.updatedAt).toLocaleString("de-DE")}
          ${d.locked ? " · 🔒 abgeschlossen" : ""}
        </small>
      </div>
      <button class="smallbtn">Öffnen</button>
    `;
    el.querySelector("button").onclick=()=>openDoc(d.id);
    list.appendChild(el);
  });
}

/* ================= EDITOR ================= */
let currentDoc=null;
let sig=null;

function openDoc(id){
  currentDoc=state.docs.find(d=>d.id===id);
  if(!currentDoc) return;

  $("#editorTitle").textContent=currentDoc.title;
  $("#editorMeta").textContent="Rechtssichere Hundeannahme / Betreuungsvertrag";
  $("#docName").value=currentDoc.title;

  renderEditorForm();
  initSignature();
  if(currentDoc.signature) sig.load(currentDoc.signature);

  showEditor();   // 👈 EINZIGER WEG IN DEN EDITOR
}

/* ================= SCHLIESSEN ================= */
const btnClose = $("#btnClose");
if(btnClose){
  btnClose.onclick = closeEditor;
}

/* ================= INIT ================= */
activateTab("home");
renderDogs();
renderDocs();