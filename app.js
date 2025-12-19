/* =========================================================
   Doggy Style Workspace – FINAL OPTION B (EDITOR FIX)
   ✔ Editor wird hart eingeblendet (iOS-sicher)
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

/* ================= PANEL STEUERUNG (ROBUST) ================= */
function hideAllPanels(){
  $$(".panel").forEach(p=>{
    p.classList.remove("is-active");
    p.style.display = "none";
  });
}

function showPanel(id){
  hideAllPanels();
  const p = document.getElementById(id);
  if(p){
    p.classList.add("is-active");
    p.style.display = "block";
    window.scrollTo(0,0);
  }
}

/* ================= NAVIGATION ================= */
$$(".tab").forEach(btn=>{
  btn.onclick=()=>{
    $$(".tab").forEach(b=>b.classList.remove("is-active"));
    btn.classList.add("is-active");
    showPanel(btn.dataset.tab);

    if(btn.dataset.tab==="documents") renderDocs();
    if(btn.dataset.tab==="dogs") renderDogs();
  };
});

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
  openDoc(doc.id);
};

/* ================= DOKUMENTE ================= */
function renderDocs(){
  const list=$("#docList");
  list.innerHTML="";
  state.docs.forEach(d=>{
    const el=document.createElement("div");
    el.className="item";
    el.innerHTML=`
      <div>
        <strong>${d.title}</strong>
        <small>${new Date(d.updatedAt).toLocaleString("de-DE")}</small>
      </div>
      <button class="smallbtn">Öffnen</button>
    `;
    el.querySelector("button").onclick=()=>openDoc(d.id);
    list.appendChild(el);
  });
}

/* ================= HUNDE ================= */
$("#btnAddDog").onclick = ()=>{
  const name = prompt("Name des Hundes:");
  if(!name) return;
  const owner = prompt("Name Halter:");
  const phone = prompt("Telefon:");

  state.dogs.push({ id:Date.now().toString(), name, owner, phone });
  save();
  renderDogs();
};

function renderDogs(){
  const list=$("#dogList");
  list.innerHTML="";
  state.dogs.forEach(d=>{
    const el=document.createElement("div");
    el.className="item";
    el.textContent=`${d.name} – ${d.owner}`;
    list.appendChild(el);
  });
}

/* ================= EDITOR ================= */
let currentDoc=null;

function openDoc(id){
  currentDoc = state.docs.find(d=>d.id===id);
  if(!currentDoc) return;

  $("#editorTitle").textContent=currentDoc.title;
  $("#docName").value=currentDoc.title;

  renderEditorForm();
  showPanel("editor");   // 🔴 JETZT GARANTIERT SICHTBAR
}

/* ================= SCHLIESSEN ================= */
$("#btnClose").onclick = ()=>{
  currentDoc=null;
  showPanel("documents");
  renderDocs();
};

/* ================= INIT ================= */
showPanel("home");
renderDocs();
renderDogs();