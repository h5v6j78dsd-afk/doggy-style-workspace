/* =========================================================
   Doggy Style Workspace – STUFE 5
   PDF / Drucken (amtlich & archivfähig)
========================================================= */

const LS_KEY = "ds_stage5_state";

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
  <option value="hundeannahme">Hundeannahme / Betreuungsvertrag</option>
`;

$("#btnNewDoc").onclick = ()=>{
  const doc = {
    id: Date.now().toString(),
    title: "Hundeannahme / Betreuungsvertrag",
    dogId: "",
    fields: {},
    signature: "",
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
        <small>${d.owner||""} · ${d.phone||""}</small>
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
          ${dog ? "🐕 "+dog.name+" · " : ""}
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
let sig = null;

function openDoc(id){
  currentDoc = state.docs.find(d=>d.id===id);
  if(!currentDoc) return;

  $("#editorTitle").textContent = currentDoc.title;
  $("#editorMeta").textContent = "Große Hundeannahme";
  $("#docName").value = currentDoc.title;

  renderForm();
  initSignature();
  if(currentDoc.signature) sig.load(currentDoc.signature);

  showPanel("editor");
}

/* ================= FORMULAR (wie STUFE 4) ================= */
function renderForm(){
  const root = $("#formRoot");
  root.innerHTML = "";

  const dog = state.dogs.find(d=>d.id===currentDoc.dogId);

  const info = document.createElement("div");
  info.className = "card";
  info.innerHTML = `
    <h2>Halter / Hund</h2>
    <p><strong>Hund:</strong> ${dog?.name||""}</p>
    <p><strong>Halter:</strong> ${dog?.owner||""}</p>
    <p><strong>Telefon:</strong> ${dog?.phone||""}</p>
  `;
  root.appendChild(info);

  for(const key in currentDoc.fields){
    const row=document.createElement("div");
    row.className="print-row";
    row.innerHTML=`<strong>${key}:</strong> ${currentDoc.fields[key]}`;
    root.appendChild(row);
  }
}

/* ================= SPEICHERN ================= */
$("#btnSave").onclick = ()=>{
  currentDoc.updatedAt = Date.now();
  save();
  alert("Gespeichert ✅");
};

/* ================= DRUCKEN ================= */
$("#btnPrint").onclick = ()=>{
  document.body.classList.add("print-mode");
  setTimeout(()=>{
    window.print();
    document.body.classList.remove("print-mode");
  },300);
};

/* ================= UNTERSCHRIFT ================= */
function initSignature(){
  const canvas = $("#sigPad");
  const ctx = canvas.getContext("2d");

  function resize(){
    const r = canvas.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    canvas.width = r.width * d;
    canvas.height = r.height * d;
    ctx.setTransform(d,0,0,d,0,0);
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,r.width,r.height);
    ctx.strokeStyle="#111";
    ctx.lineWidth=2.5;
    ctx.lineCap="round";
  }

  resize();

  let drawing=false,last=null;

  const pos=e=>{
    const b=canvas.getBoundingClientRect();
    return {x:e.clientX-b.left,y:e.clientY-b.top};
  };

  canvas.onpointerdown=e=>{
    canvas.setPointerCapture(e.pointerId);
    drawing=true;
    last=pos(e);
  };
  canvas.onpointermove=e=>{
    if(!drawing) return;
    const p=pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
    last=p;
  };
  canvas.onpointerup=()=>{
    drawing=false;
    currentDoc.signature=canvas.toDataURL("image/png");
  };

  sig={
    load(data){
      const img=new Image();
      img.onload=()=>{
        resize();
        ctx.drawImage(img,0,0,canvas.width/(window.devicePixelRatio||1),canvas.height/(window.devicePixelRatio||1));
      };
      img.src=data;
    },
    clear(){
      resize();
      currentDoc.signature="";
    }
  };

  $("#btnSigClear").onclick=()=>sig.clear();
}

/* ================= SCHLIESSEN ================= */
$("#btnClose").onclick = ()=>{
  showPanel("documents");
  renderDocs();
};

/* ================= INIT ================= */
function showPanel(id){
  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  document.getElementById(id).classList.add("is-active");
}

showPanel("home");
renderDogs();
renderDocs();