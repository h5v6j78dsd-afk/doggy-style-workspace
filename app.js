/* =========================================================
   Doggy Style Workspace – FINAL OPTION B
   Vollständige rechtssichere Hundeannahme / Betreuungsvertrag
   inkl. Pflichtfelder, Unterschrift-Sperre & PDF
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
    locked: false,
    createdAt: Date.now(),
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

  showPanel("editor");
}

/* ================= FORMULAR ================= */
function renderEditorForm(){
  const root=$("#formRoot");
  root.innerHTML="";

  /* HALTER */
  addSection(root,"Angaben zum Hundehalter *",[
    field("halter_name","Vor- und Nachname *"),
    field("halter_strasse","Straße / Hausnummer *"),
    field("halter_plz","PLZ *"),
    field("halter_ort","Ort *"),
    field("halter_tel","Telefon *"),
    field("halter_email","E-Mail *")
  ]);

  /* HUND */
  addSection(root,"Angaben zum Hund *",[
    field("hund_name","Name des Hundes *"),
    field("hund_rasse","Rasse *"),
    select("hund_geschlecht","Geschlecht *",["Rüde","Hündin"]),
    field("hund_alter","Geburtsdatum / Alter *"),
    select("hund_kastriert","Kastriert *",["Ja","Nein"]),
    select("hund_laeufig","Bei Hündin aktuell läufig?",["Nein","Ja"])
  ]);

  /* HAFTPFLICHT */
  addSection(root,"Hundehalter-Haftpflichtversicherung *",[
    field("versicherung","Versicherer *"),
    field("vers_nr","Versicherungsnummer *")
  ]);

  /* NOTFALL */
  addSection(root,"Notfallkontakt *",[
    field("notfall_name","Name *"),
    field("notfall_tel","Telefon *")
  ]);

  /* TIERARZT */
  addSection(root,"Tierarzt *",[
    field("ta_name","Praxis / Name *"),
    field("ta_ort","Ort *"),
    field("ta_tel","Telefon *")
  ]);

  /* GESUNDHEIT */
  addSection(root,"Gesundheit & Medikamente",[
    checkbox("impfung","Impfschutz vollständig *"),
    textarea("krankheiten","Krankheiten / Besonderheiten"),
    textarea("medikamente","Medikamente (Name / Dosierung / Zeiten)")
  ]);

  /* HAFTUNG */
  addSection(root,"Haftung & Betreuung *",[
    checkbox("notfall_einwilligung","Einwilligung zu tierärztlicher Notfallbehandlung *"),
    checkbox("kosten","Übernahme aller entstehenden Kosten *"),
    checkbox("haftung","Haftungsfreistellung für Doggy Style Hundepension *")
  ]);

  /* FOTO */
  addSection(root,"Fotos / Social Media (optional)",[
    checkbox("foto","Einwilligung zur Foto-/Videoverwendung")
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

function textarea(key,label){
  const l=document.createElement("label");
  l.className="field";
  l.innerHTML=`<span>${label}</span>`;
  const i=document.createElement("textarea");
  i.value=currentDoc.fields[key]||"";
  i.oninput=()=>currentDoc.fields[key]=i.value;
  l.appendChild(i);
  return l;
}

function select(key,label,options){
  const l=document.createElement("label");
  l.className="field";
  l.innerHTML=`<span>${label}</span>`;
  const s=document.createElement("select");
  s.innerHTML=`<option value="">– bitte auswählen –</option>`+
    options.map(o=>`<option value="${o}">${o}</option>`).join("");
  s.value=currentDoc.fields[key]||"";
  s.onchange=()=>currentDoc.fields[key]=s.value;
  l.appendChild(s);
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

/* ================= SPEICHERN ================= */
$("#btnSave").onclick=()=>{
  const required=[
    "halter_name","halter_strasse","halter_plz","halter_ort","halter_tel","halter_email",
    "hund_name","hund_rasse","hund_geschlecht","hund_alter","hund_kastriert",
    "versicherung","vers_nr",
    "notfall_name","notfall_tel",
    "ta_name","ta_ort","ta_tel",
    "impfung","notfall_einwilligung","kosten","haftung"
  ];
  const missing=required.filter(k=>!currentDoc.fields[k]);
  if(!currentDoc.signature) missing.push("Unterschrift");

  if(missing.length){
    alert("Bitte noch ausfüllen / bestätigen:\n\n• "+missing.join("\n• "));
    return;
  }

  currentDoc.updatedAt=Date.now();
  currentDoc.locked=true;
  save();
  alert("Gespeichert & abgeschlossen ✅");
};

/* ================= PDF ================= */
$("#btnPrint").onclick=(e)=>{
  e.preventDefault();
  document.body.classList.add("print-mode");
  setTimeout(()=>{
    window.print();
    setTimeout(()=>document.body.classList.remove("print-mode"),500);
  },100);
};

/* ================= SIGNATUR ================= */
function initSignature(){
  const c=$("#sigPad");
  const ctx=c.getContext("2d");

  function resize(){
    const r=c.getBoundingClientRect();
    const d=window.devicePixelRatio||1;
    c.width=r.width*d;
    c.height=r.height*d;
    ctx.setTransform(d,0,0,d,0,0);
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,r.width,r.height);
    ctx.strokeStyle="#111";
    ctx.lineWidth=2.5;
    ctx.lineCap="round";
  }
  resize();

  if(currentDoc.locked){
    c.style.pointerEvents="none";
    $("#btnSigClear").style.display="none";
    return;
  }

  let draw=false,last=null;
  const pos=e=>{
    const b=c.getBoundingClientRect();
    return {x:e.clientX-b.left,y:e.clientY-b.top};
  };

  c.onpointerdown=e=>{
    c.setPointerCapture(e.pointerId);
    draw=true;
    last=pos(e);
  };
  c.onpointermove=e=>{
    if(!draw) return;
    const p=pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
    last=p;
  };
  c.onpointerup=()=>{
    draw=false;
    currentDoc.signature=c.toDataURL("image/png");
  };

  sig={
    load(data){
      const img=new Image();
      img.onload=()=>{
        resize();
        ctx.drawImage(img,0,0,c.width/(window.devicePixelRatio||1),c.height/(window.devicePixelRatio||1));
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

/* ================= UI ================= */
function showPanel(id){
  $$(".panel").forEach(p=>p.classList.remove("is-active"));
  document.getElementById(id).classList.add("is-active");
}

showPanel("home");
renderDogs();
renderDocs();