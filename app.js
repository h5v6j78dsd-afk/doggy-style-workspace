/* =========================================================
   Doggy Style Workspace – FINAL
   Editor + Pflichtfelder + Unterschrift + PDF (iOS-safe)
========================================================= */

const LS_KEY = "ds_final_state";

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
  btn.onclick = ()=>{
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

  renderEditorForm();
  initSignature();

  if(currentDoc.signature){
    sig.load(currentDoc.signature);
  }

  showPanel("editor");
}

/* ================= EDITOR-FORMULAR ================= */
function renderEditorForm(){
  const root = $("#formRoot");
  root.innerHTML = "";

  /* Hund / Kunde */
  const dogCard = document.createElement("div");
  dogCard.className = "card";
  dogCard.innerHTML = "<h2>Halter / Hund *</h2>";

  const sel = document.createElement("select");
  sel.innerHTML =
    `<option value="">– bitte auswählen –</option>` +
    state.dogs.map(d =>
      `<option value="${d.id}">${d.name} (${d.owner || ""})</option>`
    ).join("");

  sel.value = currentDoc.dogId;
  sel.onchange = ()=> currentDoc.dogId = sel.value;

  dogCard.appendChild(sel);
  root.appendChild(dogCard);

  addSection(root,"Angaben zum Hund",[
    field("hund_name","Name des Hundes *"),
    field("hund_rasse","Rasse *"),
    field("hund_alter","Alter / Geburtsdatum *")
  ]);

  addSection(root,"Gesundheit",[
    checkbox("impfung","Impfschutz vollständig *"),
    field("krankheiten","Krankheiten / Besonderheiten")
  ]);

  addSection(root,"Haftung & Vereinbarung",[
    checkbox("angaben_wahr","Angaben wahrheitsgemäß *"),
    checkbox("agb","AGB gelesen & akzeptiert *")
  ]);
}

function addSection(root,title,fields){
  const c=document.createElement("div");
  c.className="card";
  c.innerHTML=`<h2>${title}</h2>`;
  fields.forEach(f=>c.appendChild(f));
  root.appendChild(c);
}

function field(key,label){
  const l=document.createElement("label");
  l.className="field";
  l.innerHTML=`<span>${label}</span>`;
  const i=document.createElement("input");
  i.value=currentDoc.fields[key]||"";
  i.oninput=()=>currentDoc.fields[key]=i.value;
  l.appendChild(i);
  return l;
}

function checkbox(key,label){
  const l=document.createElement("label");
  l.className="field";
  l.innerHTML=`<span>${label}</span>`;
  const i=document.createElement("input");
  i.type="checkbox";
  i.checked=!!currentDoc.fields[key];
  i.onchange=()=>currentDoc.fields[key]=i.checked;
  l.appendChild(i);
  return l;
}

/* ================= SPEICHERN (MIT PRÜFUNG) ================= */
$("#btnSave").onclick = ()=>{
  const missing=[];

  if(!currentDoc.dogId) missing.push("Hund / Kunde");
  if(!currentDoc.fields.hund_name) missing.push("Name des Hundes");
  if(!currentDoc.fields.hund_rasse) missing.push("Rasse");
  if(!currentDoc.fields.hund_alter) missing.push("Alter / Geburtsdatum");
  if(!currentDoc.fields.impfung) missing.push("Impfschutz");
  if(!currentDoc.fields.angaben_wahr) missing.push("Angaben wahrheitsgemäß");
  if(!currentDoc.fields.agb) missing.push("AGB");
  if(!currentDoc.signature) missing.push("Unterschrift");

  if(missing.length){
    alert("Bitte noch ausfüllen:\n\n• "+missing.join("\n• "));
    return;
  }

  currentDoc.title = $("#docName").value || currentDoc.title;
  currentDoc.updatedAt = Date.now();
  save();
  alert("Gespeichert ✅");
};

/* ================= PDF / DRUCKEN (iOS-SAFE) ================= */
$("#btnPrint").onclick = (e)=>{
  e.preventDefault();
  e.stopPropagation();

  document.body.classList.add("print-mode");

  setTimeout(()=>{
    window.print();
    setTimeout(()=>{
      document.body.classList.remove("print-mode");
    },500);
  },100);
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
    currentDoc.signature = canvas.toDataURL("image/png");
  };

  sig = {
    load(data){
      const img=new Image();
      img.onload=()=>{
        resize();
        ctx.drawImage(
          img,
          0,0,
          canvas.width/(window.devicePixelRatio||1),
          canvas.height/(window.devicePixelRatio||1)
        );
      };
      img.src=data;
    },
    clear(){
      resize();
      currentDoc.signature="";
    }
  };

  $("#btnSigClear").onclick = ()=>sig.clear();
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