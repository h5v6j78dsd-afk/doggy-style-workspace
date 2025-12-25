const LS_KEY="ds_workspace_v1";
const CAPACITY = {

// ===== PREISLOGIK & STAFFELUNGEN =====
const PRICE_RULES = {
  Tagesbetreuung: [
    { min: 30, price: 30 },
    { min: 14, price: 35 },
    { min: 7,  price: 37.5 },
    { min: 1,  price: 40 }
  ],
  Urlaubsbetreuung: [
    { min: 30, price: 35 },
    { min: 14, price: 40 },
    { min: 7,  price: 42.5 },
    { min: 1,  price: 45 }
  ]
};

function daysBetween(from, to){
  const ms = new Date(to) - new Date(from);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function getPricePerDay(type, days){
  const rules = PRICE_RULES[type] || [];
  for(const r of rules){
    if(days >= r.min) return r.price;
  }
  return 0;
}

function calculateInvoicePricing(doc){
  const meta = doc.meta || {};
  const f = doc.fields || {};

  if(!meta.betreuung || !meta.von || !meta.bis){
    return null;
  }

  const days = daysBetween(meta.von, meta.bis);
  const daily = getPricePerDay(meta.betreuung, days);
  const base = days * daily;

  let percentExtra = 0;
  let fixedExtra = 0;

  if(f.holiday) percentExtra += 10;
  if(f.special_times) percentExtra += 10;
  if(f.extra_care) percentExtra += 10;

  const percentValue = base * (percentExtra / 100);

  if(f.medication) fixedExtra += days * 2;
  if(f.walk_extra_count) fixedExtra += f.walk_extra_count * 15;
  if(f.bandage_count) fixedExtra += f.bandage_count * 2.5;
  if(f.grooming_count) fixedExtra += f.grooming_count * 5;

  const total = Math.round((base + percentValue + fixedExtra) * 100) / 100;

  doc.pricing = {
    days,
    daily,
    base,
    percentExtra,
    percentValue,
    fixedExtra,
    total
  };

  return doc.pricing;
}
// ===== ENDE PREISLOGIK =====

  Urlaubsbetreuung: 10,
  Tagesbetreuung: 12
};
const state=loadState();const COMPANY = {
  name: "Doggy Style Hundepension",
  owner: "Raphael Boch",
  street: "Im Moos 4",
  zipCity: "88167 Stiefenhofen",
  phone: "0170 7313587",
  email: "info@doggy-style-hundepension.de",

  bank: {
    name: "Musterbank",
    iban: "DE00 0000 0000 0000 0000 00",
    bic: "MUSTERDEFFXXX"
  },

  tax: {
    vatId: "",        // falls vorhanden
    taxNumber: ""     // falls vorhanden
  },

  paymentTargetDays: 14
};;if(state.nextInvoiceNumber == null){
  state.nextInvoiceNumber = 1;
}renderOccupancy();renderTodayStatus();
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
function formatDateDE(dateStr){
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE");
}

function showPanel(id){
  document.querySelectorAll(".panel").forEach(p=>{
    p.classList.toggle("is-active", p.id === id);
  });

  if(id === "invoices"){
    renderInvoiceList();
  }
}

$$(".tab").forEach(b=>b.addEventListener("click",()=>{
  $$(".tab").forEach(x=>x.classList.toggle("is-active",x===b));
  showPanel(b.dataset.tab);
}));

let templates=[];
async function loadTemplates(){
  const res1 = await fetch("templates/hundeannahme.json");
  const res2 = await fetch("templates/rechnung.json");

  const t1 = await res1.json();
  const t2 = await res2.json();

  templates = [t1, t2];

  const sel = document.getElementById("templateSelect");
  if (sel) {
    sel.innerHTML = templates
      .map(t => `<option value="${t.id}">${t.name}</option>`)
      .join("");
  }
}
const getTemplate=id=>templates.find(t=>t.id===id);

function uid(){return Math.random().toString(16).slice(2)+Date.now().toString(16);}
function escapeHtml(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function overlaps(aFrom, aTo, bFrom, bTo){
  return !(aTo < bFrom || aFrom > bTo);
}

function countOccupancy(type, from, to, excludeDocId){
  return state.docs.filter(d=>{
    if(!d.saved) return false;
    if(d.id === excludeDocId) return false;
    if(d.meta?.betreuung !== type) return false;
    if(!d.meta?.von || !d.meta?.bis) return false;

    return overlaps(d.meta.von, d.meta.bis, from, to);
  }).length;
}
function getNextDays(n){
  const days = [];
  const d = new Date();

  for(let i = 0; i < n; i++){
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    days.push(x.toISOString().slice(0,10));
  }

  return days;
}
function countForDay(type, day){
  return state.docs.filter(d=>{
    if(!d.saved) return false;
    if(d.meta?.betreuung !== type) return false;
    if(!d.meta?.von || !d.meta?.bis) return false;

    return day >= d.meta.von && day <= d.meta.bis;
  }).length;
}
function countToday(type){
  const today = new Date().toISOString().slice(0,10);
  return countForDay(type, today);
}
function renderTodayStatus(){
  const el = document.getElementById("todayStatus");
  if(!el) return;

  const u = countToday("Urlaubsbetreuung");
  const t = countToday("Tagesbetreuung");

  el.innerHTML = `
    <div class="status-cards">
      <div class="status-card">
        <strong>Urlaubsbetreuung</strong><br>
        ${u} / ${CAPACITY.Urlaubsbetreuung} Hunde
      </div>
      <div class="status-card">
        <strong>Tagesbetreuung</strong><br>
        ${t} / ${CAPACITY.Tagesbetreuung} Hunde
      </div>
    </div>
  `;
}
function renderOccupancy(){
  const el = document.getElementById("occupancy");
  if(!el) return;

  const days = getNextDays(14);

  el.innerHTML = `
    <table class="occ-table">
      <thead>
        <tr>
          <th>Datum</th>
          <th>Urlaubsbetreuung</th>
          <th>Tagesbetreuung</th>
        </tr>
      </thead>
      <tbody>
        ${days.map(day=>{
          const u = countForDay("Urlaubsbetreuung", day);
          const t = countForDay("Tagesbetreuung", day);
          return `
            <tr>
              <td>${formatDateDE(day)}</td>
              <td>${u} / ${CAPACITY.Urlaubsbetreuung}</td>
              <td>${t} / ${CAPACITY.Tagesbetreuung}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}
function getInvoices(){
  return state.docs.filter(d => d.type === "invoice");
}
function renderInvoiceList(){
  const el = document.getElementById("invoiceList");
  if(!el) return;

  const invoices = getInvoices();

  if(!invoices.length){
    el.innerHTML = "<p>Noch keine Rechnungen vorhanden.</p>";
    return;
  }

  el.innerHTML = `
    <table class="invoice-table">
     <thead>
  <tr>
    <th>Nr.</th>
    <th>Zeitraum</th>
    <th>Betrag</th>
    <th>Status</th>
  </tr>
</thead>
<tbody>
  ${invoices.map(inv => `
    <tr onclick="openInvoice('${inv.id}')">
 <td>${inv.invoiceNumber || "-"}</td>
      <td>${inv.period.from} – ${inv.period.to}</td>
      <td>${inv.pricing.total.toFixed(2)} €</td>
      <td>${inv.status}</td>
    </tr>
  `).join("")}
</tbody>
    </table>
  `;
}
function openInvoice(id){
  const inv = state.docs.find(d => d.id === id);
  if(!inv) return;

  const el = document.getElementById("invoiceView");
  if(!el) return;

  el.innerHTML = `
    <div class="card">
      <h3>Rechnung</h3>

      <p><strong>Zeitraum:</strong>
        ${inv.period.from} – ${inv.period.to}
      </p>

<p>
  <strong>Status:</strong>
  <span id="invoiceStatus">${inv.status}</span>
</p>
<div class="row">
  <button class="btn" onclick="setInvoiceStatus('${inv.id}','paid')">
    ✅ Als bezahlt markieren
  </button>

  <button class="btn secondary" onclick="setInvoiceStatus('${inv.id}','cancelled')">
    ❌ Stornieren
  </button>
</div>

      <hr>

      <p>
        ${inv.pricing.days} Tage ×
        ${inv.pricing.daily.toFixed(2)} €
      </p>

      <p>
        Grundpreis:
        ${inv.pricing.base.toFixed(2)} €
      </p>

      <p>
        Zuschläge (%):
        ${inv.pricing.percentExtra}% →
        ${inv.pricing.percentValue.toFixed(2)} €
      </p>

      <p>
        Zuschläge (fix):
        ${inv.pricing.fixedExtra.toFixed(2)} €
      </p>

      <hr>
      <h3>Gesamt:
        ${inv.pricing.total.toFixed(2)} €
      </h3>
<button class="btn" onclick="printInvoice('${inv.id}')">
  🖨️ Rechnung drucken / PDF
</button>
    </div>
  `;
}
function setInvoiceStatus(id, status){
  const inv = state.docs.find(d => d.id === id);
  if(!inv) return;

  inv.status = status;
  saveState();

  openInvoice(id);      // Detailansicht aktualisieren
  renderInvoiceList(); // Liste aktualisieren
}
function printInvoice(id){
  const inv = state.docs.find(d => d.id === id);
  if(!inv) return;

  const w = window.open("", "_blank");
w.document.write(`
<html>
<head>
  <title>Rechnung</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { margin-top: 40px; }
    .header { margin-bottom: 30px; }
    .small { font-size: 12px; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    td, th { border: 1px solid #ccc; padding: 8px; }
    .right { text-align: right; }
  </style>
</head>
<body>

  <div class="header">
    <strong>${COMPANY.name}</strong><br>
    ${COMPANY.owner}<br>
    ${COMPANY.street}<br>
    ${COMPANY.zipCity}<br>
    Tel: ${COMPANY.phone}<br>
    ${COMPANY.email}<br>
    ${COMPANY.tax.vatId ? "USt-ID: " + COMPANY.tax.vatId + "<br>" : ""}
    ${COMPANY.tax.taxNumber ? "Steuernr.: " + COMPANY.tax.taxNumber + "<br>" : ""}
  </div>

  <h1>Rechnung</h1>
<p>
  <strong>Rechnungsnummer:</strong> ${inv.invoiceNumber}<br>
  <strong>Rechnungsdatum:</strong>
  ${new Date(inv.invoiceDate).toLocaleDateString()}
</p>

      <p><strong>Zeitraum:</strong>
        ${inv.period.from} – ${inv.period.to}
      </p>

      <table>
        <tr>
          <th>Position</th>
          <th class="right">Betrag</th>
        </tr>
        <tr>
          <td>Grundpreis</td>
          <td class="right">${inv.pricing.base.toFixed(2)} €</td>
        </tr>
        <tr>
          <td>Zuschläge (%)</td>
          <td class="right">${inv.pricing.percentValue.toFixed(2)} €</td>
        </tr>
        <tr>
          <td>Zuschläge (fix)</td>
          <td class="right">${inv.pricing.fixedExtra.toFixed(2)} €</td>
        </tr>
        <tr>
          <th>Gesamt</th>
          <th class="right">${inv.pricing.total.toFixed(2)} €</th>
        </tr>
      </table>

      <script>
        window.print();
        window.onafterprint = () => window.close();
      </script>

    </body>
    </html>
  `);

  w.document.close();
}
function loadState(){try{const raw=localStorage.getItem(LS_KEY);return raw?JSON.parse(raw):{dogs:[],docs:[]};}catch{return {dogs:[],docs:[]};}}
function saveState(){localStorage.setItem(LS_KEY,JSON.stringify(state));}

function ensureDefaultDog(){
  if(!state.dogs || state.dogs.length===0){
    state.dogs=[{id:uid(),name:"— Bitte auswählen —",owner:"",phone:"",isPlaceholder:true}];
  }
}
function syncDogSelect(){
  ensureDefaultDog();
  $("#dogSelect").innerHTML=state.dogs.map(d=>{
    const label=d.isPlaceholder?d.name:`${d.owner?d.owner+" – ":""}${d.name}`;
    return `<option value="${d.id}">${escapeHtml(label)}</option>`;
  }).join("");
}
function renderDogs(){
  ensureDefaultDog();
  const list=$("#dogList");
  list.innerHTML="";
  const dogs=state.dogs.filter(d=>!d.isPlaceholder);
  dogs.forEach(d=>{
    const el=document.createElement("div");
    el.className="item";
    el.innerHTML=`<div><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(d.owner||"")} · ${escapeHtml(d.phone||"")}</small></div>
      <div class="actions"><button class="smallbtn" data-e="1">Bearbeiten</button><button class="smallbtn" data-d="1">Löschen</button></div>`;
    el.querySelector('[data-e="1"]').onclick=()=>editDog(d.id);
    el.querySelector('[data-d="1"]').onclick=()=>{
      if(confirm("Hund/Kunde wirklich löschen?")){
        state.dogs=state.dogs.filter(x=>x.id!==d.id);
        saveState(); renderDogs();
      }
    };
    list.appendChild(el);
  });
  if(!dogs.length) list.innerHTML=`<div class="muted">Noch keine Hunde/Kunden angelegt.</div>`;
  syncDogSelect();
}
$("#btnAddDog").addEventListener("click",()=>{
  const name=prompt("Name Hund (z.B. Bello):");
  if(!name) return;
  const owner=prompt("Name Halter (z.B. Müller):")||"";
  const phone=prompt("Telefon Halter:")||"";
  state.dogs.push({id:uid(),name,owner,phone,note:""});
  saveState(); renderDogs();
});
function editDog(id){
  const d=state.dogs.find(x=>x.id===id);
  if(!d) return;
  d.name=prompt("Name Hund:",d.name) ?? d.name;
  d.owner=prompt("Name Halter:",d.owner||"") ?? (d.owner||"");
  d.phone=prompt("Telefon:",d.phone||"") ?? (d.phone||"");
  saveState(); renderDogs();
}

function renderDocs(){
  const list=$("#docList");
  list.innerHTML="";
  const docs=(state.docs||[]).slice().sort((a,b)=>b.updatedAt-a.updatedAt);
  docs.forEach(d=>list.appendChild(docItem(d)));
  if(!docs.length) list.innerHTML=`<div class="muted">Noch keine Dokumente erstellt.</div>`;
  renderRecent();
}
function renderRecent(){
  const list=$("#recentList");
  const docs=(state.docs||[]).slice().sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,3);
  list.innerHTML="";
  docs.forEach(d=>list.appendChild(docItem(d)));
  if(!docs.length) list.innerHTML=`<div class="muted">Noch keine Dokumente.</div>`;
}
function docItem(d){
  const el=document.createElement("div");
  el.className="item";
  const dt=new Date(d.updatedAt).toLocaleString("de-DE");
  el.innerHTML=`<div><strong>${escapeHtml(d.title||"Dokument")}</strong><small>${escapeHtml(d.templateName)} · zuletzt: ${dt}</small></div>
    <div class="actions"><button class="smallbtn" data-o="1">Öffnen</button><button class="smallbtn" data-p="1">PDF</button><button class="smallbtn" data-x="1">Löschen</button></div>`;
  el.querySelector('[data-o="1"]').onclick=()=>openDoc(d.id);
  el.querySelector('[data-p="1"]').onclick=()=>{openDoc(d.id); setTimeout(()=>printDoc(),150);};
  el.querySelector('[data-x="1"]').onclick=()=>{
    if(confirm("Dokument wirklich löschen?")){
      state.docs=state.docs.filter(x=>x.id!==d.id);
      saveState(); renderDocs();
    }
  };
  return el;
}

$("#btnNewDoc").addEventListener("click",()=>createDoc($("#templateSelect").value));
function createDoc(tid){
  const t=getTemplate(tid);
  if(!t) return;
  const now = new Date().toISOString();
  const docObj={id:uid(),templateId:t.id,templateName:t.name,title:t.name,dogId:state.dogs?.[0]?.id||"",fields:{},signature: null,saved: false,
versionOf: null,meta: {
  betreuung: "",
  von: "",
  bis: ""
},createdAt:now,updatedAt:now};
  state.docs=state.docs||[];
  state.docs.unshift(docObj);
  saveState();
  openDoc(docObj.id);
}

let currentDoc=null, dirty=false;
function normalizeMeta(doc){
  doc.meta = doc.meta || {};
  doc.meta.betreuung = doc.meta.betreuung || "";
  doc.meta.von = doc.meta.von || "";
  doc.meta.bis = doc.meta.bis || "";
}
function renderVersions(doc){
  const box = document.getElementById("versionBox");
  if(!box) return;

  const versions = getDocumentVersions(doc);

  if(versions.length <= 1){
    box.innerHTML = "<strong>Versionen:</strong> Nur diese Version vorhanden.";
    return;
  }

  box.innerHTML = `
    <strong>Versionen:</strong>
    <ul style="margin:6px 0 0 16px">
      ${versions.map((v,i)=>`
        <li>
          ${v.id === doc.id ? "➡️ <strong>" : ""}
          Version ${i+1}
          (${new Date(v.createdAt).toLocaleString("de-DE")})
          ${v.saved ? "✔️" : "✏️"}
          ${v.id === doc.id ? "</strong>" : ""}
        </li>
      `).join("")}
    </ul>
  `;
}
function openDoc(id){
updateCreateInvoiceButton();
  currentDoc=(state.docs||[]).find(d=>d.id===id);
  if(!currentDoc) return;
normalizeMeta(currentDoc);
  $("#editorTitle").textContent=currentDoc.title||"Dokument";
  $("#editorMeta").textContent=currentDoc.templateName;
  $("#docName").value=currentDoc.title||"";
  syncDogSelect();
  $("#dogSelect").value=currentDoc.dogId||state.dogs?.[0]?.id||"";
  renderEditor(currentDoc);
renderVersions(currentDoc);
  
  $("#dsGvoText").textContent=getTemplate(currentDoc.templateId)?.dsGvoNote||"";
  dirty=false;
  showPanel("editor");
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderForm(docObj){
  const root=$("#formRoot"); root.innerHTML="";
  const t=getTemplate(docObj.templateId);
  t.sections.forEach(sec=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<h2>${escapeHtml(sec.title)}</h2>`;
    sec.fields.forEach(f=>card.appendChild(renderField(f, docObj.fields[f.key])));
    root.appendChild(card);
  });
  const meta=document.createElement("div");
  meta.className="card";
  meta.innerHTML=`<h2>Ort / Datum</h2>`;
  t.meta.forEach(f=>meta.appendChild(renderField(f, docObj.meta[f.key])));
  root.appendChild(meta);
const sigCard = document.createElement("div");
sigCard.className = "card";

const sig = docObj.signature;

sigCard.innerHTML = `
  <h2>Unterschrift</h2>
  ${
    sig
      ? `<p class="muted">
           ✔ Unterschrieben am ${new Date(sig.signedAt).toLocaleString("de-DE")}
         </p>`
      : `<button id="btnSignatureOpen" class="primary">
           ✍️ Unterschrift erfassen
         </button>`
  }
`;

root.appendChild(sigCard);
}
function renderField(f,value){
  const wrap=document.createElement("label");
  wrap.className="field"; wrap.style.minWidth="260px";
  wrap.innerHTML=`<span>${escapeHtml(f.label)}${f.required?" *":""}</span>`;
  let input;
  if(f.type==="textarea"){ input=document.createElement("textarea"); input.value=value||""; }
  else if(f.type==="select"){ input=document.createElement("select"); input.innerHTML=(f.options||[]).map(o=>`<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join(""); input.value=value||(f.options?.[0]||""); }
  else if(f.type==="checkbox"){ input=document.createElement("input"); input.type="checkbox"; input.checked=!!value; input.style.width="22px"; input.style.height="22px"; }
  else { input=document.createElement("input"); input.type=f.type||"text"; input.value=value||""; }
  input.dataset.key=f.key; input.dataset.ftype=f.type;
  input.oninput = () => {
  if (currentDoc.saved) {
    forkDocument();
  }
  dirty = true;
};

input.onchange = () => {
  if (currentDoc.saved) {
    forkDocument();
  }
  dirty = true;
};
if (currentDoc.saved) {
  input.disabled = true;
}
  
wrap.appendChild(input);
  return wrap;
}

$("#docName").addEventListener("input", () => {
  if (currentDoc.saved) {
    forkDocument();
  }
  dirty = true;
});

$("#dogSelect").addEventListener("change", () => {
  if (currentDoc.saved) {
    forkDocument();
  }
  dirty = true;
});

$("#btnSave").addEventListener("click",()=>saveCurrent(true));
$("#btnClose").addEventListener("click",()=>{
  if(dirty && !confirm("Änderungen sind nicht gespeichert. Schließen?")) return;
  $$(".tab").forEach((t,i)=>t.classList.toggle("is-active", i===0));
  showPanel("home");
  renderDocs();
});

function collectForm(){
  const t=getTemplate(currentDoc.templateId);
  const fields={}, meta={};
  $$("#formRoot [data-key]").forEach(inp=>{
    const key=inp.dataset.key, type=inp.dataset.ftype;
    const val=(type==="checkbox")?inp.checked:inp.value;
    if(t.meta.some(m=>m.key===key)) meta[key]=val; else fields[key]=val;
  });
  return {fields, meta};
}
function validate(docObj,t){
  const errs=[];
  t.sections.forEach(sec=>sec.fields.forEach(f=>{
    if(!f.required) return;
    const v=docObj.fields[f.key];
    if(f.type==="checkbox"){ if(!v) errs.push(f.label); }
    else { if(!v || String(v).trim()==="") errs.push(f.label); }
  }));
  t.meta.forEach(f=>{ if(f.required){const v=docObj.meta[f.key]; if(!v||String(v).trim()==="") errs.push(f.label);} });
  if(!docObj.signature || !docObj.signature.dataUrl)
  errs.push("Unterschrift");
  return errs;
}
function updateCreateInvoiceButton(){
  const btn = document.getElementById("btnCreateInvoice");
  if(!btn) return;

  const ok =
    currentDoc &&
    currentDoc.saved &&
    currentDoc.pricing &&
    !state.docs.some(d =>
      d.type === "invoice" && d.sourceDocId === currentDoc.id
    );

  btn.style.display = ok ? "inline-block" : "none";
}
function saveCurrent(alertOk){
updateCreateInvoiceButton();
  if(!currentDoc) return false;
  const t=getTemplate(currentDoc.templateId);
  const {fields, meta}=collectForm();
  currentDoc.title=$("#docName").value.trim()||currentDoc.templateName;
  currentDoc.dogId=$("#dogSelect").value;
  currentDoc.fields=fields;
currentDoc.meta=meta;

// 🔢 Preislogik anwenden
if (currentDoc.meta?.betreuung && currentDoc.meta?.von && currentDoc.meta?.bis) {
  calculateInvoicePricing(currentDoc);
}

  currentDoc.meta=meta;
$("#docName").disabled = currentDoc.saved;
$("#dogSelect").disabled = currentDoc.saved;
  
  const errs=validate(currentDoc,t);
  if(errs.length){
    alert("Bitte noch ausfüllen/abhaken:\n\n• "+errs.join("\n• "));
    return false;
  }
const type = currentDoc.meta.betreuung;
const from = currentDoc.meta.von;
const to   = currentDoc.meta.bis;

const used = countOccupancy(type, from, to, currentDoc.id);
const limit = CAPACITY[type];

if (used >= limit) {
  alert(
    `⚠️ Achtung:\n\n` +
    `${used} von ${limit} Plätzen für "${type}" ` +
    `im Zeitraum ${from} – ${to} sind bereits belegt.`
  );
}
if (!currentDoc.signature){
  alert("Bitte unterschreiben");
  return false;
}
  currentDoc.saved = true;                             // 🔐 Dokument abschließen
currentDoc.updatedAt = new Date().toISOString();     // sauberer Zeitstempel

saveState();renderOccupancy(); renderTodayStatus();                                         // EINMAL speichern
dirty = false;

$("#editorTitle").textContent = currentDoc.title;
if(alertOk) alert("Gespeichert");
renderDocs();

return true;

}
document.getElementById("btnCreateInvoice")
  ?.addEventListener("click", () => {
    if(!currentDoc) return;
    createInvoiceFromDoc(currentDoc);
    alert("Rechnung wurde erstellt");
    updateCreateInvoiceButton();
  });
function createInvoiceFromDoc(doc){
  if(!doc || !doc.pricing) return;

  const year = new Date().getFullYear();
  const number = String(state.nextInvoiceNumber).padStart(4, "0");

  const invoice = {
    id: uid(),
    type: "invoice",

    sourceDocId: doc.id,
    dogId: doc.dogId,

    period: {
      from: doc.meta.von,
      to: doc.meta.bis
    },

    pricing: doc.pricing,

    status: "draft",

    invoiceNumber: `${year}-${number}`,
    invoiceDate: new Date().toISOString(),

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.docs.push(invoice);
  state.nextInvoiceNumber++;

  saveState();
  renderInvoiceList();
}
function forkDocument() {
  if (!currentDoc || !currentDoc.saved) return;

  const originalId = currentDoc.versionOf || currentDoc.id;

  const fork = JSON.parse(JSON.stringify(currentDoc));

  fork.id = uid();
  fork.saved = false;
  fork.versionOf = originalId;
  fork.createdAt = new Date().toISOString();
  fork.updatedAt = fork.createdAt;

  // neue Version → neue Unterschrift erforderlich
  fork.signature = null;

  state.docs.unshift(fork);
  currentDoc = fork;

  saveState();
}
function getDocumentVersions(doc){
  const rootId = doc.versionOf || doc.id;

  return (state.docs || [])
    .filter(d => d.id === rootId || d.versionOf === rootId)
    .sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
}

// ===== Overlay-Signatur (Weg A) =====
function openSignatureOverlay(onDone){
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center";
  overlay.innerHTML=`
    <div style="background:#fff;border-radius:14px;padding:12px;width:92%;max-width:560px">
      <canvas id="sigCanvas" style="width:100%;height:180px;background:#fff;border:1px solid #ccc;border-radius:10px"></canvas>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button id="sigClear">Löschen</button>
        <button id="sigCancel">Abbrechen</button>
        <button id="sigOk">Übernehmen</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow="hidden";

  const canvas=overlay.querySelector("#sigCanvas");
  const ctx=canvas.getContext("2d");
  const ratio=Math.max(window.devicePixelRatio||1,1);
  const w=canvas.clientWidth,h=canvas.clientHeight;
  canvas.width=w*ratio; canvas.height=h*ratio;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.lineWidth=2.5; ctx.lineCap="round";

  let draw=false,lx=0,ly=0;
  const pos=e=>{
    const r=canvas.getBoundingClientRect();
    const p=e.touches?e.touches[0]:e;
    return {x:p.clientX-r.left,y:p.clientY-r.top};
  };
  const start=e=>{draw=true;({x:lx,y:ly}=pos(e)); e.preventDefault();};
  const move=e=>{
    if(!draw) return;
    const p=pos(e);
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(p.x,p.y); ctx.stroke();
    lx=p.x; ly=p.y; e.preventDefault();
  };
  const end=()=>draw=false;

  canvas.addEventListener("mousedown",start);
  canvas.addEventListener("mousemove",move);
  window.addEventListener("mouseup",end);
  canvas.addEventListener("touchstart",start,{passive:false});
  canvas.addEventListener("touchmove",move,{passive:false});
  canvas.addEventListener("touchend",end);

  overlay.querySelector("#sigClear").onclick=()=>ctx.clearRect(0,0,canvas.width,canvas.height);
  overlay.querySelector("#sigCancel").onclick=close;
  overlay.querySelector("#sigOk").onclick=()=>{onDone(canvas.toDataURL("image/png")); close();};

  function close(){document.body.style.overflow=""; overlay.remove();}
}

document.addEventListener("click",(e)=>{
  if(e.target && e.target.id==="btnSignatureOpen"){
    e.preventDefault();
    openSignatureOverlay(data=>{ if(currentDoc){ currentDoc.signature = {
  dataUrl: data,
  signedAt: new Date().toISOString(),
  dogId: currentDoc.dogId || null
};
dirty = true;
renderForm(currentDoc);} });
  }
});

$("#btnPrint").addEventListener("click",()=>printDoc());
function printDoc(){
  if(!currentDoc) return;
  if(!saveCurrent(false)) return;
  const t=getTemplate(currentDoc.templateId);
  const dog=state.dogs.find(d=>d.id===currentDoc.dogId) || null;
  const html=buildPrintHtml(currentDoc,t,dog);
  const win=window.open("","_blank");
  if(!win){ alert("Popup blockiert. Bitte Popups erlauben."); return; }
  win.document.open(); win.document.write(html); win.document.close();
  win.focus();
  setTimeout(()=>win.print(),300);
}

function buildPrintHtml(docObj,t,dog){
  const dt=new Date(docObj.updatedAt).toLocaleString("de-DE");
  const dogLine=dog && !dog.isPlaceholder ? `${dog.owner?escapeHtml(dog.owner)+" – ":""}${escapeHtml(dog.name)}` : "—";
  const sigImg = docObj.signature
  ? `<img class="sig" src="${docObj.signature.dataUrl}" alt="Unterschrift" />`
  : "";
  let out=`<div class="head"><div><h1>${escapeHtml(docObj.title||t.name)}</h1><div class="meta">Hund/Kunde: ${dogLine} · Stand: ${dt}</div></div><img class="logo" src="assets/logo.png" /></div>`;
  t.sections.forEach(sec=>{
    out+=`<h2>${escapeHtml(sec.title)}</h2><table>`;
    sec.fields.forEach(f=>{
      let v=docObj.fields[f.key];
      if(f.type==="checkbox") v=v?"Ja":"Nein";
      out+=`<tr><td class="k">${escapeHtml(f.label)}</td><td class="v">${escapeHtml(String(v??""))}</td></tr>`;
    });
    out+=`</table>`;
  });
  out+=`<h2>Ort / Datum</h2><table><tr><td class="k">Ort / Datum</td><td class="v">${escapeHtml(docObj.meta.ort_datum||"")}</td></tr></table>`;
  out+=`<h2>Unterschrift Hundehalter</h2><div class="sigbox">${sigImg}</div>`;
  out+=`<h2>Datenschutz (DSGVO)</h2><p class="note">${escapeHtml(t.dsGvoNote||"")}</p>`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(docObj.title||"Dokument")}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,sans-serif;margin:28px;color:#111}
.head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:18px}
.logo{height:44px}
h1{margin:0;font-size:20px}
.meta{color:#555;font-size:12px;margin-top:2px}
h2{margin:18px 0 8px;font-size:14px}
table{width:100%;border-collapse:collapse;font-size:12px}
td{padding:8px 10px;border:1px solid #ddd;vertical-align:top}
td.k{width:38%;background:#fafafa;font-weight:700}
.sigbox{border:1px solid #ddd;border-radius:12px;height:120px;display:flex;align-items:center;justify-content:center;background:#fff}
.sig{max-height:105px;max-width:95%}
.note{font-size:11px;color:#444;line-height:1.35}
@media print{body{margin:16mm}}
</style></head><body>${out}</body></html>`;
}

$("#btnExportAll").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  const stamp=new Date().toISOString().slice(0,10);
  a.href=URL.createObjectURL(blob);
  a.download=`DoggyStyleWorkspace_Backup_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#btnWipe").addEventListener("click",()=>{
  if(!confirm("Wirklich alle lokalen Daten löschen?")) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
});

(async function boot(){
  await loadTemplates();
  ensureDefaultDog();
  saveState();
  renderDogs();
  renderDocs();
  showPanel("home");
})();
// ===== B1 Rechnung Editor =====
function renderEditor(doc){
  const template = getTemplate(doc.templateId);

  if (!template) {
    console.warn("Template nicht gefunden:", doc.templateId);
    return;
  }

  // Rechnung explizit abfangen
  if (template.id === "rechnung") {
    renderInvoiceEditor(doc, template);
    return;
  }

  // Standard: normale Formulare (Hundeannahme etc.)
  renderForm(doc);
}

function renderInvoiceEditor(doc, template){
  const root = document.getElementById("formRoot");
  if(!root) return;

  root.innerHTML = "";

  const data = doc.fields || {};
  doc.fields = data;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = "<h2>Rechnung</h2>";
  root.appendChild(card);

  template.fields.forEach(field=>{
    const wrap = document.createElement("label");
    wrap.className = "field";
    wrap.style.minWidth = "260px";

    wrap.innerHTML = `<span>${escapeHtml(field.label)}</span>`;

    let input;
    if(field.type === "select"){
      input = document.createElement("select");
      field.options.forEach(o=>{
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        input.appendChild(opt);
      });
      input.value = data[field.key] || field.options[0].value;
      input.onchange = ()=>{ data[field.key] = input.value; };
    } else {
      input = document.createElement("input");
      input.type = field.type || "text";
      input.value = data[field.key] || "";
      input.oninput = ()=>{ data[field.key] = input.value; };
    }

    wrap.appendChild(input);
    card.appendChild(wrap);
  });

  const price = document.createElement("div");
  price.className = "card";
  price.innerHTML = `
    <h2>Gesamtbetrag</h2>
    <strong id="invoiceTotal">
      ${doc.pricing?.total?.toFixed(2) || "0.00"} €
    </strong>
  `;
  root.appendChild(price);
}

function updatePriceBlock(){
  const el=document.getElementById("total-price");
  if(el) el.textContent="wird berechnet…";
}
// ===== Ende B1 =====
